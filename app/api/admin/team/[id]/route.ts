import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  const { id } = await params;

  try {
    const { permissions, name } = await req.json();
    const data: any = {};
    if (permissions) data.permissions = JSON.stringify(permissions);
    if (name) data.name = name.trim();

    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({
      ...user,
      permissions: (() => { try { return JSON.parse(user.permissions); } catch { return []; } })(),
    });
  } catch (e) {
    console.error('Update team member error:', e);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  const { id } = await params;

  try {
    // Cascade delete all related records
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
    await prisma.review.deleteMany({ where: { userId: id } });
    await prisma.downloadToken.deleteMany({ where: { userId: id } });

    // Delete order items' download tokens, then order items, then orders
    const orders = await prisma.order.findMany({ where: { userId: id }, select: { id: true } });
    if (orders.length) {
      const orderIds = orders.map(o => o.id);
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
      if (orderItems.length) {
        await prisma.downloadToken.deleteMany({ where: { orderItemId: { in: orderItems.map(i => i.id) } } });
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      await prisma.order.deleteMany({ where: { userId: id } });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete team member error:', e);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}

// PUT = reset credentials
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  const { id } = await params;

  try {
    const newPassword = crypto.randomBytes(8).toString('base64url');
    const newKey = 'SA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({ where: { id }, data: { password: hashed, credentialKey: newKey } });
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    return NextResponse.json({ credentialKey: newKey, generatedPassword: newPassword });
  } catch (e) {
    console.error('Reset credentials error:', e);
    return NextResponse.json({ error: 'Failed to reset credentials' }, { status: 500 });
  }
}
