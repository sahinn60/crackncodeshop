import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Download token required' }, { status: 400 });

  const dl = await prisma.downloadToken.findUnique({
    where: { token },
    include: {
      product: { select: { id: true, title: true, fileUrl: true, downloadLimit: true } },
    },
  });

  if (!dl) return NextResponse.json({ error: 'Invalid download link' }, { status: 404 });

  if (new Date() > dl.expiresAt)
    return NextResponse.json({ error: 'Download link expired. Request a new one from your dashboard.' }, { status: 410 });

  if (dl.usedCount >= dl.maxUses)
    return NextResponse.json({ error: `Download limit reached (${dl.maxUses} downloads).` }, { status: 429 });

  if (dl.orderItemId) {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: dl.orderItemId },
      include: { order: { select: { status: true } } },
    });
    if (orderItem && orderItem.order.status !== 'COMPLETED')
      return NextResponse.json({ error: 'Order not completed' }, { status: 403 });
  } else {
    const access = await prisma.userProductAccess.findUnique({
      where: { userId_productId: { userId: dl.userId, productId: dl.productId } },
    });
    if (!access) return NextResponse.json({ error: 'Access revoked' }, { status: 403 });
  }

  if (!dl.product.fileUrl)
    return NextResponse.json({ error: 'File not available.' }, { status: 404 });

  // Increment download count
  await prisma.downloadToken.update({ where: { id: dl.id }, data: { usedCount: { increment: 1 } } });
  if (dl.orderItemId) {
    await prisma.orderItem.update({ where: { id: dl.orderItemId }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
  }

  // Build filename
  const ext = dl.product.fileUrl.split('.').pop()?.split('?')[0] || 'file';
  const safeName = dl.product.title.replace(/[^a-zA-Z0-9_\- ]/g, '_').replace(/\s+/g, '_').slice(0, 80);
  const fileName = `${safeName}.${ext}`;

  try {
    // Proxy: fetch file from Cloudinary/external and stream it to the user
    const fileRes = await fetch(dl.product.fileUrl);
    if (!fileRes.ok) return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 502 });

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[download] Proxy error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
