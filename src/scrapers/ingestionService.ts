import crypto from 'crypto';
import { Database } from 'sqlite';
import { RawJobListing, Job } from '../types';
import { AppConfig } from '../config';
import { jobExists, insertJob } from '../db/database';
import { passesDeterministicFilter } from '../filters/deterministicFilter';
import { fetchRemoteOkJobs, fetchJobicyJobs, fetchWeWorkRemotelyJobs } from './rssScraper';
import { fetchAllATSJobs } from './atsScraper';
import { fetchLinkedInGuestJobs } from './linkedinGuestScraper';
import { scrapeLinkedInHiringPosts } from './linkedinPostScraper';

export function computeJobId(company: string, title: string, applyUrl: string): string {
  const norm = `${company.toLowerCase().trim()}_${title.toLowerCase().trim()}_${applyUrl.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

export interface IngestionReport {
  scrapedCount: number;
  newCount: number;
  filteredOutCount: number;
  qualifiedCount: number;
}

export async function runIngestion(db: Database, config: AppConfig): Promise<IngestionReport> {
  console.log('📡 Starting multi-channel job ingestion...');
  const rawListings: RawJobListing[] = [];

  const keywordsList = config.preferences.required_keywords.length > 0
    ? config.preferences.required_keywords
    : ['React Native', 'Expo'];
  const primaryKeyword = keywordsList[0] || 'React Native';

  // 1. Fetch Remote RSS & JSON Aggregators
  console.log(`  -> Fetching RemoteOK, Jobicy, and WeWorkRemotely for "${primaryKeyword}"...`);
  const [remoteOk, jobicy, wwr] = await Promise.all([
    fetchRemoteOkJobs(primaryKeyword.toLowerCase().replace(/\s+/g, '-')),
    fetchJobicyJobs(primaryKeyword.toLowerCase()),
    fetchWeWorkRemotelyJobs(),
  ]);
  rawListings.push(...remoteOk, ...jobicy, ...wwr);

  // 2. Fetch Public ATS Boards (Greenhouse & Lever) filtered by user keywords
  console.log(`  -> Fetching public ATS endpoints filtered by [${keywordsList.join(', ')}]...`);
  const atsJobs = await fetchAllATSJobs(undefined, undefined, keywordsList);
  rawListings.push(...atsJobs);

  // 3. Fetch LinkedIn Guest Jobs across user target countries
  const targetCountries = config.preferences.location.target_countries.length > 0
    ? config.preferences.location.target_countries.slice(0, 3)
    : ['Worldwide'];
  
  for (const country of targetCountries) {
    console.log(`  -> Querying public LinkedIn remote search in ${country} for "${primaryKeyword}"...`);
    const linkedinGuest = await fetchLinkedInGuestJobs(primaryKeyword, country);
    rawListings.push(...linkedinGuest);
  }

  // 4. Fetch LinkedIn Hiring Posts (if session is initialized)
  const linkedinPosts = await scrapeLinkedInHiringPosts('./linkedin-session', primaryKeyword);
  rawListings.push(...linkedinPosts);

  console.log(`📥 Total raw listings scraped: ${rawListings.length}`);

  let newCount = 0;
  let filteredOutCount = 0;
  let qualifiedCount = 0;

  for (const raw of rawListings) {
    const id = computeJobId(raw.company, raw.title, raw.apply_url);

    // Skip if already in database
    if (await jobExists(db, id)) {
      continue;
    }
    newCount++;

    // Apply deterministic pre-filter
    const filterResult = passesDeterministicFilter(
      {
        title: raw.title,
        location_raw: raw.location_raw,
        description_text: raw.description_text,
      },
      config.preferences
    );

    if (!filterResult.passes) {
      filteredOutCount++;
      // Store as skipped in DB with skipped_by = 'auto' so it is never triaged or shown in user's skipped tab
      await insertJob(db, {
        id,
        source: raw.source,
        company: raw.company,
        title: raw.title,
        apply_url: raw.apply_url,
        location_raw: raw.location_raw,
        description_text: raw.description_text,
        status: 'skipped',
        skipped_by: 'auto',
        disqualification_reason: filterResult.reason,
      });
      continue;
    }

    // Listing passed deterministic checks!
    qualifiedCount++;
    await insertJob(db, {
      id,
      source: raw.source,
      company: raw.company,
      title: raw.title,
      apply_url: raw.apply_url,
      recruiter_name: raw.recruiter_name,
      recruiter_email: raw.recruiter_email,
      location_raw: raw.location_raw,
      employment_type: filterResult.extracted?.employment_type,
      currency: filterResult.extracted?.currency,
      salary_min: filterResult.extracted?.salary_min,
      salary_max: filterResult.extracted?.salary_max,
      salary_period: filterResult.extracted?.salary_period,
      description_text: raw.description_text,
      status: 'pending',
    });
  }

  return {
    scrapedCount: rawListings.length,
    newCount,
    filteredOutCount,
    qualifiedCount,
  };
}
