import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  const { isActive, priority } = await req.json();

  const data: any = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (priority !== undefined) data.priority = priority;

  const rule = await prisma.upsellRule.update({ where: { id }, data });
  return NextResponse.json(rule);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  await prisma.upsellRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
