import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'orders');
  if (error) return error;

  const { id } = await params;
  const { status } = await req.json();
  const order = await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json(order);
}
