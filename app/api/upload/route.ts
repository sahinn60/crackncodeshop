import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrSubAdmin } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req);
  if (error) return error;

  const { folder } = await req.json();
  const timestamp = Math.round(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiSecret) {
    // Fallback: if no API secret configured, return unsigned mode indicator
    return NextResponse.json({ mode: 'unsigned' });
  }

  const paramsToSign = `folder=${folder || 'crackncode'}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return NextResponse.json({
    mode: 'signed',
    signature,
    timestamp,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder: folder || 'crackncode',
  });
}
