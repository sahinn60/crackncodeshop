import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function classifyUrl(url: string): 'local' | 'external' {
  // Local server files
  if (url.includes('/api/download/file/') || url.includes('/api/upload/')) return 'local';
  // Everything else (Google Drive, Dropbox, Cloudinary, any URL)
  return 'external';
}

function fixExternalUrl(url: string): string {
  // Fix Google Drive view links → direct download
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;

  // Fix Dropbox links
  if (url.includes('dropbox.com') && !url.includes('dl=1')) {
    return url.replace('dl=0', 'dl=1').replace(/\?$/, '') + (url.includes('?') ? '&dl=1' : '?dl=1');
  }

  return url;
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { orderItemId, productId } = await req.json();

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

    // Route 2: Download via admin-granted access or purchase fallback
    else if (productId) {
      const access = await prisma.userProductAccess.findUnique({
        where: { userId_productId: { userId: user!.id, productId } },
      });

      if (!access) {
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

    const type = classifyUrl(fileUrl);

    if (type === 'local') {
      // Local server file — return direct URL
      return NextResponse.json({ downloadUrl: fileUrl, type: 'download' });
    }

    // External URL — fix common link formats and tell frontend to open in new tab
    const fixedUrl = fixExternalUrl(fileUrl);
    return NextResponse.json({ downloadUrl: fixedUrl, type: 'external' });

  } catch (err: any) {
    console.error('[download/generate] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
  }
}
