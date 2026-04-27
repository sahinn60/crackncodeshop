import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get('auth-token')?.value;

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

    const isAuthed = !!token;

    // Redirect logged-in users away from auth pages
    if (isAuthed && ['/login', '/register'].some(r => pathname.startsWith(r))) {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protect dashboard
    if (pathname.startsWith('/dashboard') && !isAuthed)
      return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));

    // Protect admin
    if (pathname.startsWith('/admin')) {
      if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url));
      if (role !== 'ADMIN' && role !== 'SUB_ADMIN') return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch {
    // Never crash — just pass through
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
