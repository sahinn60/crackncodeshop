import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { orderItemId } = await req.json();
  if (!orderItemId) return NextResponse.json({ error: 'orderItemId required' }, { status: 400 });

  // 1. Find the order item and verify ownership
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: { select: { userId: true, status: true } },
      product: { select: { id: true, downloadLimit: true, fileUrl: true } },
    },
  });

  if (!orderItem)
    return NextResponse.json({ error: 'Order item not found' }, { status: 404 });

  // 2. Verify user owns this order
  if (orderItem.order.userId !== user!.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // 3. Verify order is completed
  if (orderItem.order.status !== 'COMPLETED')
    return NextResponse.json({ error: 'Order not completed' }, { status: 403 });

  // 4. Check if file exists
  if (!orderItem.product.fileUrl)
    return NextResponse.json({ error: 'File not available yet' }, { status: 404 });

  // 5. Check total downloads across all tokens for this order item
  const totalDownloads = await prisma.downloadToken.aggregate({
    where: { orderItemId },
    _sum: { usedCount: true },
  });

  const limit = orderItem.product.downloadLimit || 5;
  if ((totalDownloads._sum.usedCount || 0) >= limit)
    return NextResponse.json({ error: `Download limit reached (${limit}). Contact support.` }, { status: 429 });

  // 6. Generate secure token with 10-minute expiry
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const dl = await prisma.downloadToken.create({
    data: {
      token,
      userId: user!.id,
      productId: orderItem.product.id,
      orderItemId,
      maxUses: 1, // single-use token
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const downloadUrl = `${baseUrl}/api/download?token=${dl.token}`;

  return NextResponse.json({
    downloadUrl,
    expiresAt: dl.expiresAt,
    remainingDownloads: limit - (totalDownloads._sum.usedCount || 0),
  });
}
