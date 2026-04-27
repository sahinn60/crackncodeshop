import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const [orders, grantedAccess] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user!.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userProductAccess.findMany({
      where: { userId: user!.id },
      include: { product: { select: { id: true, title: true, imageUrl: true, category: true, price: true, fileUrl: true } } },
    }),
  ]);

  return NextResponse.json({
    orders,
    grantedProducts: grantedAccess.map(a => ({
      id: a.productId,
      title: a.product.title,
      imageUrl: a.product.imageUrl,
      category: a.product.category,
      price: a.product.price,
      hasFile: !!a.product.fileUrl,
      grantedAt: a.grantedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const body = await req.json();
  const { productIds } = body;

  if (!Array.isArray(productIds) || productIds.length === 0)
    return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });

  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length === 0)
    return NextResponse.json({ error: 'No valid products found' }, { status: 404 });

  const total = products.reduce((sum, p) => sum + p.price, 0);

  const order = await prisma.order.create({
    data: {
      userId: user!.id,
      total,
      items: { create: products.map(p => ({ productId: p.id, price: p.price })) },
    },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(order, { status: 201 });
}
