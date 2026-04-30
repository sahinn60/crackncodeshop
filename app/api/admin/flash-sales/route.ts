import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  try {
    const sales = await prisma.flashSale.findMany({
      include: { items: { include: { product: { select: { id: true, title: true, price: true, imageUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(sales);
  } catch (e: any) {
    console.error('Flash sale GET error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch flash sales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { title, discountPercentage, isDaily, startTime, endTime, productIds, animation, animationSpeed } = await req.json();
  if (!title || !Array.isArray(productIds) || productIds.length < 1)
    return NextResponse.json({ error: 'Title and at least 1 product required' }, { status: 400 });

  try {
    const sale = await prisma.flashSale.create({
      data: {
        title,
        discountPercentage: parseFloat(discountPercentage) || 0,
        isDaily: Boolean(isDaily),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        animation: animation || 'fade',
        animationSpeed: animationSpeed || 'normal',
        items: { create: productIds.map((pid: string) => ({ productId: pid })) },
      },
      include: { items: { include: { product: { select: { id: true, title: true, price: true, imageUrl: true } } } } },
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (e: any) {
    console.error('Create flash sale error:', e);
    return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
  }
}
