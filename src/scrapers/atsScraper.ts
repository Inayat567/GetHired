import { RawJobListing } from '../types';

export const DEFAULT_GREENHOUSE_BOARDS = [
  'automattic',
  'gitlab',
  'canonical',
  'buffer',
  'duckduckgo',
  'elastic',
  'github',
  'stripe',
  'hashicorp',
  'reddit',
];

export const DEFAULT_LEVER_COMPANIES = [
  'netflix',
  'spotify',
  'figma',
  'palantir',
  'kinsta',
  'hotjar',
];

export async function fetchGreenhouseJobs(boardToken: string, filterKeywords: string[] = ['react native', 'expo', 'mobile', 'react', 'frontend', 'ios', 'android']): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data: any = await response.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    for (const job of data.jobs) {
      const title = job.title || 'Software Engineer';
      const content = job.content || '';
      const combined = `${title} ${content}`.toLowerCase();

      // Skip non-engineering / completely unrelated jobs early to avoid raw job flood
      if (filterKeywords.length > 0) {
        const matchesAny = filterKeywords.some((kw) => {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(combined);
        });
        if (!matchesAny) continue;
      }

      results.push({
        source: `greenhouse:${boardToken}`,
        company: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
        title,
        apply_url: job.absolute_url,
        location_raw: job.location?.name || 'Remote',
        description_text: content,
      });
    }
  } catch (err: any) {
    // Silently ignore inactive board tokens
  }
  return results;
}

export async function fetchLeverJobs(companyId: string, filterKeywords: string[] = ['react native', 'expo', 'mobile', 'react', 'frontend', 'ios', 'android']): Promise<RawJobListing[]> {
  const results: RawJobListing[] = [];
  try {
    const url = `https://api.lever.co/v0/postings/${companyId}?mode=json`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const postings = await response.json();
    if (!Array.isArray(postings)) return [];

    for (const item of postings) {
      const title = item.text || 'Developer';
      const desc = `${item.descriptionPlain || ''} ${item.additionalPlain || ''}`;
      const combined = `${title} ${desc}`.toLowerCase();

      if (filterKeywords.length > 0) {
        const matchesAny = filterKeywords.some((kw) => {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(combined);
        });
        if (!matchesAny) continue;
      }

      results.push({
        source: `lever:${companyId}`,
        company: companyId.charAt(0).toUpperCase() + companyId.slice(1),
        title,
        apply_url: item.hostedUrl || item.applyUrl,
        location_raw: item.categories?.location || 'Remote',
        description_text: desc,
      });
    }
  } catch (err: any) {
    // Silently ignore inactive company endpoints
  }
  return results;
}

export async function fetchAllATSJobs(
  greenhouseBoards: string[] = DEFAULT_GREENHOUSE_BOARDS,
  leverCompanies: string[] = DEFAULT_LEVER_COMPANIES,
  filterKeywords?: string[]
): Promise<RawJobListing[]> {
  const allJobs: RawJobListing[] = [];

  const ghPromises = greenhouseBoards.map((board) => fetchGreenhouseJobs(board, filterKeywords));
  const leverPromises = leverCompanies.map((comp) => fetchLeverJobs(comp, filterKeywords));

  const results = await Promise.all([...ghPromises, ...leverPromises]);
  for (const list of results) {
    allJobs.push(...list);
  }

  return allJobs;
}
