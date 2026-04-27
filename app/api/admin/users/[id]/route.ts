import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin, requireAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  const { role } = await req.json();
  const user = await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  await prisma.order.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
