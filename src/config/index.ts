import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PreferencesSchema, Preferences, CandidateProfileSchema, CandidateProfile } from '../types';

dotenv.config();

export interface AppConfig {
  llm: {
    provider: 'openai' | 'groq' | 'ollama';
    apiKey: string;
    model: string;
    ollamaBaseUrl: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
  };
  paths: {
    candidateProfile: string;
    preferences: string;
    cvAttachment: string;
    sqliteDb: string;
  };
  candidateProfile: CandidateProfile;
  preferences: Preferences;
}

function loadJsonFile<T>(filePath: string, schema: any, defaultVal: T): T {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[Config] File not found: ${fullPath}. Using defaults.`);
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    return schema.parse(parsed);
  } catch (error) {
    console.error(`[Config] Error parsing ${fullPath}:`, error);
    return defaultVal;
  }
}

const defaultCandidateProfile: CandidateProfile = {
  name: 'Affan Developer',
  email: 'affan@example.com',
  current_title: 'Senior React Native Engineer',
  years_of_experience: 5,
  core_stack: ['React Native', 'Expo', 'TypeScript'],
  secondary_stack: ['Node.js', 'Redux', 'iOS', 'Android'],
  notable_achievements: ['Shipped production cross-platform apps with 100k+ downloads.'],
};

const defaultPreferences: Preferences = PreferencesSchema.parse({});

export function loadConfig(): AppConfig {
  const profilePath = process.env.CANDIDATE_PROFILE_PATH || './candidate_profile.json';
  const preferencesPath = process.env.PREFERENCES_PATH || './preferences.json';
  const cvPath = process.env.CV_ATTACHMENT_PATH || './assets/cv.pdf';
  const dbPath = process.env.SQLITE_DB_PATH || './jobs.db';

  const candidateProfile = loadJsonFile(profilePath, CandidateProfileSchema, defaultCandidateProfile);
  const preferences = loadJsonFile(preferencesPath, PreferencesSchema, defaultPreferences);

  return {
    llm: {
      provider: (process.env.LLM_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '',
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromName: process.env.EMAIL_FROM_NAME || candidateProfile.name,
    },
    paths: {
      candidateProfile: path.resolve(profilePath),
      preferences: path.resolve(preferencesPath),
      cvAttachment: path.resolve(cvPath),
      sqliteDb: path.resolve(dbPath),
    },
    candidateProfile,
    preferences,
  };
}
