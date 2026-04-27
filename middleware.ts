import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register'];

// In-memory banned IP cache refreshed every 30s
const bannedCache: { ips: Set<string>; lastSync: number } = { ips: new Set(), lastSync: 0 };

async function syncBannedIps(baseUrl: string) {
  if (Date.now() - bannedCache.lastSync < 30_000) return;
  try {
    const res = await fetch(`${baseUrl}/api/visitors/banned-ips`, { cache: 'no-store' });
    if (res.ok) {
      const ips: string[] = await res.json();
      bannedCache.ips = new Set(ips);
    }
  } catch {}
  bannedCache.lastSync = Date.now();
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check IP ban (skip admin API and visitor tracking endpoints)
  if (!pathname.startsWith('/api/admin') && !pathname.startsWith('/api/visitors')) {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
    await syncBannedIps(req.nextUrl.origin);
    if (clientIp && bannedCache.ips.has(clientIp)) {
      return new NextResponse(
        '<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#111;color:#fff"><div style="text-align:center"><h1 style="font-size:2rem;margin-bottom:0.5rem">Access Denied</h1><p style="color:#999">Your IP address has been blocked.</p></div></body></html>',
        { status: 403, headers: { 'Content-Type': 'text/html' } }
      );
    }
  }

  const token = req.cookies.get('auth-token')?.value;

  // Decode JWT payload without verifying (verification happens in API routes)
  let role: string | null = null;
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      role = payload.role ?? null;
    } catch {}
  }

  const isAuthed = !!token;

  // Redirect logged-in users away from auth pages
  if (isAuthed && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect user routes
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r)) && !isAuthed)
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));

  // Protect admin routes
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'ADMIN' && role !== 'SUB_ADMIN') return NextResponse.redirect(new URL('/', req.url));
  }

  const res = NextResponse.next();

  // Security + load balancing headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-Request-ID', crypto.randomUUID());
  res.headers.set('Cache-Control', 'no-store');

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
