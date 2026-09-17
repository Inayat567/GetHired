import * as cheerio from 'cheerio';
import { RawJobListing } from '../types';

export async function fetchLinkedInGuestJobs(
  keywords: string = 'React Native',
  location: string = 'Worldwide'
): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    // f_TPR=r86400 (last 24 hours), f_WT=2 (remote)
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      keywords
    )}&location=${encodeURIComponent(location)}&f_TPR=r86400&f_WT=2`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.warn(`[LinkedIn Guest] Search returned HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('li').each((_, el) => {
      const title = $(el).find('.base-search-card__title').text().trim();
      const company = $(el).find('.base-search-card__subtitle').text().trim();
      const loc = $(el).find('.job-search-card__location').text().trim();
      const link = $(el).find('a.base-card__full-link').attr('href');

      if (title && company && link) {
        results.push({
          source: 'linkedin_guest',
          company,
          title,
          apply_url: link.split('?')[0], // strip tracking params
          location_raw: loc || 'Remote',
          description_text: `${title} at ${company}. Location: ${loc}. Apply on LinkedIn.`,
        });
      }
    });
  } catch (err: any) {
    console.error(`[LinkedIn Guest] Error fetching jobs:`, err.message);
  }
  return results;
}
