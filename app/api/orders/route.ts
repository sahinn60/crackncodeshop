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

  try {
  const body = await req.json();
  const { productIds } = body;

  if (!Array.isArray(productIds) || productIds.length === 0)
    return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });
  if (productIds.length > 50)
    return NextResponse.json({ error: 'Maximum 50 products per order' }, { status: 400 });

  const products = await prisma.product.findMany({ where: { id: { in: productIds }, isPublished: true } });
  if (products.length === 0)
    return NextResponse.json({ error: 'No valid products found' }, { status: 404 });

  // Apply flash sale discounts server-side
  const now = new Date();
  const activeSales = await prisma.flashSale.findMany({
    where: { isActive: true },
    include: { items: { select: { productId: true } } },
  });
  const flashPriceMap = new Map<string, number>();
  for (const sale of activeSales) {
    let isLive = false;
    if (sale.isDaily) {
      isLive = true;
    } else if (sale.startTime && sale.endTime) {
      isLive = now >= sale.startTime && now <= sale.endTime;
    }
    if (!isLive || sale.discountPercentage <= 0) continue;
    for (const item of sale.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const salePrice = product.price * (1 - sale.discountPercentage / 100);
        const existing = flashPriceMap.get(item.productId);
        if (!existing || salePrice < existing) flashPriceMap.set(item.productId, salePrice);
      }
    }
  }

  const total = products.reduce((sum, p) => sum + (flashPriceMap.get(p.id) ?? p.price), 0);

  const order = await prisma.order.create({
    data: {
      userId: user!.id,
      total,
      items: { create: products.map(p => ({ productId: p.id, price: flashPriceMap.get(p.id) ?? p.price })) },
    },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('[orders/POST] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
