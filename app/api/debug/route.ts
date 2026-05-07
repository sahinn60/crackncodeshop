import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  return NextResponse.json({
    hasDbUrl: !!dbUrl,
    dbUrlPrefix: dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => !k.startsWith('npm_')).sort(),
  });
}
