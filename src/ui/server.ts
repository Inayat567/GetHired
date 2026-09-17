import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../config';
import { getDb, getStats, getQualifiedJobsForTriage, updateJobStatus } from '../db/database';
import {
  listProfiles,
  loadProfileBundle,
  saveCandidateProfile,
  savePreferences,
  saveUserSettings,
  saveCvFile,
  createNewProfile,
} from '../config/profileManager';
import { AI_MODELS_BY_PROVIDER } from '../types';
import { runIngestion } from '../scrapers/ingestionService';
import { evaluatePendingJobs } from '../llm/evaluator';
import { sendPitchEmail, testSmtpConnection, sendLiveTestEmail } from '../mailer/mailer';
import { isLinkedInConnected, connectLinkedInSession, disconnectLinkedIn } from '../scrapers/linkedinAuth';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function sendJson(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export async function startServer() {
  const config = loadConfig();
  const db = await getDb(config.paths.sqliteDb);

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';
    const method = req.method || 'GET';

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    try {
      // API: List Profiles
      if (pathname === '/api/profiles' && method === 'GET') {
        return sendJson(res, 200, { profiles: listProfiles() });
      }

      // API: Create Profile
      if (pathname === '/api/profiles' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name) return sendJson(res, 400, { error: 'Profile name required.' });
        const created = createNewProfile(body.name);
        return sendJson(res, 201, { success: true, profile: created });
      }

      // API: Get Available AI Models
      if (pathname === '/api/ai-models' && method === 'GET') {
        return sendJson(res, 200, { models: AI_MODELS_BY_PROVIDER });
      }

      // API: Get Active Profile Bundle
      if (pathname === '/api/profile' && method === 'GET') {
        const profileId = (parsedUrl.query.id as string) || 'default';
        const bundle = loadProfileBundle(profileId);
        return sendJson(res, 200, bundle);
      }

      // API: Save Candidate Profile
      if (pathname === '/api/profile' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || 'default';
        const body = await parseBody(req);
        saveCandidateProfile(profileId, body);
        return sendJson(res, 200, { success: true, message: 'Candidate profile updated.' });
      }

      // API: Save Preferences
      if (pathname === '/api/preferences' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || 'default';
        const body = await parseBody(req);
        savePreferences(profileId, body);
        return sendJson(res, 200, { success: true, message: 'Preferences updated.' });
      }

      // API: Get / Save AI & SMTP Settings
      if (pathname === '/api/settings' && method === 'GET') {
        const profileId = (parsedUrl.query.id as string) || 'default';
        const bundle = loadProfileBundle(profileId);
        return sendJson(res, 200, bundle.settings);
      }

      if (pathname === '/api/settings' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || 'default';
        const body = await parseBody(req);
        saveUserSettings(profileId, body);
        return sendJson(res, 200, { success: true, message: 'AI & SMTP settings saved successfully.' });
      }

      // API: Upload CV (Base64 PDF)
      if (pathname === '/api/cv/upload' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || 'default';
        const body = await parseBody(req);
        if (!body.base64) return sendJson(res, 400, { error: 'base64 data required' });
        const cleanBase64 = body.base64.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        saveCvFile(profileId, buffer);
        return sendJson(res, 200, {
          success: true,
          message: 'Resume CV updated successfully.',
          sizeBytes: buffer.length,
        });
      }

      // API: Get Jobs
      if (pathname === '/api/jobs' && method === 'GET') {
        const status = (parsedUrl.query.status as string) || 'qualified';
        let jobs;
        if (status === 'qualified') {
          jobs = await getQualifiedJobsForTriage(db);
        } else if (status === 'skipped') {
          // Only return jobs explicitly skipped by the user, not auto-discarded bulk noise
          jobs = await db.all(`SELECT * FROM jobs WHERE status = 'skipped' AND skipped_by = 'user' ORDER BY updated_at DESC, created_at DESC LIMIT 50`);
        } else {
          jobs = await db.all(`SELECT * FROM jobs WHERE status = ? ORDER BY match_score DESC, created_at DESC LIMIT 50`, [status]);
        }
        return sendJson(res, 200, { jobs });
      }

      // API: Job Action (Send Email / Open URL / Skip)
      if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/action') && method === 'POST') {
        const parts = pathname.split('/');
        const jobId = parts[3];
        const profileId = (parsedUrl.query.id as string) || 'default';
        const bundle = loadProfileBundle(profileId);
        const body = await parseBody(req);
        const action = body.action;

        const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (!job) return sendJson(res, 404, { error: 'Job not found' });

        if (action === 'send_email') {
          const profileConfig: any = {
            ...config,
            paths: {
              ...config.paths,
              cvAttachment: path.resolve('./profiles', profileId, 'cv.pdf'),
            },
            candidateProfile: bundle.candidateProfile,
            smtp: bundle.settings.smtp,
          };
          const result = await sendPitchEmail(db, job, profileConfig, bundle.settings.smtp);
          return sendJson(res, result.success ? 200 : 400, result);
        } else if (action === 'skip') {
          await updateJobStatus(db, jobId, 'skipped', 'user');
          return sendJson(res, 200, { success: true, message: 'Job marked as skipped.' });
        } else if (action === 'mark_applied') {
          await updateJobStatus(db, jobId, 'applied');
          return sendJson(res, 200, { success: true, message: 'Job marked as applied.' });
        }

        return sendJson(res, 400, { error: 'Unknown action' });
      }

      // API: Run Discovery & Evaluation
      if (pathname === '/api/discover' && method === 'POST') {
        const body = await parseBody(req);
        const profileId = body.profileId || (parsedUrl.query.id as string) || 'default';
        const bundle = loadProfileBundle(profileId);

        // Use active profile preferences and profile data for ingestion and evaluation
        const profileConfig: any = {
          ...config,
          preferences: bundle.preferences,
          candidateProfile: bundle.candidateProfile,
        };

        // Run ingestion with active profile filters
        const report = await runIngestion(db, profileConfig);

        // Run LLM semantic evaluation using the profile's chosen AI provider and key
        const evalLimit = body.evalLimit || 10;
        const evaluated = await evaluatePendingJobs(db, profileConfig, evalLimit, bundle.settings);

        // Fetch refreshed stats and qualified jobs
        const stats = await getStats(db);
        const qualifiedJobs = await getQualifiedJobsForTriage(db);

        return sendJson(res, 200, {
          success: true,
          report,
          evaluated,
          stats,
          jobs: qualifiedJobs,
        });
      }

      // API: Stats
      if (pathname === '/api/stats' && method === 'GET') {
        const stats = await getStats(db);
        return sendJson(res, 200, stats);
      }

      // API: Test SMTP Verification
      if (pathname === '/api/test-smtp' && method === 'POST') {
        const body = await parseBody(req);
        const profileId = (parsedUrl.query.id as string) || 'default';
        const bundle = loadProfileBundle(profileId);
        const smtpToTest = body.smtp || bundle.settings.smtp;
        const result = await testSmtpConnection(config, smtpToTest);
        return sendJson(res, 200, result);
      }

      // API: Send Live Test Email
      if (pathname === '/api/send-test-email' && method === 'POST') {
        const body = await parseBody(req);
        const profileId = (parsedUrl.query.id as string) || 'default';
        const bundle = loadProfileBundle(profileId);
        const smtp = body.smtp || bundle.settings.smtp;
        const profileConfig: any = {
          ...config,
          paths: {
            ...config.paths,
            cvAttachment: path.resolve('./profiles', profileId, 'cv.pdf'),
          },
          candidateProfile: bundle.candidateProfile,
        };
        const result = await sendLiveTestEmail(
          profileConfig,
          body.recipient,
          body.subject,
          body.body,
          body.attachCv,
          smtp
        );
        return sendJson(res, result.success ? 200 : 400, result);
      }

      // API: LinkedIn Status
      if (pathname === '/api/linkedin/status' && method === 'GET') {
        return sendJson(res, 200, { connected: isLinkedInConnected() });
      }

      // API: Connect LinkedIn (Opens headed browser, waits for user login, auto-closes)
      if (pathname === '/api/linkedin/connect' && method === 'POST') {
        const result = await connectLinkedInSession();
        return sendJson(res, result.success ? 200 : 400, result);
      }

      // API: Disconnect LinkedIn
      if (pathname === '/api/linkedin/disconnect' && method === 'POST') {
        const ok = disconnectLinkedIn();
        return sendJson(res, 200, { success: ok, message: 'LinkedIn disconnected.' });
      }

      // Static UI Homepage
      if (pathname === '/' || pathname === '/index.html') {
        const htmlPath = path.resolve(__dirname, 'public', 'index.html');
        if (fs.existsSync(htmlPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(htmlPath).pipe(res);
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (err: any) {
      console.error('[Server Error]', err);
      sendJson(res, 500, { error: err.message });
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 GetHired Web Dashboard running at: http://localhost:${PORT}`);
    console.log(`👉 Open http://localhost:${PORT} in your browser to manage CV, preferences, AI keys, and review jobs.\n`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}
