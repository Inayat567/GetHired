import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /dashboard and any nested routes
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = req.cookies.get('gethired_session')?.value;

    // If no cookie exists, redirect to home with auth_required notice
    if (!sessionCookie) {
      const redirectUrl = new URL('/', req.url);
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
      const redirectUrl = new URL('/', req.url);
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
  matcher: ['/dashboard', '/dashboard/:path*'],
};
