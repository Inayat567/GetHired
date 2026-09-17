import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../config';
import { getDb, getStats, getQualifiedJobsForTriage, getJobsForProfile, updateJobStatus, updateProfileJobStatus, getUserById } from '../db/database';
import {
  listProfiles,
  listProfilesForUser,
  loadProfileBundle,
  saveCandidateProfile,
  savePreferences,
  saveUserSettings,
  saveCvFile,
  createNewProfile,
  createUserProfile,
  validateProfileCompleteness,
} from '../config/profileManager';
import { AI_MODELS_BY_PROVIDER } from '../types';
import { runIngestion } from '../scrapers/ingestionService';
import { evaluatePendingJobs } from '../llm/evaluator';
import { sendPitchEmail, testSmtpConnection, sendLiveTestEmail } from '../mailer/mailer';
import { isLinkedInConnected, connectLinkedInSession, disconnectLinkedIn } from '../scrapers/linkedinAuth';
import {
  getSessionFromCookie,
  createSessionToken,
  getGitHubAuthUrl,
  handleGitHubCallback,
  getGoogleAuthUrl,
  handleGoogleCallback,
  sendEmailOtp,
  verifyEmailOtp,
} from '../auth/authService';

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
      // -------------------------------------------------------------
      // AUTHENTICATION API ENDPOINTS
      // -------------------------------------------------------------
      const session = getSessionFromCookie(req);

      // Current Session Check
      if (pathname === '/api/auth/me' && method === 'GET') {
        if (!session) return sendJson(res, 200, { authenticated: false });
        const user = await getUserById(db, session.userId);
        return sendJson(res, 200, { authenticated: !!user, user: user || null });
      }

      // Logout
      if (pathname === '/api/auth/logout' && method === 'POST') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': 'gethired_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        });
        return res.end(JSON.stringify({ success: true, message: 'Logged out successfully.' }));
      }

      // GitHub OAuth Entry
      if (pathname === '/api/auth/github' && method === 'GET') {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || `localhost:${PORT}`;
        const redirectUri = `${protocol}://${host}/api/auth/github/callback`;
        try {
          const authUrl = getGitHubAuthUrl(redirectUri);
          res.writeHead(302, { Location: authUrl });
          res.end();
          return;
        } catch (err: any) {
          return sendJson(res, 500, { error: err.message });
        }
      }

      // GitHub OAuth Callback
      if (pathname === '/api/auth/github/callback' && method === 'GET') {
        const code = parsedUrl.query.code as string;
        if (!code) return sendJson(res, 400, { error: 'Missing GitHub code parameter.' });

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || `localhost:${PORT}`;
        const redirectUri = `${protocol}://${host}/api/auth/github/callback`;

        try {
          const user = await handleGitHubCallback(code, redirectUri, db);
          const token = createSessionToken(user.id, user.email);

          res.writeHead(302, {
            Location: '/',
            'Set-Cookie': `gethired_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`,
          });
          res.end();
          return;
        } catch (err: any) {
          console.error('[GitHub Auth Error]', err);
          res.writeHead(302, { Location: '/?error=' + encodeURIComponent(err.message) });
          res.end();
          return;
        }
      }

      // Google OAuth Entry
      if (pathname === '/api/auth/google' && method === 'GET') {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || `localhost:${PORT}`;
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
        try {
          const authUrl = getGoogleAuthUrl(redirectUri);
          res.writeHead(302, { Location: authUrl });
          res.end();
          return;
        } catch (err: any) {
          return sendJson(res, 500, { error: err.message });
        }
      }

      // Google OAuth Callback
      if (pathname === '/api/auth/google/callback' && method === 'GET') {
        const code = parsedUrl.query.code as string;
        if (!code) return sendJson(res, 400, { error: 'Missing Google code parameter.' });

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || `localhost:${PORT}`;
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

        try {
          const user = await handleGoogleCallback(code, redirectUri, db);
          const token = createSessionToken(user.id, user.email);

          res.writeHead(302, {
            Location: '/',
            'Set-Cookie': `gethired_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`,
          });
          res.end();
          return;
        } catch (err: any) {
          console.error('[Google Auth Error]', err);
          res.writeHead(302, { Location: '/?error=' + encodeURIComponent(err.message) });
          res.end();
          return;
        }
      }

      // Email OTP Send
      if (pathname === '/api/auth/send-otp' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.email) return sendJson(res, 400, { error: 'Email is required.' });
        await sendEmailOtp(body.email, db);
        return sendJson(res, 200, { success: true, message: 'Verification code sent to your email.' });
      }

      // Email OTP Verify
      if (pathname === '/api/auth/verify-otp' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.email || !body.code) return sendJson(res, 400, { error: 'Email and 6-digit code are required.' });
        const user = await verifyEmailOtp(body.email, body.code, db);
        if (!user) return sendJson(res, 400, { error: 'Invalid or expired verification code.' });

        const token = createSessionToken(user.id, user.email);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `gethired_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`,
        });
        return res.end(JSON.stringify({ success: true, user }));
      }

      // Resolve active profile ID: Strictly scoped to logged-in user if authenticated
      let effectiveProfileId = 'default';
      let currentUserAccount: any = null;
      if (session) {
        currentUserAccount = await getUserById(db, session.userId);
        const requestedId = parsedUrl.query.id as string;
        if (requestedId && (requestedId === session.userId || requestedId.startsWith(session.userId + '__'))) {
          effectiveProfileId = requestedId;
        } else {
          effectiveProfileId = session.userId;
        }
      } else {
        effectiveProfileId = (parsedUrl.query.id as string) || 'default';
      }

      // API: List Profiles (User Scoped)
      if (pathname === '/api/profiles' && method === 'GET') {
        const list = listProfilesForUser(session?.userId, currentUserAccount || undefined);
        return sendJson(res, 200, { profiles: list, active: effectiveProfileId });
      }

      // API: Create Profile (User Scoped)
      if (pathname === '/api/profiles' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name) return sendJson(res, 400, { error: 'Profile name required.' });
        const created = createUserProfile(body.name, session?.userId, currentUserAccount || undefined);
        return sendJson(res, 201, { success: true, profile: created });
      }

      // API: Get Available AI Models
      if (pathname === '/api/ai-models' && method === 'GET') {
        return sendJson(res, 200, { models: AI_MODELS_BY_PROVIDER });
      }

      // API: Get Active Profile Bundle
      if (pathname === '/api/profile' && method === 'GET') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const bundle = loadProfileBundle(profileId);
        return sendJson(res, 200, bundle);
      }

      // API: Save Candidate Profile
      if (pathname === '/api/profile' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const body = await parseBody(req);
        saveCandidateProfile(profileId, body);
        return sendJson(res, 200, { success: true, message: 'Candidate profile updated.' });
      }

      // API: Save Preferences
      if (pathname === '/api/preferences' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const body = await parseBody(req);
        savePreferences(profileId, body);
        return sendJson(res, 200, { success: true, message: 'Preferences updated.' });
      }

      // API: Get / Save AI & SMTP Settings
      if (pathname === '/api/settings' && method === 'GET') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const bundle = loadProfileBundle(profileId);
        return sendJson(res, 200, bundle.settings);
      }

      if (pathname === '/api/settings' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const body = await parseBody(req);
        saveUserSettings(profileId, body);
        return sendJson(res, 200, { success: true, message: 'AI & SMTP settings saved successfully.' });
      }

      // API: Upload CV (Base64 PDF)
      if (pathname === '/api/cv/upload' && method === 'POST') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
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

      // API: Get Jobs (Profile Scoped)
      if (pathname === '/api/jobs' && method === 'GET') {
        const status = (parsedUrl.query.status as string) || 'qualified';
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const jobs = await getJobsForProfile(db, profileId, status);
        return sendJson(res, 200, { jobs });
      }

      // API: Job Action (Send Email / Open URL / Skip) - Profile Scoped
      if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/action') && method === 'POST') {
        const parts = pathname.split('/');
        const jobId = parts[3];
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
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
          const result = await sendPitchEmail(db, job, profileConfig, bundle.settings.smtp, profileId);
          if (result.success) {
            await updateProfileJobStatus(db, profileId, jobId, 'applied');
          }
          return sendJson(res, result.success ? 200 : 400, result);
        } else if (action === 'skip') {
          await updateProfileJobStatus(db, profileId, jobId, 'skipped', 'user');
          return sendJson(res, 200, { success: true, message: 'Job marked as skipped for this profile.' });
        } else if (action === 'mark_applied') {
          await updateProfileJobStatus(db, profileId, jobId, 'applied');
          return sendJson(res, 200, { success: true, message: 'Job marked as applied for this profile.' });
        }

        return sendJson(res, 400, { error: 'Unknown action' });
      }

      // API: Check Profile Completeness & Readiness
      if (pathname === '/api/profile/validate' && method === 'GET') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const validation = validateProfileCompleteness(profileId);
        return sendJson(res, 200, validation);
      }

      // API: Run Discovery & Evaluation
      if (pathname === '/api/discover' && method === 'POST') {
        const body = await parseBody(req);
        const profileId = body.profileId || (parsedUrl.query.id as string) || effectiveProfileId;
        const bundle = loadProfileBundle(profileId);

        // Validate mandatory configuration before running discovery & AI evaluation
        const validation = validateProfileCompleteness(profileId);
        if (!validation.isValid) {
          return sendJson(res, 400, {
            success: false,
            error: 'Configuration incomplete',
            missing: validation.missing,
            message: `Please complete required settings before searching for jobs: ${validation.missing.join(', ')}.`,
          });
        }

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

      // API: Stats (Profile Scoped)
      if (pathname === '/api/stats' && method === 'GET') {
        const profileId = (parsedUrl.query.id as string) || effectiveProfileId;
        const stats = await getStats(db, profileId);
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

      // Static SEO & Branding Assets
      if (pathname === '/robots.txt') {
        const filePath = path.resolve(__dirname, 'public', 'robots.txt');
        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      if (pathname === '/sitemap.xml') {
        const filePath = path.resolve(__dirname, 'public', 'sitemap.xml');
        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      if (pathname === '/logo.svg' || pathname === '/favicon.ico' || pathname === '/favicon.svg') {
        const filePath = path.resolve(__dirname, 'public', 'logo.svg');
        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      if (pathname === '/site.webmanifest') {
        const filePath = path.resolve(__dirname, 'public', 'site.webmanifest');
        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
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
