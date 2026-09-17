import { z } from 'zod';

export const PreferencesSchema = z.object({
  employment_types: z.array(z.enum(['full-time', 'part-time', 'contract', 'freelance'])).default(['full-time', 'contract']),
  compensation: z.object({
    currency: z.enum(['USD', 'EUR']).default('USD'),
    min_monthly_amount: z.number().default(4000),
    min_hourly_rate: z.number().default(30),
    strict_salary_filter: z.boolean().default(false),
  }).default({}),
  location: z.object({
    candidate_country: z.string().default('Pakistan'),
    allow_worldwide_remote: z.boolean().default(true),
    target_countries: z.array(z.string()).default([
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
    ]),
    disallowed_phrases: z.array(z.string()).default([]),
  }).default({}),
  timezone: z.object({
    candidate_utc_offset: z.number().default(5),
    max_timezone_difference_hours: z.number().nullable().default(7),
    acceptable_timezones: z.array(z.string()).default(['UTC', 'GMT', 'CET', 'CEST', 'EET', 'EST', 'AEST', 'Worldwide']),
  }).default({}),
  target_roles: z.array(z.string()).default(['React Native Engineer', 'Mobile Developer']),
  required_keywords: z.array(z.string()).default(['React Native', 'Expo']),
  excluded_keywords: z.array(z.string()).default([]),
  match_threshold: z.number().min(0).max(100).default(75),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

export const CandidateProfileSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  current_title: z.string(),
  years_of_experience: z.number(),
  core_stack: z.array(z.string()),
  secondary_stack: z.array(z.string()),
  notable_achievements: z.array(z.string()),
  availability: z.string().optional(),
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'grok';

export const AI_MODELS_BY_PROVIDER: Record<AIProvider, Array<{ id: string; name: string }>> = {
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast, Cost-effective - Recommended)' },
    { id: 'gpt-4o', name: 'GPT-4o (High Reasoning)' },
    { id: 'o3-mini', name: 'o3-mini (Fast Reasoning)' },
    { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview' },
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best Technical Pitch Drafting)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Ultra Fast & Low Cost)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Deep Reasoning)' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Ultra Fast - Recommended)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Reasoning)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Lightweight & Fast)' },
  ],
  grok: [
    { id: 'grok-2-latest', name: 'Grok 2 Latest (xAI Frontier Model)' },
    { id: 'grok-2-1212', name: 'Grok 2 (1212 release)' },
    { id: 'grok-beta', name: 'Grok Beta' },
  ],
};

export const UserSettingsSchema = z.object({
  ai_provider: z.enum(['openai', 'claude', 'gemini', 'grok']).default('openai'),
  ai_model: z.string().default('gpt-4o-mini'),
  api_key: z.string().default(''),
  smtp: z.object({
    host: z.string().default('smtp.gmail.com'),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    user: z.string().default(''),
    pass: z.string().default(''),
    from_name: z.string().default(''),
  }).default({}),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export type JobStatus = 'pending' | 'qualified' | 'applied' | 'skipped' | 'failed';

export interface Job {
  id: string;
  source: string;
  company: string;
  title: string;
  apply_url: string;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  location_raw?: string | null;
  employment_type?: string | null;
  currency?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: 'hourly' | 'monthly' | 'yearly' | null;
  timezone_raw?: string | null;
  description_text: string;
  match_score?: number | null;
  should_apply?: boolean | null;
  disqualification_reason?: string | null;
  key_matching_skills?: string[] | null;
  tailored_pitch?: string | null;
  email_subject?: string | null;
  status: JobStatus;
  skipped_by?: 'user' | 'auto' | null;
  created_at?: string;
  updated_at?: string;
}

export interface FilterResult {
  passes: boolean;
  reason?: string;
  extracted?: {
    employment_type?: string;
    currency?: string;
    salary_min?: number;
    salary_max?: number;
    salary_period?: 'hourly' | 'monthly' | 'yearly';
  };
}

export interface LLMEvaluationResult {
  match_score: number;
  should_apply: boolean;
  disqualification_reason?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  key_matching_skills?: string[];
  cold_email_subject?: string;
  cold_email_body?: string;
}

export interface RawJobListing {
  source: string;
  company: string;
  title: string;
  apply_url: string;
  location_raw?: string;
  description_text: string;
  recruiter_name?: string;
  recruiter_email?: string;
}
