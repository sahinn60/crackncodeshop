import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await prisma.review.findMany({
    where: { productId: id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { id } = await params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  if (!comment?.trim())
    return NextResponse.json({ error: 'Comment is required' }, { status: 400 });

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: id, userId: user!.id } },
  });
  if (existing)
    return NextResponse.json({ error: 'You already reviewed this product' }, { status: 409 });

  const review = await prisma.review.create({
    data: { productId: id, userId: user!.id, rating: Number(rating), comment: comment.trim() },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Update product rating/reviewCount
  const agg = await prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  });

  return NextResponse.json(review, { status: 201 });
}
