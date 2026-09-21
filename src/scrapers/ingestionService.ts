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

export async function runIngestion(db: Database, config: AppConfig, days?: number): Promise<IngestionReport> {
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
  console.log(`     [Aggregators] RemoteOK: ${remoteOk.length} | Jobicy: ${jobicy.length} | WeWorkRemotely: ${wwr.length}`);
  rawListings.push(...remoteOk, ...jobicy, ...wwr);

  // 2. Fetch Public ATS Boards (Greenhouse & Lever) filtered by user keywords
  console.log(`  -> Fetching public ATS endpoints filtered by [${keywordsList.join(', ')}]...`);
  const atsJobs = await fetchAllATSJobs(undefined, undefined, keywordsList);
  console.log(`     [ATS Boards] Extracted ${atsJobs.length} matching jobs.`);
  rawListings.push(...atsJobs);

  // 3. Fetch LinkedIn Guest Jobs across Worldwide + user target countries
  const locationsToSearch: string[] = [];
  if (config.preferences.location.allow_worldwide_remote) {
    locationsToSearch.push('Worldwide');
  }
  for (const c of config.preferences.location.target_countries) {
    if (!locationsToSearch.includes(c)) {
      locationsToSearch.push(c);
    }
  }
  if (locationsToSearch.length === 0) {
    locationsToSearch.push('Worldwide');
  }

  const activeLocations = locationsToSearch.slice(0, 4);
  let totalLinkedInGuest = 0;
  for (const country of activeLocations) {
    console.log(`  -> Querying public LinkedIn remote search in ${country} for "${primaryKeyword}" (interval: ${days || 7} days)...`);
    const linkedinGuest = await fetchLinkedInGuestJobs(primaryKeyword, country, days || 7);
    totalLinkedInGuest += linkedinGuest.length;
    rawListings.push(...linkedinGuest);
  }
  console.log(`     [LinkedIn Guest] Total scraped: ${totalLinkedInGuest} jobs.`);

  // 4. Fetch LinkedIn Hiring Posts (if session is initialized)
  const linkedinPosts = await scrapeLinkedInHiringPosts('./linkedin-session', primaryKeyword);
  console.log(`     [LinkedIn Posts] Total scraped: ${linkedinPosts.length} posts.`);
  rawListings.push(...linkedinPosts);

  console.log(`📥 Total raw listings scraped across all sources: ${rawListings.length}`);

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
      if (raw.source.includes('linkedin')) {
        console.log(`  🚫 [Pre-Filter Disqualified] ${raw.source}: "${raw.title}" @ ${raw.company} (${raw.location_raw}) -> ${filterResult.reason}`);
      }
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
    if (raw.source.includes('linkedin')) {
      console.log(`  ✅ [Pre-Filter Qualified] ${raw.source}: "${raw.title}" @ ${raw.company} (${raw.location_raw}) -> Ready for LLM Evaluation!`);
    }
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
