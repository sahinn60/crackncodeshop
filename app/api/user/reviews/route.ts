import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const reviews = await prisma.review.findMany({
    where: { userId: user!.id },
    include: { product: { select: { id: true, title: true, imageUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reviews);
}
