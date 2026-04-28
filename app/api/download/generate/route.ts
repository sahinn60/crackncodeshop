import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { orderItemId, productId } = await req.json();
  const origin = req.headers.get('origin') || req.nextUrl.origin;

  // Route 1: Download via purchase (orderItemId)
  if (orderItemId) {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: { select: { userId: true, status: true } },
        product: { select: { id: true, downloadLimit: true, fileUrl: true } },
      },
    });

    if (!orderItem) return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
    if (orderItem.order.userId !== user!.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (orderItem.order.status !== 'COMPLETED') return NextResponse.json({ error: 'Order not completed' }, { status: 403 });
    if (!orderItem.product.fileUrl) return NextResponse.json({ error: 'File not available yet' }, { status: 404 });

    const totalDownloads = await prisma.downloadToken.aggregate({
      where: { orderItemId },
      _sum: { usedCount: true },
    });

    const limit = orderItem.product.downloadLimit || 5;
    if ((totalDownloads._sum.usedCount || 0) >= limit)
      return NextResponse.json({ error: `Download limit reached (${limit}). Contact support.` }, { status: 429 });

    const token = crypto.randomBytes(32).toString('hex');
    const dl = await prisma.downloadToken.create({
      data: {
        token,
        userId: user!.id,
        productId: orderItem.product.id,
        orderItemId,
        maxUses: 1,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return NextResponse.json({
      downloadUrl: `${origin}/api/download?token=${dl.token}`,
      expiresAt: dl.expiresAt,
      remainingDownloads: limit - (totalDownloads._sum.usedCount || 0),
    });
  }

  // Route 2: Download via admin-granted access (productId)
  if (productId) {
    const access = await prisma.userProductAccess.findUnique({
      where: { userId_productId: { userId: user!.id, productId } },
    });

    if (!access) return NextResponse.json({ error: 'No access to this product' }, { status: 403 });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, fileUrl: true, downloadLimit: true },
    });

    if (!product || !product.fileUrl) return NextResponse.json({ error: 'File not available' }, { status: 404 });

    const totalDownloads = await prisma.downloadToken.aggregate({
      where: { productId, userId: user!.id },
      _sum: { usedCount: true },
    });

    const limit = product.downloadLimit || 5;
    if ((totalDownloads._sum.usedCount || 0) >= limit)
      return NextResponse.json({ error: `Download limit reached (${limit}). Contact support.` }, { status: 429 });

    const existingOrderItem = await prisma.orderItem.findFirst({
      where: { productId, order: { userId: user!.id } },
      select: { id: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const dl = await prisma.downloadToken.create({
      data: {
        token,
        userId: user!.id,
        productId,
        orderItemId: existingOrderItem?.id || '',
        maxUses: 1,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return NextResponse.json({
      downloadUrl: `${origin}/api/download?token=${dl.token}`,
      expiresAt: dl.expiresAt,
      remainingDownloads: limit - (totalDownloads._sum.usedCount || 0),
    });
  }

  return NextResponse.json({ error: 'orderItemId or productId required' }, { status: 400 });
}
