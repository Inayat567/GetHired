import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Job, JobStatus } from '../types';

let dbInstance: Database | null = null;

export async function getDb(dbPath: string = './jobs.db'): Promise<Database> {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
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

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(match_score);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Migrate existing table if skipped_by column doesn't exist
  try {
    await dbInstance.exec(`ALTER TABLE jobs ADD COLUMN skipped_by TEXT;`);
  } catch {
    // Column already exists
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

export async function getQualifiedJobsForTriage(db: Database): Promise<Job[]> {
  const rows = await db.all(
    `SELECT * FROM jobs 
     WHERE status = 'qualified' OR (status = 'pending' AND match_score >= 70)
     ORDER BY match_score DESC, created_at DESC`
  );
  return rows.map((r) => ({
    ...r,
    should_apply: Boolean(r.should_apply),
    key_matching_skills: r.key_matching_skills ? JSON.parse(r.key_matching_skills) : [],
  }));
}

export async function getStats(db: Database) {
  const total = (await db.get('SELECT COUNT(*) as count FROM jobs'))?.count || 0;
  const qualified = (await db.get("SELECT COUNT(*) as count FROM jobs WHERE status = 'qualified'"))?.count || 0;
  const applied = (await db.get("SELECT COUNT(*) as count FROM jobs WHERE status = 'applied'"))?.count || 0;
  const skipped = (await db.get("SELECT COUNT(*) as count FROM jobs WHERE status = 'skipped' AND skipped_by = 'user'"))?.count || 0;
  const pending = (await db.get("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'"))?.count || 0;
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
