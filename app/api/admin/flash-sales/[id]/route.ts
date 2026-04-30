import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  const { title, discountPercentage, isDaily, startTime, endTime, isActive, productIds, animation, animationSpeed } = await req.json();

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (discountPercentage !== undefined) data.discountPercentage = parseFloat(discountPercentage) || 0;
  if (isDaily !== undefined) data.isDaily = Boolean(isDaily);
  if (startTime !== undefined) data.startTime = startTime ? new Date(startTime) : null;
  if (endTime !== undefined) data.endTime = endTime ? new Date(endTime) : null;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (animation !== undefined) data.animation = animation;
  if (animationSpeed !== undefined) data.animationSpeed = animationSpeed;

  await prisma.flashSale.update({ where: { id }, data });

  if (Array.isArray(productIds)) {
    await prisma.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
    await prisma.flashSaleItem.createMany({ data: productIds.map((pid: string) => ({ flashSaleId: id, productId: pid })) });
  }

  const updated = await prisma.flashSale.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { id: true, title: true, price: true, imageUrl: true } } } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;
  const { id } = await params;
  await prisma.flashSale.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
