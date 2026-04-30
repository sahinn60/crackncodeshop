import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let cache: { count: number; ts: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.ts < 5 * 60 * 1000) {
    return NextResponse.json({ count: cache.count });
  }

  const count = await prisma.user.count({ where: { role: 'USER' } });
  cache = { count, ts: Date.now() };

  return NextResponse.json({ count });
}
