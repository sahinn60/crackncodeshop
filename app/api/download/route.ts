import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function generateCloudinarySignedUrl(fileUrl: string): string {
  const secret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!secret || !apiKey) return fileUrl;

  // Extract public_id and resource info from Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud}/raw/upload/v{version}/{public_id}.{ext}
  const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return fileUrl;

  const publicIdWithExt = match[1];
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxhezbur2';

  // Generate expiring signed URL (valid for 1 hour)
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + 3600;

  const toSign = `public_id=${publicIdWithExt}&timestamp=${timestamp}&type=upload${secret}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  return `https://res.cloudinary.com/${cloudName}/raw/upload?public_id=${encodeURIComponent(publicIdWithExt)}&timestamp=${timestamp}&signature=${signature}&api_key=${apiKey}&expires_at=${expiresAt}`;
}

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

  // Resolve the actual download URL
  let fetchUrl = dl.product.fileUrl;
  if (fetchUrl.includes('cloudinary.com')) {
    fetchUrl = generateCloudinarySignedUrl(fetchUrl);
  }

  try {
    // Proxy the file through the server
    const fileRes = await fetch(fetchUrl);
    if (!fileRes.ok) {
      console.error('[download] Fetch failed:', fileRes.status, await fileRes.text().catch(() => ''));
      return NextResponse.json({ error: 'Failed to fetch file. Please contact support.' }, { status: 502 });
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[download] Proxy error:', err?.message);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
