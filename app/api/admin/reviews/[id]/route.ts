import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { id } = await params;
  const { status } = await req.json();

  if (!['approved', 'rejected'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const review = await prisma.review.update({
    where: { id },
    data: { status },
  });

  // Recalculate product rating from approved reviews only
  const agg = await prisma.review.aggregate({
    where: { productId: review.productId, status: 'approved' },
    _avg: { rating: true }, _count: true,
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  });

  return NextResponse.json(review);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { id } = await params;
  const review = await prisma.review.delete({ where: { id } });

  // Recalculate product rating
  const agg = await prisma.review.aggregate({
    where: { productId: review.productId, status: 'approved' },
    _avg: { rating: true }, _count: true,
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  });

  return NextResponse.json({ success: true });
}
