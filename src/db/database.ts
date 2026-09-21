import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Job, JobStatus } from '../types';

let dbInstance: Database | null = null;

export async function getDb(dbPath: string = './jobs.db'): Promise<Database> {
  if (dbInstance) return dbInstance;

  const resolvedDbPath = path.resolve(dbPath);
  const dbDir = path.dirname(resolvedDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = await open({
    filename: resolvedDbPath,
    driver: sqlite3.Database,
  });

  // Enable WAL mode for better concurrency and performance
  await dbInstance.exec('PRAGMA journal_mode = WAL;');

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      apply_url TEXT NOT NULL,
      recruiter_name TEXT,
      recruiter_email TEXT,
      location_raw TEXT,
      employment_type TEXT,
      currency TEXT,
      salary_min REAL,
      salary_max REAL,
      salary_period TEXT,
      timezone_raw TEXT,
      description_text TEXT,
      match_score INTEGER,
      should_apply INTEGER DEFAULT 0,
      disqualification_reason TEXT,
      key_matching_skills TEXT,
      tailored_pitch TEXT,
      email_subject TEXT,
      status TEXT DEFAULT 'pending',
      skipped_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outreach_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      error_message TEXT,
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      auth_provider TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_codes (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile_jobs (
      profile_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL,
      skipped_by TEXT,
      match_score INTEGER,
      tailored_pitch TEXT,
      email_subject TEXT,
      disqualification_reason TEXT,
      applied_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (profile_id, job_id),
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(match_score);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_profile_jobs_status ON profile_jobs(profile_id, status);
    CREATE INDEX IF NOT EXISTS idx_profile_jobs_job ON profile_jobs(job_id);
  `);

  // Migrate existing table if skipped_by column doesn't exist
  try {
    await dbInstance.exec(`ALTER TABLE jobs ADD COLUMN skipped_by TEXT;`);
  } catch {
    // Column already exists
  }

  // Migrate any legacy applied/skipped jobs into profile_jobs for 'default' if not already populated
  try {
    await dbInstance.exec(`
      INSERT OR IGNORE INTO profile_jobs (profile_id, job_id, status, skipped_by, applied_at, updated_at)
      SELECT 'default', id, status, skipped_by, updated_at, updated_at
      FROM jobs
      WHERE status IN ('applied', 'skipped');
    `);
  } catch {
    // Ignore migration error
  }

  return dbInstance;
}

export async function jobExists(db: Database, id: string): Promise<boolean> {
  const row = await db.get('SELECT id FROM jobs WHERE id = ?', [id]);
  return !!row;
}

export async function insertJob(db: Database, job: Partial<Job> & { id: string; company: string; title: string; source: string; apply_url: string; skipped_by?: string }): Promise<void> {
  await db.run(
    `INSERT OR IGNORE INTO jobs (
      id, source, company, title, apply_url, recruiter_name, recruiter_email,
      location_raw, employment_type, currency, salary_min, salary_max, salary_period,
      timezone_raw, description_text, match_score, should_apply, disqualification_reason,
      key_matching_skills, tailored_pitch, email_subject, status, skipped_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id,
      job.source,
      job.company,
      job.title,
      job.apply_url,
      job.recruiter_name || null,
      job.recruiter_email || null,
      job.location_raw || null,
      job.employment_type || null,
      job.currency || null,
      job.salary_min || null,
      job.salary_max || null,
      job.salary_period || null,
      job.timezone_raw || null,
      job.description_text || '',
      job.match_score || null,
      job.should_apply ? 1 : 0,
      job.disqualification_reason || null,
      job.key_matching_skills ? JSON.stringify(job.key_matching_skills) : null,
      job.tailored_pitch || null,
      job.email_subject || null,
      job.status || 'pending',
      job.skipped_by || null,
    ]
  );
}

export async function updateJobEvaluation(
  db: Database,
  id: string,
  data: {
    match_score: number;
    should_apply: boolean;
    disqualification_reason?: string | null;
    recruiter_email?: string | null;
    recruiter_name?: string | null;
    key_matching_skills?: string[];
    tailored_pitch?: string | null;
    email_subject?: string | null;
    status: JobStatus;
    skipped_by?: 'user' | 'auto';
  }
): Promise<void> {
  await db.run(
    `UPDATE jobs SET
      match_score = ?,
      should_apply = ?,
      disqualification_reason = ?,
      recruiter_email = COALESCE(?, recruiter_email),
      recruiter_name = COALESCE(?, recruiter_name),
      key_matching_skills = ?,
      tailored_pitch = ?,
      email_subject = ?,
      status = ?,
      skipped_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      data.match_score,
      data.should_apply ? 1 : 0,
      data.disqualification_reason || null,
      data.recruiter_email || null,
      data.recruiter_name || null,
      data.key_matching_skills ? JSON.stringify(data.key_matching_skills) : null,
      data.tailored_pitch || null,
      data.email_subject || null,
      data.status,
      data.status === 'skipped' ? (data.skipped_by || 'auto') : null,
      id,
    ]
  );
}

export async function updateJobStatus(db: Database, id: string, status: JobStatus, skippedBy?: 'user' | 'auto'): Promise<void> {
  if (status === 'skipped' && skippedBy) {
    await db.run('UPDATE jobs SET status = ?, skipped_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, skippedBy, id]);
  } else {
    await db.run('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
  }
}

export async function updateProfileJobStatus(
  db: Database,
  profileId: string = 'default',
  jobId: string,
  status: JobStatus,
  skippedBy?: 'user' | 'auto'
): Promise<void> {
  await db.run(
    `INSERT INTO profile_jobs (profile_id, job_id, status, skipped_by, applied_at, updated_at)
     VALUES (?, ?, ?, ?, CASE WHEN ? = 'applied' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
     ON CONFLICT(profile_id, job_id) DO UPDATE SET
       status = excluded.status,
       skipped_by = excluded.skipped_by,
       applied_at = CASE WHEN excluded.status = 'applied' THEN CURRENT_TIMESTAMP ELSE profile_jobs.applied_at END,
       updated_at = CURRENT_TIMESTAMP`,
    [profileId, jobId, status, status === 'skipped' ? (skippedBy || 'user') : null, status]
  );
}

export async function getQualifiedJobsForTriage(db: Database, profileId: string = 'default', days?: number): Promise<Job[]> {
  const daysFilter = days && days > 0 ? `AND datetime(j.created_at) >= datetime('now', '-${days} days')` : '';

  const rows = await db.all(
    `SELECT j.*,
       COALESCE(pj.status, j.status) as status,
       COALESCE(pj.skipped_by, j.skipped_by) as skipped_by,
       COALESCE(pj.match_score, j.match_score) as match_score,
       COALESCE(pj.tailored_pitch, j.tailored_pitch) as tailored_pitch,
       COALESCE(pj.email_subject, j.email_subject) as email_subject,
       COALESCE(pj.disqualification_reason, j.disqualification_reason) as disqualification_reason
     FROM jobs j
     LEFT JOIN profile_jobs pj ON j.id = pj.job_id AND pj.profile_id = ?
     WHERE (COALESCE(pj.status, j.status) = 'qualified' OR (COALESCE(pj.status, j.status) = 'pending' AND COALESCE(pj.match_score, j.match_score) >= 70))
       AND COALESCE(pj.status, j.status) NOT IN ('skipped', 'applied')
       ${daysFilter}
     ORDER BY COALESCE(pj.match_score, j.match_score) DESC, j.created_at DESC
     LIMIT 50`,
    [profileId]
  );
  return rows.map((r) => ({
    ...r,
    should_apply: Boolean(r.should_apply),
    key_matching_skills: r.key_matching_skills
      ? (typeof r.key_matching_skills === 'string' ? JSON.parse(r.key_matching_skills) : r.key_matching_skills)
      : [],
  }));
}

export async function getJobsForProfile(db: Database, profileId: string = 'default', status: string = 'qualified', days?: number): Promise<Job[]> {
  const daysFilter = days && days > 0 ? `AND datetime(j.created_at) >= datetime('now', '-${days} days')` : '';

  if (status === 'qualified') {
    return getQualifiedJobsForTriage(db, profileId, days);
  }

  if (status === 'applied') {
    const rows = await db.all(
      `SELECT j.*,
         'applied' as status,
         pj.applied_at,
         COALESCE(pj.tailored_pitch, j.tailored_pitch) as tailored_pitch,
         COALESCE(pj.email_subject, j.email_subject) as email_subject,
         COALESCE(pj.match_score, j.match_score) as match_score
       FROM profile_jobs pj
       JOIN jobs j ON pj.job_id = j.id
       WHERE pj.profile_id = ? AND pj.status = 'applied'
         ${daysFilter}
       ORDER BY pj.updated_at DESC, pj.applied_at DESC
       LIMIT 50`,
      [profileId]
    );
    return rows.map((r) => ({
      ...r,
      should_apply: Boolean(r.should_apply),
      key_matching_skills: r.key_matching_skills
        ? (typeof r.key_matching_skills === 'string' ? JSON.parse(r.key_matching_skills) : r.key_matching_skills)
        : [],
    }));
  }

  if (status === 'skipped') {
    const rows = await db.all(
      `SELECT j.*,
         'skipped' as status,
         pj.skipped_by,
         COALESCE(pj.match_score, j.match_score) as match_score
       FROM profile_jobs pj
       JOIN jobs j ON pj.job_id = j.id
       WHERE pj.profile_id = ? AND pj.status = 'skipped' AND pj.skipped_by = 'user'
         ${daysFilter}
       ORDER BY pj.updated_at DESC
       LIMIT 50`,
      [profileId]
    );
    return rows.map((r) => ({
      ...r,
      should_apply: Boolean(r.should_apply),
      key_matching_skills: r.key_matching_skills
        ? (typeof r.key_matching_skills === 'string' ? JSON.parse(r.key_matching_skills) : r.key_matching_skills)
        : [],
    }));
  }

  // Pending status
  const rows = await db.all(
    `SELECT j.*,
       COALESCE(pj.status, j.status) as status,
       COALESCE(pj.match_score, j.match_score) as match_score
     FROM jobs j
     LEFT JOIN profile_jobs pj ON j.id = pj.job_id AND pj.profile_id = ?
     WHERE COALESCE(pj.status, j.status) = ?
       ${daysFilter}
     ORDER BY COALESCE(pj.match_score, j.match_score) DESC, j.created_at DESC
     LIMIT 50`,
    [profileId, status]
  );
  return rows.map((r) => ({
    ...r,
    should_apply: Boolean(r.should_apply),
    key_matching_skills: r.key_matching_skills
      ? (typeof r.key_matching_skills === 'string' ? JSON.parse(r.key_matching_skills) : r.key_matching_skills)
      : [],
  }));
}

export async function getStats(db: Database, profileId: string = 'default', days?: number) {
  const daysFilter = days && days > 0 ? `WHERE datetime(created_at) >= datetime('now', '-${days} days')` : '';
  const daysFilterAnd = days && days > 0 ? `AND datetime(j.created_at) >= datetime('now', '-${days} days')` : '';

  const total = (await db.get(`SELECT COUNT(*) as count FROM jobs ${daysFilter}`))?.count || 0;

  const qualifiedRow = await db.get(
    `SELECT COUNT(*) as count
     FROM jobs j
     LEFT JOIN profile_jobs pj ON j.id = pj.job_id AND pj.profile_id = ?
     WHERE (COALESCE(pj.status, j.status) = 'qualified' OR (COALESCE(pj.status, j.status) = 'pending' AND COALESCE(pj.match_score, j.match_score) >= 70))
       AND COALESCE(pj.status, j.status) NOT IN ('skipped', 'applied')
       ${daysFilterAnd}`,
    [profileId]
  );
  const qualified = qualifiedRow?.count || 0;

  const appliedRow = await db.get(
    `SELECT COUNT(*) as count
     FROM profile_jobs pj
     JOIN jobs j ON pj.job_id = j.id
     WHERE pj.profile_id = ? AND pj.status = 'applied'
       ${daysFilterAnd}`,
    [profileId]
  );
  const applied = appliedRow?.count || 0;

  const skippedRow = await db.get(
    `SELECT COUNT(*) as count
     FROM profile_jobs pj
     JOIN jobs j ON pj.job_id = j.id
     WHERE pj.profile_id = ? AND pj.status = 'skipped' AND pj.skipped_by = 'user'
       ${daysFilterAnd}`,
    [profileId]
  );
  const skipped = skippedRow?.count || 0;

  const pendingRow = await db.get(
    `SELECT COUNT(*) as count
     FROM jobs j
     LEFT JOIN profile_jobs pj ON j.id = pj.job_id AND pj.profile_id = ?
     WHERE COALESCE(pj.status, j.status) = 'pending'
       ${daysFilterAnd}`,
    [profileId]
  );
  const pending = pendingRow?.count || 0;

  return { total, qualified, applied, skipped, pending };
}

export async function logOutreach(
  db: Database,
  jobId: string,
  recipientEmail: string,
  subject: string,
  status: 'sent' | 'error',
  errorMessage?: string
): Promise<void> {
  await db.run(
    `INSERT INTO outreach_log (job_id, recipient_email, subject, status, error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [jobId, recipientEmail, subject, status, errorMessage || null]
  );
}

export async function upsertUser(
  db: Database,
  user: { id: string; email: string; name: string; avatar_url?: string | null; auth_provider: 'google' | 'github' | 'email' }
) {
  await db.run(
    `INSERT INTO users (id, email, name, avatar_url, auth_provider, last_login)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
       auth_provider = excluded.auth_provider,
       last_login = CURRENT_TIMESTAMP`,
    [user.id, user.email, user.name, user.avatar_url || null, user.auth_provider]
  );
  return db.get(`SELECT * FROM users WHERE email = ?`, [user.email]);
}

export async function getUserById(db: Database, id: string) {
  return db.get(`SELECT * FROM users WHERE id = ?`, [id]);
}

export async function getUserByEmail(db: Database, email: string) {
  return db.get(`SELECT * FROM users WHERE email = ?`, [email]);
}

export async function saveAuthCode(db: Database, email: string, code: string, ttlSeconds: number = 600) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  await db.run(
    `INSERT INTO auth_codes (email, code, expires_at)
     VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at`,
    [email, code, expiresAt]
  );
}

export async function verifyAuthCode(db: Database, email: string, code: string): Promise<boolean> {
  const row = await db.get(`SELECT * FROM auth_codes WHERE email = ?`, [email]);
  if (!row) return false;
  if (row.code !== code) return false;
  if (Date.now() > row.expires_at) {
    await db.run(`DELETE FROM auth_codes WHERE email = ?`, [email]);
    return false;
  }
  await db.run(`DELETE FROM auth_codes WHERE email = ?`, [email]);
  return true;
}
