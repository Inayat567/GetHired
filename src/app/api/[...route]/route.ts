import { NextResponse } from 'next/server';
import path from 'path';
import { loadConfig } from '@/config';
import { getDb, getStats, getQualifiedJobsForTriage, updateJobStatus, getUserById } from '@/db/database';
import {
  listProfiles,
  loadProfileBundle,
  saveCandidateProfile,
  savePreferences,
  saveUserSettings,
  saveCvFile,
  createNewProfile,
  validateProfileCompleteness,
} from '@/config/profileManager';
import { AI_MODELS_BY_PROVIDER } from '@/types';
import { runIngestion } from '@/scrapers/ingestionService';
import { evaluatePendingJobs } from '@/llm/evaluator';
import { sendPitchEmail, testSmtpConnection, sendLiveTestEmail } from '@/mailer/mailer';
import { isLinkedInConnected, connectLinkedInSession, disconnectLinkedIn } from '@/scrapers/linkedinAuth';
import {
  getSessionFromCookie,
  createSessionToken,
  getGitHubAuthUrl,
  handleGitHubCallback,
  getGoogleAuthUrl,
  handleGoogleCallback,
  sendEmailOtp,
  verifyEmailOtp,
} from '@/auth/authService';

export const dynamic = 'force-dynamic';

async function getDatabase() {
  const config = loadConfig();
  return await getDb(config.paths.sqliteDb);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(req: Request, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  const pathname = '/api/' + (route || []).join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const config = loadConfig();
  const db = await getDatabase();
  const session = getSessionFromCookie(req);

  try {
    // 1. Current Session
    if (pathname === '/api/auth/me') {
      if (!session) return NextResponse.json({ authenticated: false });
      const user = await getUserById(db, session.userId);
      return NextResponse.json({ authenticated: !!user, user: user || null });
    }

    // 2. GitHub OAuth Entry
    if (pathname === '/api/auth/github') {
      const protocol = req.headers.get('x-forwarded-proto') || (url.protocol.replace(':', '')) || 'http';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
      const redirectUri = `${protocol}://${host}/api/auth/github/callback`;
      try {
        const authUrl = getGitHubAuthUrl(redirectUri);
        return NextResponse.redirect(authUrl);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    // 3. GitHub OAuth Callback
    if (pathname === '/api/auth/github/callback') {
      const code = searchParams.get('code');
      if (!code) return NextResponse.json({ error: 'Missing GitHub code parameter.' }, { status: 400 });

      const protocol = req.headers.get('x-forwarded-proto') || (url.protocol.replace(':', '')) || 'http';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
      const redirectUri = `${protocol}://${host}/api/auth/github/callback`;

      try {
        const user = await handleGitHubCallback(code, redirectUri, db);
        const token = createSessionToken(user.id, user.email);

        const res = NextResponse.redirect(new URL('/dashboard', req.url));
        res.cookies.set('gethired_session', token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60,
        });
        return res;
      } catch (err: any) {
        console.error('[GitHub Auth Error]', err);
        return NextResponse.redirect(new URL('/dashboard?error=' + encodeURIComponent(err.message), req.url));
      }
    }

    // 4. Google OAuth Entry
    if (pathname === '/api/auth/google') {
      const protocol = req.headers.get('x-forwarded-proto') || (url.protocol.replace(':', '')) || 'http';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
      try {
        const authUrl = getGoogleAuthUrl(redirectUri);
        return NextResponse.redirect(authUrl);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    // 5. Google OAuth Callback
    if (pathname === '/api/auth/google/callback') {
      const code = searchParams.get('code');
      if (!code) return NextResponse.json({ error: 'Missing Google code parameter.' }, { status: 400 });

      const protocol = req.headers.get('x-forwarded-proto') || (url.protocol.replace(':', '')) || 'http';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

      try {
        const user = await handleGoogleCallback(code, redirectUri, db);
        const token = createSessionToken(user.id, user.email);

        const res = NextResponse.redirect(new URL('/dashboard', req.url));
        res.cookies.set('gethired_session', token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60,
        });
        return res;
      } catch (err: any) {
        console.error('[Google Auth Error]', err);
        return NextResponse.redirect(new URL('/dashboard?error=' + encodeURIComponent(err.message), req.url));
      }
    }

    // Resolve profile ID
    const effectiveProfileId = session ? session.userId : (searchParams.get('id') || 'default');

    // 6. Profiles list
    if (pathname === '/api/profiles') {
      const list = listProfiles();
      if (session && !list.includes(session.userId)) {
        list.unshift(session.userId);
      }
      return NextResponse.json({ profiles: list, active: effectiveProfileId });
    }

    // 7. AI Models
    if (pathname === '/api/ai-models') {
      return NextResponse.json({ models: AI_MODELS_BY_PROVIDER });
    }

    // 8. Get Active Profile Bundle
    if (pathname === '/api/profile') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      const bundle = loadProfileBundle(profileId);
      return NextResponse.json(bundle);
    }

    // 9. Get Settings
    if (pathname === '/api/settings') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      const bundle = loadProfileBundle(profileId);
      return NextResponse.json(bundle.settings);
    }

    // 10. Get Jobs
    if (pathname === '/api/jobs') {
      const status = searchParams.get('status') || 'qualified';
      let jobs;
      if (status === 'qualified') {
        jobs = await getQualifiedJobsForTriage(db);
      } else if (status === 'skipped') {
        jobs = await db.all(`SELECT * FROM jobs WHERE status = 'skipped' AND skipped_by = 'user' ORDER BY updated_at DESC, created_at DESC LIMIT 50`);
      } else {
        jobs = await db.all(`SELECT * FROM jobs WHERE status = ? ORDER BY match_score DESC, created_at DESC LIMIT 50`, [status]);
      }
      return NextResponse.json({ jobs });
    }

    // 11. Profile Validation
    if (pathname === '/api/profile/validate') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      const validation = validateProfileCompleteness(profileId);
      return NextResponse.json(validation);
    }

    // 12. Stats
    if (pathname === '/api/stats') {
      const stats = await getStats(db);
      return NextResponse.json(stats);
    }

    // 13. LinkedIn Status
    if (pathname === '/api/linkedin/status') {
      return NextResponse.json({ connected: isLinkedInConnected() });
    }

    return NextResponse.json({ error: `Route ${pathname} not found.` }, { status: 404 });
  } catch (err: any) {
    console.error('[API Route Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  const pathname = '/api/' + (route || []).join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const config = loadConfig();
  const db = await getDatabase();
  const session = getSessionFromCookie(req);
  const effectiveProfileId = session ? session.userId : (searchParams.get('id') || 'default');

  let body: any = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  try {
    // 1. Logout
    if (pathname === '/api/auth/logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      res.cookies.set('gethired_session', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
      });
      return res;
    }

    // 2. Email OTP Send
    if (pathname === '/api/auth/send-otp') {
      if (!body.email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
      await sendEmailOtp(body.email, db);
      return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });
    }

    // 3. Email OTP Verify
    if (pathname === '/api/auth/verify-otp') {
      if (!body.email || !body.code) {
        return NextResponse.json({ error: 'Email and 6-digit code are required.' }, { status: 400 });
      }
      const user = await verifyEmailOtp(body.email, body.code, db);
      if (!user) return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });

      const token = createSessionToken(user.id, user.email);
      const res = NextResponse.json({ success: true, user });
      res.cookies.set('gethired_session', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
      });
      return res;
    }

    // 4. Create Profile
    if (pathname === '/api/profiles') {
      if (!body.name) return NextResponse.json({ error: 'Profile name required.' }, { status: 400 });
      const created = createNewProfile(body.name);
      return NextResponse.json({ success: true, profile: created }, { status: 201 });
    }

    // 5. Save Candidate Profile
    if (pathname === '/api/profile') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      saveCandidateProfile(profileId, body);
      return NextResponse.json({ success: true, message: 'Candidate profile updated.' });
    }

    // 6. Save Preferences
    if (pathname === '/api/preferences') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      savePreferences(profileId, body);
      return NextResponse.json({ success: true, message: 'Preferences updated.' });
    }

    // 7. Save Settings
    if (pathname === '/api/settings') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      saveUserSettings(profileId, body);
      return NextResponse.json({ success: true, message: 'AI & SMTP settings saved successfully.' });
    }

    // 8. Upload CV (Base64 PDF)
    if (pathname === '/api/cv/upload') {
      const profileId = searchParams.get('id') || effectiveProfileId;
      if (!body.base64) return NextResponse.json({ error: 'base64 data required' }, { status: 400 });
      const cleanBase64 = body.base64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      saveCvFile(profileId, buffer);
      return NextResponse.json({
        success: true,
        message: 'Resume CV updated successfully.',
        sizeBytes: buffer.length,
      });
    }

    // 9. Job Action (send_email / skip / mark_applied)
    if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/action')) {
      const parts = pathname.split('/');
      const jobId = parts[3];
      const profileId = searchParams.get('id') || 'default';
      const bundle = loadProfileBundle(profileId);
      const action = body.action;

      const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

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
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      } else if (action === 'skip') {
        await updateJobStatus(db, jobId, 'skipped', 'user');
        return NextResponse.json({ success: true, message: 'Job marked as skipped.' });
      } else if (action === 'mark_applied') {
        await updateJobStatus(db, jobId, 'applied');
        return NextResponse.json({ success: true, message: 'Job marked as applied.' });
      }

      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // 10. Run Discovery & Evaluation
    if (pathname === '/api/discover') {
      const profileId = body.profileId || searchParams.get('id') || effectiveProfileId;
      const bundle = loadProfileBundle(profileId);

      const validation = validateProfileCompleteness(profileId);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Configuration incomplete',
            missing: validation.missing,
            message: `Please complete required settings before searching for jobs: ${validation.missing.join(', ')}.`,
          },
          { status: 400 }
        );
      }

      const profileConfig: any = {
        ...config,
        preferences: bundle.preferences,
        candidateProfile: bundle.candidateProfile,
      };

      const report = await runIngestion(db, profileConfig);
      const evalLimit = body.evalLimit || 10;
      const evaluated = await evaluatePendingJobs(db, profileConfig, evalLimit, bundle.settings);
      const stats = await getStats(db);
      const qualifiedJobs = await getQualifiedJobsForTriage(db);

      return NextResponse.json({
        success: true,
        report,
        evaluated,
        stats,
        jobs: qualifiedJobs,
      });
    }

    // 11. Test SMTP Verification
    if (pathname === '/api/test-smtp') {
      const profileId = searchParams.get('id') || 'default';
      const bundle = loadProfileBundle(profileId);
      const smtpToTest = body.smtp || bundle.settings.smtp;
      const result = await testSmtpConnection(config, smtpToTest);
      return NextResponse.json(result);
    }

    // 12. Send Live Test Email
    if (pathname === '/api/send-test-email') {
      const profileId = searchParams.get('id') || 'default';
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
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // 13. Connect LinkedIn
    if (pathname === '/api/linkedin/connect') {
      const result = await connectLinkedInSession();
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // 14. Disconnect LinkedIn
    if (pathname === '/api/linkedin/disconnect') {
      const ok = disconnectLinkedIn();
      return NextResponse.json({ success: ok, message: 'LinkedIn disconnected.' });
    }

    return NextResponse.json({ error: `Route ${pathname} not found.` }, { status: 404 });
  } catch (err: any) {
    console.error('[API Route Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
