import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { items } = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items array required' }, { status: 400 });

  await prisma.$transaction(
    items.map((item: { id: string; displayOrder: number }) =>
      prisma.product.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } })
    )
  );

  return NextResponse.json({ success: true });
}
