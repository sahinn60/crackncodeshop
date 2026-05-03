import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { orderItemId, productId } = await req.json();

    // Route 1: Download via purchase (orderItemId)
    if (orderItemId) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { userId: true, status: true } },
          product: { select: { id: true, title: true, downloadLimit: true, fileUrl: true } },
        },
      });

      if (!orderItem) return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
      if (orderItem.order.userId !== user!.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      if (orderItem.order.status !== 'COMPLETED') return NextResponse.json({ error: 'Order not completed' }, { status: 403 });
      if (!orderItem.product.fileUrl) return NextResponse.json({ error: 'File not available yet' }, { status: 404 });

      // Track download count
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { downloadCount: { increment: 1 } },
      }).catch(() => {});

      return NextResponse.json({ downloadUrl: orderItem.product.fileUrl });
    }

    // Route 2: Download via admin-granted access (productId)
    if (productId) {
      const access = await prisma.userProductAccess.findUnique({
        where: { userId_productId: { userId: user!.id, productId } },
      });

      if (!access) {
        // Also check if user has a completed order for this product
        const orderItem = await prisma.orderItem.findFirst({
          where: { productId, order: { userId: user!.id, status: 'COMPLETED' } },
          include: { product: { select: { fileUrl: true } } },
        });
        if (!orderItem || !orderItem.product.fileUrl)
          return NextResponse.json({ error: 'No access to this product' }, { status: 403 });

        return NextResponse.json({ downloadUrl: orderItem.product.fileUrl });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { fileUrl: true },
      });

      if (!product || !product.fileUrl) return NextResponse.json({ error: 'File not available' }, { status: 404 });

      return NextResponse.json({ downloadUrl: product.fileUrl });
    }

    return NextResponse.json({ error: 'orderItemId or productId required' }, { status: 400 });
  } catch (err: any) {
    console.error('[download/generate] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
  }
}
