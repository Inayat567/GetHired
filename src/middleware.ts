import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPublicBaseUrl } from './utils/url';

// In-memory rate limiting tracker (per IP/route)
interface RateLimitRecord {
  count: number;
  firstRequest: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.firstRequest > windowMs) {
    rateLimitMap.set(key, { count: 1, firstRequest: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit sensitive authentication endpoints
  if (pathname === '/api/auth/send-otp') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const allowed = checkRateLimit(`send_otp_${ip}`, 5, 10 * 60 * 1000); // 5 per 10 mins
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }
  }

  if (pathname === '/api/auth/verify-otp') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const allowed = checkRateLimit(`verify_otp_${ip}`, 10, 10 * 60 * 1000); // 10 attempts per 10 mins
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait 10 minutes before retrying.' },
        { status: 429 }
      );
    }
  }

  // Protect /dashboard and any nested routes
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = req.cookies.get('gethired_session')?.value;

    // If no cookie exists, redirect to home with auth_required notice
    const baseUrl = getPublicBaseUrl(req);
    if (!sessionCookie) {
      const redirectUrl = new URL('/', baseUrl);
      redirectUrl.searchParams.set('auth_required', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    try {
      const parts = sessionCookie.split('.');
      if (parts.length !== 3) {
        throw new Error('Malformed token');
      }

      // Base64URL decode the JWT payload
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = atob(base64);
      const payload = JSON.parse(jsonStr);

      // Validate expiration
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        throw new Error('Session expired');
      }

      // Verified active session
      return NextResponse.next();
    } catch {
      // Invalid or expired token: clear cookie and redirect to home with session_expired notice
      const redirectUrl = new URL('/', baseUrl);
      redirectUrl.searchParams.set('session_expired', 'true');
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set('gethired_session', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/api/auth/send-otp', '/api/auth/verify-otp'],
};
