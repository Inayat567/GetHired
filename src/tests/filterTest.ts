import { passesDeterministicFilter, parseCompensation, parseEmploymentType } from '../filters/deterministicFilter';
import { Preferences } from '../types';

const mockPreferences: Preferences = {
  employment_types: ['full-time', 'contract'],
  compensation: {
    currency: 'USD',
    min_monthly_amount: 4000,
    min_hourly_rate: 30,
    strict_salary_filter: true,
  },
  location: {
    candidate_country: 'Pakistan',
    allow_worldwide_remote: true,
    target_countries: [
      'Germany',
      'Netherlands',
      'Belgium',
      'Austria',
      'Bulgaria',
      'United Kingdom',
      'Canada',
      'Australia',
      'European Union',
      'Worldwide',
    ],
    disallowed_phrases: [
      'US Citizen or Green Card required',
      'US Citizen only',
      'Must be physically located in the US',
      'W2 Only',
      'No C2C',
      'Requires Security Clearance',
    ],
  },
  timezone: {
    candidate_utc_offset: 5,
    max_timezone_difference_hours: 7,
    acceptable_timezones: ['UTC', 'CET', 'Worldwide'],
  },
  target_roles: ['React Native Engineer', 'Mobile Developer'],
  required_keywords: ['React Native', 'Expo'],
  excluded_keywords: ['Unpaid', 'Volunteer'],
  match_threshold: 75,
};

function runTests() {
  console.log('🧪 Running Deterministic Filter Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${title} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Test 1: Valid European Remote React Native job
  const job1 = {
    title: 'Senior React Native Engineer',
    location_raw: 'Remote (Germany / Netherlands / EU)',
    description_text: 'We are seeking a React Native / Expo expert to build cross-platform mobile apps. Full-time contract. Budget: €5000 - €7000 / month.',
  };
  const res1 = passesDeterministicFilter(job1, mockPreferences);
  assert('European remote React Native job should pass', res1.passes, res1.reason);
  assert('Should parse EUR monthly salary', res1.extracted?.salary_min === 5000 && res1.extracted?.currency === 'EUR');

  // Test 2: US Only / W2 restriction
  const job2 = {
    title: 'Lead React Native Developer',
    location_raw: 'Remote (US)',
    description_text: 'Exciting mobile startup. US Citizen or Green Card required. W2 Only, no C2C.',
  };
  const res2 = passesDeterministicFilter(job2, mockPreferences);
  assert('US Citizen / W2 job should be blocked', !res2.passes && (res2.reason?.includes('restricted phrase') ?? false), res2.reason);

  // Test 3: Missing required keywords (e.g. pure iOS Swift)
  const job3 = {
    title: 'Senior iOS Developer',
    location_raw: 'Worldwide Remote',
    description_text: 'Looking for Swift and SwiftUI expert for native Apple ecosystem.',
  };
  const res3 = passesDeterministicFilter(job3, mockPreferences);
  assert('Pure native iOS role without React Native should be rejected', !res3.passes && (res3.reason?.includes('Missing required keywords') ?? false), res3.reason);

  // Test 4: Low compensation under strict filter
  const job4 = {
    title: 'React Native Mobile Developer',
    location_raw: 'Remote Worldwide',
    description_text: 'Building Expo mobile app. Compensation is $2000/month full-time.',
  };
  const res4 = passesDeterministicFilter(job4, mockPreferences);
  assert('Role below minimum compensation ($4000/mo) should be rejected', !res4.passes && (res4.reason?.includes('below minimum') ?? false), res4.reason);

  // Test 5: Australia / Canada contract
  const job5 = {
    title: 'Fullstack React Native / Expo Contractor',
    location_raw: 'Remote Australia / Canada',
    description_text: 'Contract role paying $55/hr for experienced cross-platform developers.',
  };
  const res5 = passesDeterministicFilter(job5, mockPreferences);
  assert('Australia/Canada contract role at $55/hr should pass', res5.passes, res5.reason);
  assert('Should extract hourly rate $55', res5.extracted?.salary_min === 55 && res5.extracted?.salary_period === 'hourly');

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
