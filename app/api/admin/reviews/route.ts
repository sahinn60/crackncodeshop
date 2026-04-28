import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const status = req.nextUrl.searchParams.get('status');
  const where = status && status !== 'all' ? { status } : {};

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      product: { select: { id: true, title: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reviews);
}

// Bulk import reviews from JSON
export async function POST(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { reviews, productId } = await req.json();

  if (!Array.isArray(reviews) || !reviews.length)
    return NextResponse.json({ error: 'reviews array is required' }, { status: 400 });
  if (!productId)
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  let imported = 0;
  for (const r of reviews) {
    const name = String(r.name || r.reviewer || 'Anonymous').trim();
    const rating = Math.min(5, Math.max(1, parseInt(r.rating) || 5));
    const comment = String(r.comment || r.review || r.text || '').trim();
    if (!comment) continue;

    const createdAt = r.date ? new Date(r.date) : new Date();

    await prisma.review.create({
      data: {
        productId,
        userId: user!.id,
        guestName: name,
        rating,
        comment,
        status: 'approved',
        createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
      },
    });
    imported++;
  }

  // Recalculate product rating
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'approved' },
    _avg: { rating: true }, _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  });

  return NextResponse.json({ imported, total: agg._count }, { status: 201 });
}
