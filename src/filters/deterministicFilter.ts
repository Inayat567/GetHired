import { Preferences, FilterResult } from '../types';

export function parseCompensation(text: string): {
  currency?: string;
  salary_min?: number;
  salary_max?: number;
  salary_period?: 'hourly' | 'monthly' | 'yearly';
} {
  const normalized = text.replace(/,/g, '');

  // Detect currency
  let currency: string | undefined;
  if (normalized.includes('€') || /eur|euro/i.test(normalized)) currency = 'EUR';
  else if (normalized.includes('$') || /usd|dollar/i.test(normalized)) currency = 'USD';
  else if (normalized.includes('£') || /gbp|pound/i.test(normalized)) currency = 'GBP';

  // Check Hourly rate (e.g. $40 - $70/hr, €50/hour, $45/h, $50 / hr)
  const hourlyMatch = normalized.match(/([€$£]?)\s*(\d{2,3})(?:\s*-\s*([€$£]?)\s*(\d{2,3}))?\s*(?:\/\s*|\s*per\s*)(?:hr|hour|h\b)/i);
  if (hourlyMatch) {
    const min = parseFloat(hourlyMatch[2]);
    const max = hourlyMatch[4] ? parseFloat(hourlyMatch[4]) : min;
    return {
      currency: currency || (hourlyMatch[1] === '€' ? 'EUR' : 'USD'),
      salary_min: min,
      salary_max: max,
      salary_period: 'hourly',
    };
  }

  // Check Monthly rate (e.g. $4,000 - $6,000/mo, €5000/month, €5000 / month)
  const monthlyMatch = normalized.match(/([€$£]?)\s*(\d{4,5})(?:\s*-\s*([€$£]?)\s*(\d{4,5}))?\s*(?:\/\s*|\s*per\s*)(?:mo|month|m\b)/i);
  if (monthlyMatch) {
    const min = parseFloat(monthlyMatch[2]);
    const max = hourlyMatch ? min : min;
    const maxVal = monthlyMatch[4] ? parseFloat(monthlyMatch[4]) : min;
    return {
      currency: currency || (monthlyMatch[1] === '€' ? 'EUR' : 'USD'),
      salary_min: min,
      salary_max: maxVal,
      salary_period: 'monthly',
    };
  }

  // Check Yearly (e.g. $80k - $120k, $80,000 - $120,000 / year, €90k/yr)
  const yearlyKMatch = normalized.match(/([€$£]?)\s*(\d{2,3})k\s*(?:-\s*([€$£]?)\s*(\d{2,3})k)?(?:\s*(?:\/\s*|\s*per\s*)?(?:yr|year|annum|annual))?/i);
  if (yearlyKMatch) {
    const min = parseFloat(yearlyKMatch[2]) * 1000;
    const max = yearlyKMatch[4] ? parseFloat(yearlyKMatch[4]) * 1000 : min;
    return {
      currency: currency || (yearlyKMatch[1] === '€' ? 'EUR' : 'USD'),
      salary_min: min,
      salary_max: max,
      salary_period: 'yearly',
    };
  }

  const yearlyFullMatch = normalized.match(/([€$£]?)\s*(\d{5,6})(?:\s*-\s*([€$£]?)\s*(\d{5,6}))?\s*(?:\/\s*|\s*per\s*)?(?:yr|year|annum|annual)/i);
  if (yearlyFullMatch) {
    const min = parseFloat(yearlyFullMatch[2]);
    const max = yearlyFullMatch[4] ? parseFloat(yearlyFullMatch[4]) : min;
    return {
      currency: currency || (yearlyFullMatch[1] === '€' ? 'EUR' : 'USD'),
      salary_min: min,
      salary_max: max,
      salary_period: 'yearly',
    };
  }

  return currency ? { currency } : {};
}

export function parseEmploymentType(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('part-time') || lower.includes('part time')) return 'part-time';
  if (lower.includes('contract') || lower.includes('contractor') || lower.includes('freelance') || lower.includes('c2c')) return 'contract';
  if (lower.includes('full-time') || lower.includes('full time') || lower.includes('permanent')) return 'full-time';
  return undefined;
}

export function passesDeterministicFilter(
  job: { title: string; location_raw?: string; description_text: string },
  preferences: Preferences
): FilterResult {
  const combinedText = `${job.title} ${job.location_raw || ''} ${job.description_text}`.toLowerCase();
  const titleLower = job.title.toLowerCase();

  // 1. Title & Core Keyword Inclusion with word-boundary protection
  const matchesRequiredKeyword = preferences.required_keywords.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(combinedText);
  });
  if (!matchesRequiredKeyword) {
    return { passes: false, reason: `Missing required keywords (${preferences.required_keywords.join(', ')})` };
  }

  // 2. Excluded Title Keywords
  if (preferences.excluded_keywords && preferences.excluded_keywords.length > 0) {
    for (const kw of preferences.excluded_keywords) {
      if (titleLower.includes(kw.toLowerCase())) {
        return { passes: false, reason: `Title matches excluded keyword: "${kw}"` };
      }
    }
  }

  // 3. Disallowed Phrases (e.g. US Only, W2 Only, Security Clearance, etc.)
  for (const phrase of preferences.location.disallowed_phrases) {
    if (combinedText.includes(phrase.toLowerCase())) {
      return { passes: false, reason: `Listing contains restricted phrase: "${phrase}"` };
    }
  }

  // 4. Regional & Geographic Matching
  const locRaw = (job.location_raw || '').toLowerCase();
  const isWorldwideAllowed = preferences.location.allow_worldwide_remote;
  const isGenericRemote =
    locRaw.includes('remote') ||
    locRaw.includes('anywhere') ||
    locRaw.includes('worldwide') ||
    locRaw.includes('global') ||
    locRaw.includes('work from anywhere') ||
    locRaw === '' ||
    combinedText.includes('remote worldwide') ||
    combinedText.includes('worldwide remote');

  // Check country match
  const matchesTargetCountry = preferences.location.target_countries.some((country) => {
    const cLower = country.toLowerCase();
    return locRaw.includes(cLower) || combinedText.includes(cLower);
  });

  // Country alias dictionary for common variations
  const countryAliases: Record<string, string[]> = {
    netherlands: ['holland', 'amsterdam', 'rotterdam'],
    germany: ['deutschland', 'berlin', 'munich', 'münchen', 'hamburg'],
    belgium: ['brussels', 'bruxelles', 'antwerp', 'gent'],
    austria: ['österreich', 'vienna', 'wien'],
    bulgaria: ['sofia'],
    'united kingdom': ['uk', 'london', 'great britain', 'england'],
    canada: ['toronto', 'vancouver', 'montreal'],
    australia: ['sydney', 'melbourne', 'brisbane'],
    'european union': ['eu', 'europe', 'emea', 'schengen', 'cet'],
  };

  const matchesAlias = preferences.location.target_countries.some((country) => {
    const aliases = countryAliases[country.toLowerCase()] || [];
    return aliases.some((a) => locRaw.includes(a) || combinedText.includes(a));
  });

  if (!isGenericRemote && !matchesTargetCountry && !matchesAlias) {
    // If worldwide remote is allowed and the job is remote anywhere
    if (isWorldwideAllowed && (locRaw.includes('remote') || combinedText.includes('remote'))) {
      // Allowed as worldwide remote
    } else {
      return { passes: false, reason: `Location "${job.location_raw}" does not match target countries.` };
    }
  }

  // 5. Employment Type Check
  const employmentType = parseEmploymentType(combinedText);
  if (employmentType && preferences.employment_types.length > 0) {
    const isTypeAccepted = preferences.employment_types.includes(employmentType as any);
    if (!isTypeAccepted) {
      return { passes: false, reason: `Employment type "${employmentType}" is not in preferences (${preferences.employment_types.join(', ')})` };
    }
  }

  // 6. Compensation Check
  const comp = parseCompensation(job.description_text);
  if (preferences.compensation.strict_salary_filter) {
    if (comp.salary_min) {
      let monthlyEquiv = comp.salary_min;
      if (comp.salary_period === 'yearly') monthlyEquiv = comp.salary_min / 12;
      if (comp.salary_period === 'hourly') monthlyEquiv = comp.salary_min * 160;

      if (monthlyEquiv < preferences.compensation.min_monthly_amount) {
        return {
          passes: false,
          reason: `Stated compensation ($${monthlyEquiv.toFixed(0)}/mo equiv) below minimum ($${preferences.compensation.min_monthly_amount}/mo)`,
        };
      }
    }
  }

  return {
    passes: true,
    extracted: {
      employment_type: employmentType,
      currency: comp.currency,
      salary_min: comp.salary_min,
      salary_max: comp.salary_max,
      salary_period: comp.salary_period,
    },
  };
}
