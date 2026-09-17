import fs from 'fs';
import path from 'path';
import { CandidateProfile, CandidateProfileSchema, Preferences, PreferencesSchema, UserSettings, UserSettingsSchema } from '../types';

export interface UserProfileBundle {
  id: string;
  candidateProfile: CandidateProfile;
  preferences: Preferences;
  settings: UserSettings;
  cvExists: boolean;
  cvSizeBytes?: number;
}

const PROFILES_ROOT = path.resolve('./profiles');

export function ensureProfilesDirectory() {
  if (!fs.existsSync(PROFILES_ROOT)) {
    fs.mkdirSync(PROFILES_ROOT, { recursive: true });
  }

  // Initialize 'default' profile if it doesn't exist yet
  const defaultDir = path.join(PROFILES_ROOT, 'default');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });

    // Copy root files to profiles/default if they exist
    const rootProfile = path.resolve('./candidate_profile.json');
    const rootPrefs = path.resolve('./preferences.json');
    const rootCv = path.resolve('./assets/cv.pdf');

    if (fs.existsSync(rootProfile)) {
      fs.copyFileSync(rootProfile, path.join(defaultDir, 'candidate_profile.json'));
    }
    if (fs.existsSync(rootPrefs)) {
      fs.copyFileSync(rootPrefs, path.join(defaultDir, 'preferences.json'));
    }
    if (fs.existsSync(rootCv)) {
      fs.copyFileSync(rootCv, path.join(defaultDir, 'cv.pdf'));
    }
  }
}

export function listProfiles(): string[] {
  ensureProfilesDirectory();
  const entries = fs.readdirSync(PROFILES_ROOT, { withFileTypes: true });
  const list = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (!list.includes('default')) {
    list.unshift('default');
  }
  return list;
}

export function getProfilePaths(profileId: string = 'default') {
  ensureProfilesDirectory();
  const profileDir = path.join(PROFILES_ROOT, profileId);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  return {
    dir: profileDir,
    profilePath: path.join(profileDir, 'candidate_profile.json'),
    preferencesPath: path.join(profileDir, 'preferences.json'),
    settingsPath: path.join(profileDir, 'settings.json'),
    cvPath: path.join(profileDir, 'cv.pdf'),
  };
}

export function loadProfileBundle(profileId: string = 'default'): UserProfileBundle {
  const paths = getProfilePaths(profileId);

  // Fallback defaults if file doesn't exist
  let candidateProfile: CandidateProfile = {
    name: 'Developer',
    email: 'dev@example.com',
    current_title: 'Senior React Native Developer',
    years_of_experience: 5,
    core_stack: ['React Native', 'Expo', 'TypeScript'],
    secondary_stack: ['Node.js', 'Redux', 'iOS', 'Android'],
    notable_achievements: ['Shipped production apps with high reliability.'],
  };

  let preferences: Preferences = PreferencesSchema.parse({});
  let settings: UserSettings = UserSettingsSchema.parse({
    ai_provider: (process.env.LLM_PROVIDER as any) || 'openai',
    ai_model: process.env.LLM_MODEL || 'gpt-4o-mini',
    api_key: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from_name: process.env.EMAIL_FROM_NAME || '',
    },
  });

  if (fs.existsSync(paths.profilePath)) {
    try {
      const raw = fs.readFileSync(paths.profilePath, 'utf8');
      candidateProfile = CandidateProfileSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.warn(`[ProfileManager] Could not parse ${paths.profilePath}, using default.`);
    }
  }

  if (fs.existsSync(paths.preferencesPath)) {
    try {
      const raw = fs.readFileSync(paths.preferencesPath, 'utf8');
      preferences = PreferencesSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.warn(`[ProfileManager] Could not parse ${paths.preferencesPath}, using default.`);
    }
  }

  if (fs.existsSync(paths.settingsPath)) {
    try {
      const raw = fs.readFileSync(paths.settingsPath, 'utf8');
      settings = UserSettingsSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.warn(`[ProfileManager] Could not parse ${paths.settingsPath}, using default.`);
    }
  }

  let cvExists = false;
  let cvSizeBytes: number | undefined;
  if (fs.existsSync(paths.cvPath)) {
    cvExists = true;
    cvSizeBytes = fs.statSync(paths.cvPath).size;
  } else if (profileId === 'default' && fs.existsSync(path.resolve('./assets/cv.pdf'))) {
    cvExists = true;
    cvSizeBytes = fs.statSync(path.resolve('./assets/cv.pdf')).size;
  }

  return {
    id: profileId,
    candidateProfile,
    preferences,
    settings,
    cvExists,
    cvSizeBytes,
  };
}

export function saveUserSettings(profileId: string, settings: UserSettings) {
  const paths = getProfilePaths(profileId);
  const validated = UserSettingsSchema.parse(settings);
  fs.writeFileSync(paths.settingsPath, JSON.stringify(validated, null, 2), 'utf8');
}

export function saveCandidateProfile(profileId: string, profile: CandidateProfile) {
  const paths = getProfilePaths(profileId);
  const validated = CandidateProfileSchema.parse(profile);
  fs.writeFileSync(paths.profilePath, JSON.stringify(validated, null, 2), 'utf8');

  // Also sync root candidate_profile.json if default
  if (profileId === 'default') {
    fs.writeFileSync(path.resolve('./candidate_profile.json'), JSON.stringify(validated, null, 2), 'utf8');
  }
}

export function savePreferences(profileId: string, preferences: Preferences) {
  const paths = getProfilePaths(profileId);
  const validated = PreferencesSchema.parse(preferences);
  fs.writeFileSync(paths.preferencesPath, JSON.stringify(validated, null, 2), 'utf8');

  // Also sync root preferences.json if default
  if (profileId === 'default') {
    fs.writeFileSync(path.resolve('./preferences.json'), JSON.stringify(validated, null, 2), 'utf8');
  }
}

export function saveCvFile(profileId: string, buffer: Buffer) {
  const paths = getProfilePaths(profileId);
  fs.writeFileSync(paths.cvPath, buffer);

  // Also sync root assets/cv.pdf if default
  if (profileId === 'default') {
    const assetsDir = path.resolve('./assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'cv.pdf'), buffer);
  }
}

export function createNewProfile(newProfileId: string): UserProfileBundle {
  const cleanId = newProfileId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!cleanId) throw new Error('Invalid profile ID.');
  const defaultBundle = loadProfileBundle('default');
  saveCandidateProfile(cleanId, defaultBundle.candidateProfile);
  savePreferences(cleanId, defaultBundle.preferences);
  return loadProfileBundle(cleanId);
}

export function validateProfileCompleteness(profileId: string = 'default'): { isValid: boolean; missing: string[]; warnings: string[] } {
  const bundle = loadProfileBundle(profileId);
  const missing: string[] = [];
  const warnings: string[] = [];

  // 1. Mandatory: AI API Key
  const apiKey = bundle.settings?.api_key || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    missing.push(`AI API Key (${(bundle.settings?.ai_provider || 'OpenAI').toUpperCase()})`);
  }

  // 2. Mandatory: Candidate Name & Email
  if (!bundle.candidateProfile?.name || bundle.candidateProfile.name.trim() === '' || bundle.candidateProfile.name === 'Jane Doe') {
    missing.push('Candidate Full Name');
  }
  if (!bundle.candidateProfile?.email || bundle.candidateProfile.email.trim() === '' || bundle.candidateProfile.email === 'janedoe@example.com') {
    missing.push('Candidate Email Address');
  }

  // 3. Mandatory: Target Role / Keywords
  if (!bundle.preferences?.target_roles?.length && !bundle.preferences?.required_keywords?.length) {
    missing.push('Target Roles or Required Keywords');
  }

  // 4. Important: CV PDF (Mandatory for outreach / strong match evaluation)
  if (!bundle.cvExists) {
    missing.push('CV / Resume (cv.pdf)');
  }

  // 5. Warning: SMTP Credentials
  if (!bundle.settings?.smtp?.user || !bundle.settings?.smtp?.pass) {
    warnings.push('SMTP Email Sending Credentials (required to send 1-click outreach emails)');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}
