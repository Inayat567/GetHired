import fs from 'fs';
import path from 'path';
import { CandidateProfile, CandidateProfileSchema, Preferences, PreferencesSchema, UserSettings, UserSettingsSchema } from '../types';
import { encryptSecret, decryptSecret, decryptClientPayload } from './secrets';

export interface UserProfileBundle {
  id: string;
  candidateProfile: CandidateProfile;
  preferences: Preferences;
  settings: UserSettings;
  cvExists: boolean;
  cvSizeBytes?: number;
  hasApiKey?: boolean;
  hasSmtpCredentials?: boolean;
}

const PROFILES_ROOT = process.env.PROFILES_DIR ? path.resolve(process.env.PROFILES_DIR) : path.resolve('./profiles');

export function ensureProfilesDirectory() {
  if (!fs.existsSync(PROFILES_ROOT)) {
    fs.mkdirSync(PROFILES_ROOT, { recursive: true });
  }

  // Initialize 'default' profile directory if it doesn't exist yet
  const defaultDir = path.join(PROFILES_ROOT, 'default');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
}

export interface ProfileSummary {
  id: string;
  name: string;
  title: string;
  isPrimary: boolean;
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

export function listProfilesForUser(
  userId?: string,
  userAccount?: { name?: string; email?: string }
): ProfileSummary[] {
  ensureProfilesDirectory();

  // If no user is logged in, only expose default template
  if (!userId) {
    const defaultBundle = loadProfileBundle('default');
    return [
      {
        id: 'default',
        name: defaultBundle.candidateProfile?.name || 'Default Candidate',
        title: defaultBundle.candidateProfile?.current_title || 'React Native Developer',
        isPrimary: true,
      },
    ];
  }

  // Ensure user's primary profile directory exists
  const userPrimaryPaths = getProfilePaths(userId);
  if (!fs.existsSync(userPrimaryPaths.profilePath)) {
    const seededProfile: CandidateProfile = {
      name: userAccount?.name || '',
      email: userAccount?.email || '',
      current_title: '',
      years_of_experience: 0,
      core_stack: [],
      secondary_stack: [],
      notable_achievements: [],
    };
    saveCandidateProfile(userId, seededProfile);
    savePreferences(userId, PreferencesSchema.parse({}));
  }

  const entries = fs.readdirSync(PROFILES_ROOT, { withFileTypes: true });
  // Strictly filter: ONLY the logged-in user's primary directory or subprofiles (e.g. userId__slug)
  const userDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => name === userId || name.startsWith(`${userId}__`));

  if (!userDirs.includes(userId)) {
    userDirs.unshift(userId);
  }

  return userDirs.map((dirName) => {
    const isPrimary = dirName === userId;
    let displayName = '';
    let displayTitle = '';

    try {
      const bundle = loadProfileBundle(dirName);
      displayTitle = bundle.candidateProfile?.current_title || '';
      const cName = bundle.candidateProfile?.name || userAccount?.name || 'Candidate';

      if (isPrimary) {
        displayName = displayTitle ? `${cName} (${displayTitle})` : `${cName} (Primary)`;
      } else {
        const slugPart = dirName.split('__')[1] || '';
        const humanSlug = slugPart
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        displayName = bundle.candidateProfile?.current_title || humanSlug || 'Persona Profile';
      }
    } catch {
      displayName = isPrimary ? (userAccount?.name || 'Primary Profile') : 'Custom Persona';
    }

    return {
      id: dirName,
      name: displayName,
      title: displayTitle,
      isPrimary,
    };
  });
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

  // Clean empty defaults (no secrets or preset values leak)
  let candidateProfile: CandidateProfile = {
    name: '',
    email: '',
    current_title: '',
    years_of_experience: 0,
    core_stack: [],
    secondary_stack: [],
    notable_achievements: [],
  };

  let preferences: Preferences = PreferencesSchema.parse({});
  let settings: UserSettings = UserSettingsSchema.parse({
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    api_key: '',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from_name: '',
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
      const parsed = JSON.parse(raw);
      // Decrypt sensitive credentials in memory
      if (parsed.api_key) {
        parsed.api_key = decryptSecret(parsed.api_key, `${profileId}_api_key`);
      }
      if (parsed.smtp && parsed.smtp.pass) {
        parsed.smtp.pass = decryptSecret(parsed.smtp.pass, `${profileId}_smtp_pass`);
      }
      settings = UserSettingsSchema.parse(parsed);
    } catch (err) {
      console.warn(`[ProfileManager] Could not parse ${paths.settingsPath}, using default.`);
    }
  }

  let cvExists = false;
  let cvSizeBytes: number | undefined;
  if (fs.existsSync(paths.cvPath)) {
    cvExists = true;
    cvSizeBytes = fs.statSync(paths.cvPath).size;
  }

  return {
    id: profileId,
    candidateProfile,
    preferences,
    settings,
    cvExists,
    cvSizeBytes,
    hasApiKey: !!(settings.api_key && settings.api_key.trim() !== ''),
    hasSmtpCredentials: !!(settings.smtp?.user && settings.smtp?.pass),
  };
}

/**
 * Returns a sanitized bundle where secrets (API key, SMTP pass) are completely stripped out
 * Safe for returning over HTTP GET requests to the browser.
 */
export function loadProfileBundleForResponse(profileId: string = 'default'): UserProfileBundle {
  const bundle = loadProfileBundle(profileId);
  return {
    ...bundle,
    hasApiKey: !!(bundle.settings.api_key && bundle.settings.api_key.trim() !== ''),
    hasSmtpCredentials: !!(bundle.settings.smtp?.user && bundle.settings.smtp?.pass),
    settings: {
      ...bundle.settings,
      api_key: '', // NEVER send raw key to browser
      smtp: {
        ...bundle.settings.smtp,
        pass: '', // NEVER send raw password to browser
      },
    },
  };
}

export function sanitizeApiKey(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  // Strip surrounding quotes if present
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  // If user pasted a JSON snippet or console output containing an API key token, extract it
  const match = str.match(/(sk-(?:proj-)?[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|xai-[A-Za-z0-9_-]{20,})/);
  if (match) {
    return match[1];
  }
  // Otherwise remove whitespace/linebreaks
  return str.replace(/\s+/g, '');
}

export function saveUserSettings(profileId: string, incomingSettings: any) {
  const paths = getProfilePaths(profileId);

  // Load current saved settings to handle __UNCHANGED__ sentinels safely
  let existingSettings: UserSettings = UserSettingsSchema.parse({
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    api_key: '',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from_name: '',
    },
  });

  if (fs.existsSync(paths.settingsPath)) {
    try {
      const raw = fs.readFileSync(paths.settingsPath, 'utf8');
      const parsed = JSON.parse(raw);
      existingSettings = UserSettingsSchema.parse(parsed);
    } catch {
      // ignore
    }
  }

  // Resolve API Key: if encrypted with RSA from client, decrypt first
  let rawIncomingKey = incomingSettings.api_key;
  if (rawIncomingKey && typeof rawIncomingKey === 'string' && rawIncomingKey.startsWith('rsa:v1:')) {
    rawIncomingKey = decryptClientPayload(rawIncomingKey);
  }

  let resolvedApiKey = rawIncomingKey;
  if (resolvedApiKey === '__UNCHANGED__' || (!resolvedApiKey && existingSettings.api_key)) {
    resolvedApiKey = existingSettings.api_key; // already encrypted or plain
  } else if (resolvedApiKey && resolvedApiKey.trim() !== '') {
    // New key entered: sanitize and encrypt with AES-256-GCM
    const cleanKey = sanitizeApiKey(resolvedApiKey);
    if (cleanKey) {
      resolvedApiKey = encryptSecret(cleanKey, `${profileId}_api_key`);
    } else {
      resolvedApiKey = '';
    }
  } else {
    resolvedApiKey = '';
  }

  // Resolve SMTP Settings & Password
  const incomingSmtp = incomingSettings.smtp || {};
  let rawIncomingSmtpPass = incomingSmtp.pass;
  if (rawIncomingSmtpPass && typeof rawIncomingSmtpPass === 'string' && rawIncomingSmtpPass.startsWith('rsa:v1:')) {
    rawIncomingSmtpPass = decryptClientPayload(rawIncomingSmtpPass);
  }

  let resolvedSmtpPass = rawIncomingSmtpPass;
  if (resolvedSmtpPass === '__UNCHANGED__' || (!resolvedSmtpPass && existingSettings.smtp?.pass)) {
    resolvedSmtpPass = existingSettings.smtp?.pass || '';
  } else if (resolvedSmtpPass && resolvedSmtpPass.trim() !== '') {
    resolvedSmtpPass = encryptSecret(resolvedSmtpPass.trim(), `${profileId}_smtp_pass`);
  } else {
    resolvedSmtpPass = '';
  }

  let resolvedSmtpUser = incomingSmtp.user;
  if (resolvedSmtpUser === '__UNCHANGED__' || (!resolvedSmtpUser && existingSettings.smtp?.user)) {
    resolvedSmtpUser = existingSettings.smtp?.user || '';
  }

  const toSave = {
    ai_provider: incomingSettings.ai_provider || existingSettings.ai_provider || 'openai',
    ai_model: incomingSettings.ai_model || existingSettings.ai_model || 'gpt-4o-mini',
    api_key: resolvedApiKey,
    smtp: {
      host: incomingSmtp.host || existingSettings.smtp?.host || 'smtp.gmail.com',
      port: parseInt(incomingSmtp.port, 10) || existingSettings.smtp?.port || 587,
      secure: typeof incomingSmtp.secure === 'boolean' ? incomingSmtp.secure : (existingSettings.smtp?.secure || false),
      user: resolvedSmtpUser || '',
      pass: resolvedSmtpPass || '',
      from_name: incomingSmtp.from_name || existingSettings.smtp?.from_name || '',
    },
  };

  fs.writeFileSync(paths.settingsPath, JSON.stringify(toSave, null, 2), 'utf8');
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

export function createUserProfile(
  personaName: string,
  userId?: string,
  userAccount?: { name?: string; email?: string }
): UserProfileBundle {
  const cleanName = personaName.trim();
  if (!cleanName) throw new Error('Profile name cannot be empty.');

  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'persona';

  const newProfileId = userId ? `${userId}__${slug}` : slug;

  // Use user's primary profile or empty template
  const baseProfileId = userId || 'default';
  const baseBundle = loadProfileBundle(baseProfileId);

  const newCandidateProfile: CandidateProfile = {
    ...baseBundle.candidateProfile,
    name: userAccount?.name || baseBundle.candidateProfile?.name || '',
    email: userAccount?.email || baseBundle.candidateProfile?.email || '',
    current_title: cleanName,
  };

  saveCandidateProfile(newProfileId, newCandidateProfile);
  savePreferences(newProfileId, baseBundle.preferences);
  // NOTE: New profiles do NOT auto-copy any CV or secrets. The user attaches a CV intentionally.

  return loadProfileBundle(newProfileId);
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

  // 1. Mandatory: AI API Key (must be provided explicitly in settings)
  const apiKey = bundle.settings?.api_key;
  if (!apiKey || apiKey.trim() === '') {
    missing.push(`AI API Key (${(bundle.settings?.ai_provider || 'OpenAI').toUpperCase()})`);
  }

  // 2. Mandatory: Candidate Name & Email
  if (!bundle.candidateProfile?.name || bundle.candidateProfile.name.trim() === '') {
    missing.push('Candidate Full Name');
  }
  if (!bundle.candidateProfile?.email || bundle.candidateProfile.email.trim() === '') {
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

/**
 * Permanently deletes all profile directories belonging to a user from the filesystem.
 * Removes: profiles/{userId}/ and profiles/{userId}__* directories.
 * Returns the list of deleted directory paths.
 */
export function deleteUserProfileFiles(userId: string): string[] {
  ensureProfilesDirectory();
  const deleted: string[] = [];

  try {
    const entries = fs.readdirSync(PROFILES_ROOT, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === userId || entry.name.startsWith(`${userId}__`)) {
        const dirPath = path.join(PROFILES_ROOT, entry.name);
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          deleted.push(dirPath);
        } catch (err) {
          console.error(`[deleteUserProfileFiles] Failed to remove ${dirPath}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[deleteUserProfileFiles] Error reading profiles directory:', err);
  }

  return deleted;
}
