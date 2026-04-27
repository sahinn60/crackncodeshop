import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });

  const now = new Date();
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.isActive)
    return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 404 });

  if (coupon.startDate > now)
    return NextResponse.json({ error: 'Coupon is not yet active' }, { status: 400 });

  if (coupon.endDate && coupon.endDate < now)
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });

  // Parse discount: "20%" or "50 BDT"
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
