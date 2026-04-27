import { NextRequest, NextResponse } from 'next/server';
import { trackVisitor } from '@/lib/visitors';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || '';

    const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop';
    const browser = parseBrowser(ua);

    trackVisitor({
      ip,
      country: body.country || '',
      device,
      browser,
      currentPage: body.currentPage || '/',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'Other';
}
