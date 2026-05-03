import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  try {
    const res = await fetch(`https://ipapi.co/${ip || ''}/json/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return NextResponse.json({ country: '' });
    const data = await res.json();
    return NextResponse.json({ country: data.country_name || '' });
  } catch {
    return NextResponse.json({ country: '' });
  }
}
