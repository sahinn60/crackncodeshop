import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success: rlOk } = rateLimit(`coupon:${ip}`, 10, 60_000);
  if (!rlOk) return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });

  const { error, user } = requireAuth(req);
  if (error) return error;

  const { code, subtotal } = await req.json();
  if (!code || typeof code !== 'string')
    return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
  if (typeof subtotal !== 'number' || subtotal <= 0)
    return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 });

  const now = new Date();
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.isActive)
    return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 404 });

  if (coupon.startDate > now)
    return NextResponse.json({ error: 'Coupon is not yet active' }, { status: 400 });

  if (coupon.endDate && coupon.endDate < now)
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });

  // Check if user already used this coupon
  const existingUsage = await prisma.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId: user!.id } },
  });
  if (existingUsage)
    return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });

  // Check global max uses
  if (coupon.maxUses > 0) {
    const totalUsages = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (totalUsages >= coupon.maxUses)
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
  }

  // Parse discount
  let discountAmount = 0;
  const disc = coupon.discount.trim();
  if (disc.endsWith('%')) {
    const pct = parseFloat(disc);
    if (!isNaN(pct)) discountAmount = Math.round((subtotal * pct) / 100);
  } else {
    const flat = parseFloat(disc);
    if (!isNaN(flat)) discountAmount = flat;
  }

  discountAmount = Math.min(discountAmount, subtotal);

  if (discountAmount <= 0)
    return NextResponse.json({ error: 'This coupon has no applicable discount' }, { status: 400 });

  return NextResponse.json({
    code: coupon.code,
    discount: coupon.discount,
    discountAmount,
    message: coupon.message,
  });
}
