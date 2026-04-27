import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('auth-token')?.value;

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

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
