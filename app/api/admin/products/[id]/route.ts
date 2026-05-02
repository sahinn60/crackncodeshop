import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  const { displayOrder } = await req.json();
  if (typeof displayOrder !== 'number') return NextResponse.json({ error: 'displayOrder required' }, { status: 400 });
  await prisma.product.update({ where: { id }, data: { displayOrder } });
  return NextResponse.json({ success: true });
}
