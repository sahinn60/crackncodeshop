import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { orderItemId, productId } = await req.json();
    const origin = req.headers.get('origin') || req.nextUrl.origin;

    let fileUrl = '';

    // Route 1: Download via purchase (orderItemId)
    if (orderItemId) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { userId: true, status: true } },
          product: { select: { id: true, title: true, fileUrl: true } },
        },
      });

      if (!orderItem) return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
      if (orderItem.order.userId !== user!.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      if (orderItem.order.status !== 'COMPLETED') return NextResponse.json({ error: 'Order not completed' }, { status: 403 });
      if (!orderItem.product.fileUrl) return NextResponse.json({ error: 'File not available yet' }, { status: 404 });

      fileUrl = orderItem.product.fileUrl;

      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { downloadCount: { increment: 1 } },
      }).catch(() => {});
    }

    // Route 2: Download via admin-granted access or productId fallback
    else if (productId) {
      // Check admin-granted access
      const access = await prisma.userProductAccess.findUnique({
        where: { userId_productId: { userId: user!.id, productId } },
      });

      if (!access) {
        // Fallback: check if user has a completed order
        const orderItem = await prisma.orderItem.findFirst({
          where: { productId, order: { userId: user!.id, status: 'COMPLETED' } },
          include: { product: { select: { fileUrl: true } } },
        });
        if (!orderItem?.product.fileUrl)
          return NextResponse.json({ error: 'No access to this product' }, { status: 403 });
        fileUrl = orderItem.product.fileUrl;
      } else {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { fileUrl: true },
        });
        if (!product?.fileUrl) return NextResponse.json({ error: 'File not available' }, { status: 404 });
        fileUrl = product.fileUrl;
      }
    } else {
      return NextResponse.json({ error: 'orderItemId or productId required' }, { status: 400 });
    }

    // If it's a local file URL (uploaded via /api/upload/file), return as-is
    if (fileUrl.includes('/api/download/file/')) {
      return NextResponse.json({ downloadUrl: fileUrl });
    }

    // For external URLs (Cloudinary, Google Drive, etc), proxy through our server
    // Extract filename from URL
    const filename = fileUrl.split('/').pop()?.split('?')[0] || 'file';
    return NextResponse.json({
      downloadUrl: `${origin}/api/download/proxy?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(filename)}`,
    });
  } catch (err: any) {
    console.error('[download/generate] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
  }
}
