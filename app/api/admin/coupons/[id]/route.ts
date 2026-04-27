import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'coupons');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  try {
    if (body.code) {
      const existing = await prisma.coupon.findFirst({
        where: { code: body.code.trim().toUpperCase(), id: { not: id } },
      });
      if (existing) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.code && { code: body.code.trim().toUpperCase() }),
        ...(body.discount !== undefined && { discount: body.discount.trim() }),
        ...(body.message && { message: body.message.trim() }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.priority !== undefined && { priority: parseInt(body.priority) || 0 }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      },
    });
    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'coupons');
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}

// Toggle active status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'coupons');
  if (error) return error;

  const { id } = await params;
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to toggle coupon' }, { status: 500 });
  }
}
