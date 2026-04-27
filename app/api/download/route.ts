import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Download token required' }, { status: 400 });

  // 1. Validate token exists
  const dl = await prisma.downloadToken.findUnique({
    where: { token },
    include: {
      product: { select: { id: true, title: true, fileUrl: true, downloadLimit: true } },
      orderItem: { include: { order: { select: { status: true } } } },
    },
  });

  if (!dl) return NextResponse.json({ error: 'Invalid download link' }, { status: 404 });

  // 2. Check user auth matches token owner
  const user = getAuthUser(req);
  if (!user || user.id !== dl.userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 3. Check order is completed
  if (dl.orderItem.order.status !== 'COMPLETED')
    return NextResponse.json({ error: 'Order not completed' }, { status: 403 });

  // 4. Check expiry
  if (new Date() > dl.expiresAt)
    return NextResponse.json({ error: 'Download link expired. Request a new one from your dashboard.' }, { status: 410 });

  // 5. Check download limit
  if (dl.usedCount >= dl.maxUses)
    return NextResponse.json({ error: `Download limit reached (${dl.maxUses} downloads). Contact support.` }, { status: 429 });

  // 6. Check file URL exists
  if (!dl.product.fileUrl)
    return NextResponse.json({ error: 'File not available. Contact support.' }, { status: 404 });

  // 7. Increment download count on both token and order item
  await prisma.$transaction([
    prisma.downloadToken.update({ where: { id: dl.id }, data: { usedCount: { increment: 1 } } }),
    prisma.orderItem.update({ where: { id: dl.orderItem.id }, data: { downloadCount: { increment: 1 } } }),
  ]);

  // 8. Redirect to file URL (Cloudinary/S3 signed URL or direct)
  // Add cache-busting to prevent browser caching the redirect
  const fileUrl = dl.product.fileUrl.includes('?')
    ? `${dl.product.fileUrl}&dl=${Date.now()}`
    : `${dl.product.fileUrl}?dl=${Date.now()}`;

  return NextResponse.redirect(fileUrl, { status: 302 });
}
