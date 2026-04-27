import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  const { name, description, imageUrl, discount, isActive, isDailyTimer, productIds } = await req.json();

  const data: any = {};
  if (name !== undefined) { data.name = name; data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  if (description !== undefined) data.description = description;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (discount !== undefined) data.discount = parseFloat(discount) || 0;
  if (isActive !== undefined) data.isActive = isActive;
  if (isDailyTimer !== undefined) data.isDailyTimer = Boolean(isDailyTimer);

  const bundle = await prisma.bundle.update({ where: { id }, data });

  // Replace product list if provided
  if (Array.isArray(productIds)) {
    await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
    await prisma.bundleItem.createMany({ data: productIds.map((pid: string) => ({ bundleId: id, productId: pid })) });
  }

  const updated = await prisma.bundle.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { id: true, title: true, price: true, imageUrl: true } } } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  await prisma.bundle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
