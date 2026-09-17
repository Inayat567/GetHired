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

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(match_score);
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
