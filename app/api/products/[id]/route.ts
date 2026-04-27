import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Strip fileUrl from public response — downloads go through /api/download
  const { fileUrl, ...publicProduct } = product;
  return NextResponse.json({
    ...publicProduct,
    features: (() => { try { return JSON.parse(product.features); } catch { return []; } })(),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: String(data.title).trim() }),
        ...(data.description !== undefined && { description: String(data.description).trim() }),
        ...(data.longDescription !== undefined && { longDescription: String(data.longDescription).trim() }),
        ...(data.price !== undefined && { price: parseFloat(data.price) }),
        ...(data.oldPrice !== undefined && { oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : null }),
        ...(data.imageUrl !== undefined && { imageUrl: String(data.imageUrl).trim() }),
        ...(data.category !== undefined && { category: String(data.category).trim() }),
        ...(data.rating !== undefined && { rating: parseFloat(data.rating) || 0 }),
        ...(data.reviewCount !== undefined && { reviewCount: parseInt(data.reviewCount) || 0 }),
        ...(data.features !== undefined && { features: JSON.stringify(Array.isArray(data.features) ? data.features : []) }),
        ...(data.format !== undefined && { format: String(data.format).trim() }),
        ...(data.lastUpdated !== undefined && { lastUpdated: String(data.lastUpdated) }),
        ...(data.isTopSelling !== undefined && { isTopSelling: Boolean(data.isTopSelling) }),
        ...(data.isBundle !== undefined && { isBundle: Boolean(data.isBundle) }),
        ...(data.isPublished !== undefined && { isPublished: Boolean(data.isPublished) }),
        ...(data.youtubeUrl !== undefined && { youtubeUrl: String(data.youtubeUrl || '').trim() }),
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    console.error('Update product error:', e);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.downloadToken.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    // Delete order items referencing this product (and their download tokens)
    const orderItems = await prisma.orderItem.findMany({ where: { productId: id }, select: { id: true } });
    if (orderItems.length) {
      const itemIds = orderItems.map(i => i.id);
      await prisma.downloadToken.deleteMany({ where: { orderItemId: { in: itemIds } } });
      await prisma.orderItem.deleteMany({ where: { productId: id } });
    }
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete product error:', e);
    return NextResponse.json({ error: 'Product not found or cannot be deleted' }, { status: 404 });
  }
}
