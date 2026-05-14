import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  // Cancel all PENDING orders older than 1 hour (they will never complete)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.order.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: oneHourAgo },
    },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({
    message: `Cleaned up ${result.count} stale PENDING orders (marked as CANCELLED)`,
    count: result.count,
  });
}
