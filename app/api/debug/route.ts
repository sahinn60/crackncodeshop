import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const info: Record<string, any> = {
    status: 'running',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: `${Math.round(process.uptime())}s`,
    memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      PORT: process.env.PORT || 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.slice(0, 20) + '...)' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      EPS_USERNAME: process.env.EPS_USERNAME ? 'SET' : 'NOT SET',
    },
  };

  try {
    const { prisma } = await import('@/lib/prisma');
    const count = await prisma.user.count();
    info.database = { status: 'connected', userCount: count };
  } catch (err: any) {
    info.database = { status: 'FAILED', error: err.message };
  }

  return NextResponse.json(info, { headers: { 'Cache-Control': 'no-store' } });
}
