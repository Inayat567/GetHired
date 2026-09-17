import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { Database } from 'sqlite';
import { upsertUser, getUserById, getUserByEmail, saveAuthCode, verifyAuthCode } from '../db/database';
import { UserAccount } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'gethired_production_jwt_secret_key_928374';

// Native lightweight JWT-like signed token creation and verification
export function createSessionToken(userId: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 Year
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

export function getSessionFromCookie(req: any): { userId: string; email: string } | null {
  const cookieHeader =
    req?.headers?.cookie ||
    (typeof req?.headers?.get === 'function' ? req.headers.get('cookie') : '') ||
    '';
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, c: string) => {
    const [k, v] = c.trim().split('=');
    if (k && v) acc[k] = decodeURIComponent(v);
    return acc;
  }, {});

  const token = cookies['gethired_session'];
  if (!token) return null;

  return verifySessionToken(token);
}

// Simple HTTPS Request Helper
function httpsRequest(options: https.RequestOptions, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// 1. GitHub OAuth Flow
export function getGitHubAuthUrl(redirectUri: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured in .env');
  return `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
}

export async function handleGitHubCallback(code: string, redirectUri: string, db: Database): Promise<UserAccount> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GitHub OAuth credentials missing in .env');

  // Exchange code for access_token
  const postData = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await httpsRequest(
    {
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'GetHired-Copilot',
      },
    },
    postData
  );

  const accessToken = tokenRes.access_token;
  if (!accessToken) throw new Error(tokenRes.error_description || 'Failed to obtain GitHub access token');

  // Fetch user profile
  const userProfile = await httpsRequest({
    hostname: 'api.github.com',
    path: '/user',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'GetHired-Copilot',
    },
  });

  let email = userProfile.email;
  if (!email) {
    // Fetch primary verified email if private
    const emails = await httpsRequest({
      hostname: 'api.github.com',
      path: '/user/emails',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'GetHired-Copilot',
      },
    });
    if (Array.isArray(emails)) {
      const primary = emails.find((e: any) => e.primary && e.verified);
      email = primary ? primary.email : emails[0]?.email;
    }
  }

  if (!email) throw new Error('Could not retrieve a verified email from GitHub account.');

  const userId = `gh_${userProfile.id}`;
  const name = userProfile.name || userProfile.login || 'GitHub Developer';
  const avatar_url = userProfile.avatar_url;

  return (await upsertUser(db, {
    id: userId,
    email,
    name,
    avatar_url,
    auth_provider: 'github',
  })) as UserAccount;
}

// 2. Google OAuth Flow
export function getGoogleAuthUrl(redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured in .env');
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };
  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
}

export async function handleGoogleCallback(code: string, redirectUri: string, db: Database): Promise<UserAccount> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials missing in .env');

  // Exchange code for tokens
  const postData = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }).toString();

  const tokenRes = await httpsRequest(
    {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    postData
  );

  const accessToken = tokenRes.access_token;
  if (!accessToken) throw new Error(tokenRes.error_description || 'Failed to obtain Google access token');

  // Fetch Google userinfo
  const userInfo = await httpsRequest({
    hostname: 'www.googleapis.com',
    path: `/oauth2/v2/userinfo?access_token=${accessToken}`,
    method: 'GET',
  });

  if (!userInfo.email) throw new Error('Could not retrieve email from Google account.');

  const userId = `goog_${userInfo.id}`;
  const name = userInfo.name || userInfo.email.split('@')[0];
  const avatar_url = userInfo.picture;

  return (await upsertUser(db, {
    id: userId,
    email: userInfo.email,
    name,
    avatar_url,
    auth_provider: 'google',
  })) as UserAccount;
}

// 3. Resend / Free Email OTP Dispatcher
export async function sendEmailOtp(email: string, db: Database): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

  await saveAuthCode(db, cleanEmail, code, 600); // 10 minutes TTL

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const emailPayload = JSON.stringify({
      from: 'GetHired <auth@innunext.com>',
      to: [cleanEmail],
      subject: `Your GetHired Login Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #1e1b4b; margin-top: 0;">Sign in to GetHired</h2>
          <p style="color: #475569; font-size: 14px; line-height: 22px;">Use the 6-digit verification code below to securely access your personal job copilot, preferences, and outreach pitches:</p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; background-color: #eef2ff; padding: 12px 24px; border-radius: 12px; display: inline-block;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes. If you did not request this login, please ignore this email.</p>
        </div>
      `,
    });

    try {
      await httpsRequest(
        {
          hostname: 'api.resend.com',
          path: '/emails',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        },
        emailPayload
      );
      return true;
    } catch (err) {
      console.error('[Resend Error]', err);
    }
  }

  // Fallback: log code in server terminal
  console.log(`\n🔑 [Local/Console OTP Code] For ${cleanEmail} -> ${code}\n`);
  return true;
}

export async function verifyEmailOtp(email: string, code: string, db: Database): Promise<UserAccount | null> {
  const cleanEmail = email.trim().toLowerCase();
  const valid = await verifyAuthCode(db, cleanEmail, code.trim());
  if (!valid) return null;

  const existing = await getUserByEmail(db, cleanEmail);
  const userId = existing ? existing.id : `user_${crypto.randomBytes(8).toString('hex')}`;
  const name = cleanEmail.split('@')[0];

  return (await upsertUser(db, {
    id: userId,
    email: cleanEmail,
    name,
    auth_provider: 'email',
  })) as UserAccount;
}
