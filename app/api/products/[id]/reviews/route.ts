import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = getAuthUser(req);

  const reviews = await prisma.review.findMany({
    where: { productId: id, status: 'approved' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Verified purchase check
  const verifiedUserIds = new Set<string>();
  const userIds = [...new Set(reviews.map(r => r.userId))];
  if (userIds.length) {
    const purchases = await prisma.order.findMany({
      where: { status: 'COMPLETED', userId: { in: userIds }, items: { some: { productId: id } } },
      select: { userId: true },
    });
    purchases.forEach(p => verifiedUserIds.add(p.userId));
  }

  const mapped = reviews.map(r => ({
    id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt,
    guestName: r.guestName,
    user: r.user,
    isVerifiedPurchase: !r.guestName && verifiedUserIds.has(r.userId),
  }));

  // User's own pending/rejected review
  let userReview = null;
  if (authUser) {
    const own = await prisma.review.findFirst({
      where: { productId: id, userId: authUser.id, guestName: null },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (own && own.status !== 'approved') {
      userReview = { ...own, isVerifiedPurchase: false };
    }
  }

  return NextResponse.json({ reviews: mapped, userReview });
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

  const existing = await prisma.review.findFirst({
    where: { productId: id, userId: user!.id, guestName: null },
  });
  if (existing)
    return NextResponse.json({ error: 'You already reviewed this product' }, { status: 409 });

  const review = await prisma.review.create({
    data: { productId: id, userId: user!.id, rating: Number(rating), comment: comment.trim(), status: 'pending' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ review, message: 'Your review has been submitted' }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { id } = await params;
  const { rating, comment } = await req.json();

  const existing = await prisma.review.findFirst({
    where: { productId: id, userId: user!.id, guestName: null },
  });
  if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  if (existing.status === 'approved')
    return NextResponse.json({ error: 'Cannot edit an approved review' }, { status: 400 });

  const updated = await prisma.review.update({
    where: { id: existing.id },
    data: {
      rating: rating ? Number(rating) : existing.rating,
      comment: comment?.trim() || existing.comment,
      status: 'pending',
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ review: updated, message: 'Review updated and resubmitted for review' });
}
