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

  const fileUrl = dl.product.fileUrl;

  // For Cloudinary URLs: add fl_attachment to force download
  if (fileUrl.includes('cloudinary.com')) {
    const attachmentUrl = fileUrl.includes('/upload/')
      ? fileUrl.replace('/upload/', '/upload/fl_attachment/')
      : fileUrl;
    // Extract filename from URL or use product title
    const ext = fileUrl.split('.').pop()?.split('?')[0] || 'file';
    const safeName = dl.product.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const fileName = `${safeName}.${ext}`;

    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: attachmentUrl,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // For non-Cloudinary URLs (Google Drive, etc): proxy or redirect
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: fileUrl,
      'Cache-Control': 'no-store',
    },
  });
}
