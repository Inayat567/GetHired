/**
 * Resolves the true public base URL of the application.
 * Respects APP_URL env variable, reverse-proxy headers (x-forwarded-host, x-forwarded-proto),
 * and safely falls back to localhost in local development.
 */
export function getPublicBaseUrl(req: { headers: { get: (name: string) => string | null }; url: string }): string {
  // 1. Explicit environment variable override (e.g. https://gethired.innunext.com)
  if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
    return process.env.APP_URL.trim().replace(/\/$/, '');
  }

  // 2. Read reverse-proxy headers (Fly.io, Cloudflare, Nginx, etc.)
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');

  if (host) {
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const proto = forwardedProto || (isLocal ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  // 3. Fallback to request URL origin
  try {
    return new URL(req.url).origin;
  } catch {
    return 'http://localhost:3000';
  }
}
