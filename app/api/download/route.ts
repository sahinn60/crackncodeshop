import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

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

  // Check user auth
  const user = getAuthUser(req);
  if (!user || user.id !== dl.userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check expiry
  if (new Date() > dl.expiresAt)
    return NextResponse.json({ error: 'Download link expired. Request a new one from your dashboard.' }, { status: 410 });

  // Check download limit
  if (dl.usedCount >= dl.maxUses)
    return NextResponse.json({ error: `Download limit reached (${dl.maxUses} downloads).` }, { status: 429 });

  // Check access — either via order or admin grant
  if (dl.orderItemId) {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: dl.orderItemId },
      include: { order: { select: { status: true } } },
    });
    if (orderItem && orderItem.order.status !== 'COMPLETED')
      return NextResponse.json({ error: 'Order not completed' }, { status: 403 });
  } else {
    // Admin-granted access — verify it still exists
    const access = await prisma.userProductAccess.findUnique({
      where: { userId_productId: { userId: dl.userId, productId: dl.productId } },
    });
    if (!access) return NextResponse.json({ error: 'Access revoked' }, { status: 403 });
  }

  // Check file URL
  if (!dl.product.fileUrl)
    return NextResponse.json({ error: 'File not available.' }, { status: 404 });

  // Increment download count
  await prisma.downloadToken.update({ where: { id: dl.id }, data: { usedCount: { increment: 1 } } });
  if (dl.orderItemId) {
    await prisma.orderItem.update({ where: { id: dl.orderItemId }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
  }

  const fileUrl = dl.product.fileUrl.includes('?')
    ? `${dl.product.fileUrl}&dl=${Date.now()}`
    : `${dl.product.fileUrl}?dl=${Date.now()}`;

  return NextResponse.redirect(fileUrl, { status: 302 });
}
