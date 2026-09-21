import * as cheerio from 'cheerio';
import { RawJobListing } from '../types';

export async function fetchLinkedInGuestJobs(
  keywords: string = 'React Native',
  location: string = 'Worldwide',
  days: number = 7
): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    const seconds = Math.max(1, days) * 86400;
    // f_TPR: time posted in seconds, f_WT=2: remote work only
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      keywords
    )}&location=${encodeURIComponent(location)}&f_TPR=r${seconds}&f_WT=2`;

    console.log(`[LinkedIn Guest] Requesting: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.warn(`[LinkedIn Guest] ⚠️ Search for "${keywords}" in ${location} returned HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const html = await response.text();
    console.log(`[LinkedIn Guest] Received response for ${location}: ${html.length} bytes`);
    const $ = cheerio.load(html);

    $('li, .job-search-card, .base-card').each((_, el) => {
      const title = $(el).find('.base-search-card__title, .job-search-card__title, h3').first().text().trim();
      const company = $(el).find('.base-search-card__subtitle, .job-search-card__subtitle, h4, a[data-tracking-control-name*="subtitle"]').first().text().trim();
      const loc = $(el).find('.job-search-card__location, .base-search-card__metadata span').first().text().trim();
      const link = $(el).find('a.base-card__full-link, a.job-search-card__url-wrapper, a[href*="/jobs/view/"]').first().attr('href');

      if (title && company && link) {
        const cleanLink = link.split('?')[0];
        // Ensure remote status is captured since f_WT=2 is active
        const locClean = loc || location || 'Worldwide';
        const remoteLoc = locClean.toLowerCase().includes('remote') ? locClean : `${locClean} (Remote)`;

        results.push({
          source: 'linkedin',
          company,
          title,
          apply_url: cleanLink,
          location_raw: remoteLoc,
          description_text: `${title} at ${company}. Role Keywords: ${keywords}. Location: ${remoteLoc}. Apply directly on LinkedIn: ${cleanLink}`,
        });
      }
    });

    if (results.length === 0) {
      console.warn(`[LinkedIn Guest] ⚠️ 0 listings parsed for "${keywords}" in ${location}. (Snippet: ${html.slice(0, 180).replace(/\s+/g, ' ')})`);
    } else {
      console.log(`[LinkedIn Guest] ✅ Extracted ${results.length} listings for "${keywords}" in ${location}`);
    }
  } catch (err: any) {
    console.error(`[LinkedIn Guest] Error fetching jobs for ${location}:`, err.message);
  }
  return results;
}
