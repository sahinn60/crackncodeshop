import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  try {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.cookies.get('auth-token')?.value;

    // Parse JWT payload without verifying expiry
    let role: string | null = null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          role = payload.role ?? null;
        }
      } catch {}
    }

    const hasToken = !!token && !!role;

    // Redirect logged-in users away from auth pages
    if (hasToken && ['/login', '/register'].some(r => pathname.startsWith(r))) {
      if (role === 'ADMIN' || role === 'SUB_ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protect dashboard — only redirect if NO token at all
    if (pathname.startsWith('/dashboard') && !hasToken) {
      return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
    }

    // Protect admin — only redirect if NO token or wrong role
    if (pathname.startsWith('/admin')) {
      if (!hasToken) return NextResponse.redirect(new URL('/login', req.url));
      if (role !== 'ADMIN' && role !== 'SUB_ADMIN') return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
