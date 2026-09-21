import fs from 'fs';
import path from 'path';
import { RawJobListing } from '../types';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

export async function scrapeLinkedInHiringPosts(
  sessionDir: string = './linkedin-session',
  keywords: string = 'React Native'
): Promise<RawJobListing[]> {
  const fullSessionPath = path.resolve(sessionDir);

  if (!fs.existsSync(fullSessionPath)) {
    console.log(
      'ℹ️  LinkedIn session not found at ./linkedin-session. Skipping post scraping. (Run `npm run linkedin-login` to enable).'
    );
    return [];
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    console.warn('⚠️  Playwright is not installed or available. Skipping LinkedIn post scraper.');
    return [];
  }

  const results: RawJobListing[] = [];
  let context;

  try {
    console.log('🔍 Launching persistent browser context for LinkedIn hiring posts...');
    const launchOptions: any = {
      headless: true,
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    };

    try {
      context = await playwright.chromium.launchPersistentContext(fullSessionPath, launchOptions);
    } catch (launchErr: any) {
      if (launchErr.message && launchErr.message.includes("Executable doesn't exist")) {
        context = await playwright.chromium.launchPersistentContext(fullSessionPath, {
          ...launchOptions,
          channel: 'chrome',
        });
      } else {
        throw launchErr;
      }
    }

    const page = await context.newPage();
    const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(
      `"${keywords}" AND ("hiring" OR "send cv" OR "email" OR "contract")`
    )}&sortBy="date_posted"`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);

    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/authwall') || currentUrl.includes('/checkpoint')) {
      console.warn(`[LinkedIn Posts] ⚠️ LinkedIn session expired or requires re-authentication. Run "npm run linkedin-login" to renew session.`);
      return [];
    }

    // Scroll 2-3 times with randomized delay to load posts
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 800 + Math.random() * 400);
      await page.waitForTimeout(2000 + Math.random() * 1500);
    }

    const posts = await page.evaluate(() => {
      // First click any "...see more" buttons to expand truncated post descriptions
      document.querySelectorAll('button.feed-shared-inline-show-more-text__see-more-less-toggle, button.see-more').forEach((btn: any) => {
        try { btn.click(); } catch {}
      });

      const items: Array<{ author: string; text: string; postUrl: string }> = [];
      const cards = document.querySelectorAll('.feed-shared-update-v2, div[data-urn*="urn:li:activity"], .feed-shared-update-v2__content, .search-results-container article');

      cards.forEach((card) => {
        const authorEl = card.querySelector('.update-components-actor__name, .feed-shared-actor__name, span.update-components-actor__title');
        const textEl = card.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .update-components-text, .feed-shared-inline-show-more-text');
        const linkEl = card.querySelector('a.app-aware-link, a[href*="/feed/update/"]') as HTMLAnchorElement;

        const author = authorEl?.textContent?.trim().split('\n')[0] || 'Hiring Manager';
        const text = textEl?.textContent?.trim() || '';
        const postUrl = linkEl?.href || '';

        if (text && text.length > 20) {
          items.push({ author, text, postUrl });
        }
      });
      return items;
    });

    for (const post of posts) {
      const emails = post.text.match(EMAIL_REGEX) || [];
      const recruiterEmail = emails.length > 0 ? emails[0] : undefined;

      results.push({
        source: 'linkedin_post',
        company: post.author,
        title: `${keywords} Opportunity (via LinkedIn Post)`,
        apply_url: post.postUrl || 'https://www.linkedin.com/feed/',
        location_raw: 'Remote',
        description_text: `${post.text}\n\nKeywords: ${keywords} (Remote)`,
        recruiter_name: post.author,
        recruiter_email: recruiterEmail,
      });
    }
  } catch (err: any) {
    console.error('[LinkedIn Posts] Error during post scrape:', err.message);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
  }

  return results;
}
