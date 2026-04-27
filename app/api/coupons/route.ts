import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let cache: { data: any; expiresAt: number } | null = null;

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  cache = { data: coupons, expiresAt: Date.now() + 30_000 };
  return NextResponse.json(coupons);
}
