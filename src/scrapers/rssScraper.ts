import Parser from 'rss-parser';
import { RawJobListing } from '../types';

const parser = new Parser();

export async function fetchRemoteOkJobs(tag: string = 'react-native'): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    const url = `https://remoteok.com/api?tag=${encodeURIComponent(tag)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`[RemoteOK] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    // The first element in RemoteOK api is legal/metadata
    const jobs = data.slice(1);
    for (const item of jobs) {
      if (!item.position || !item.company) continue;
      results.push({
        source: 'remoteok',
        company: item.company,
        title: item.position,
        apply_url: item.url || item.apply_url || `https://remoteok.com/l/${item.id}`,
        location_raw: item.location || 'Remote Worldwide',
        description_text: item.description || '',
      });
    }
  } catch (err: any) {
    console.error(`[RemoteOK] Error fetching jobs:`, err.message);
  }
  return results;
}

export async function fetchJobicyJobs(query: string = 'react native'): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?count=30&tag=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const json: any = await response.json();
    if (json.jobs && Array.isArray(json.jobs)) {
      for (const item of json.jobs) {
        results.push({
          source: 'jobicy',
          company: item.companyName || 'Unknown',
          title: item.jobTitle || 'Developer',
          apply_url: item.url,
          location_raw: item.jobGeo || 'Remote',
          description_text: item.jobDescription || item.jobExcerpt || '',
        });
      }
    }
  } catch (err: any) {
    console.error(`[Jobicy] Error fetching jobs:`, err.message);
  }
  return results;
}

export async function fetchWeWorkRemotelyJobs(): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    const feed = await parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss');
    for (const item of feed.items) {
      if (!item.title || !item.link) continue;
      // WWR titles are usually formatted: "Company: Title"
      const parts = item.title.split(':');
      const company = parts.length > 1 ? parts[0].trim() : 'Company';
      const title = parts.length > 1 ? parts.slice(1).join(':').trim() : parts[0].trim();

      results.push({
        source: 'weworkremotely',
        company,
        title,
        apply_url: item.link,
        location_raw: 'Remote',
        description_text: item.content || item.contentSnippet || '',
      });
    }
  } catch (err: any) {
    console.error(`[WeWorkRemotely] Error fetching RSS:`, err.message);
  }
  return results;
}
