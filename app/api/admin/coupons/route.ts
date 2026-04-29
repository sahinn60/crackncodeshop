import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'coupons');
  if (error) return error;

  const coupons = await prisma.coupon.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'coupons');
  if (error) return error;

  const body = await req.json();
  if (!body.title?.trim() || !body.code?.trim() || !body.message?.trim())
    return NextResponse.json({ error: 'Title, code, and message are required' }, { status: 400 });

  const existing = await prisma.coupon.findUnique({ where: { code: body.code.trim().toUpperCase() } });
  if (existing) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      title: body.title.trim(),
      code: body.code.trim().toUpperCase(),
      discount: body.discount?.trim() || '',
      message: body.message.trim(),
      isActive: body.isActive ?? true,
      priority: parseInt(body.priority) || 0,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : null,
      emoji: body.emoji || '🔥',
      barColor: body.barColor || '#DC2626',
      textColor: body.textColor || '#FFFFFF',
      showTimer: body.showTimer ?? true,
      speedDesktop: parseInt(body.speedDesktop) || 47,
      speedMobile: parseInt(body.speedMobile) || 70,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
