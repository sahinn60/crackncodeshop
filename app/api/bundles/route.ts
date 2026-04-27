import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBDEndOfDay } from '@/lib/bdTime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, title: true, description: true, price: true,
              imageUrl: true, rating: true, reviewCount: true, category: true,
              isPublished: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const endTime = getBDEndOfDay();

  const result = bundles
    .map(b => {
      const publishedItems = b.items.filter(i => i.product.isPublished);
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        imageUrl: b.imageUrl,
        discount: b.discount,
        isActive: b.isActive,
        isDailyTimer: b.isDailyTimer,
        endTime: b.isDailyTimer ? endTime : null,
        createdAt: b.createdAt,
        products: publishedItems.map(i => i.product),
        originalPrice: publishedItems.reduce((s, i) => s + i.product.price, 0),
        bundlePrice: publishedItems.reduce((s, i) => s + i.product.price, 0) * (1 - b.discount / 100),
      };
    })
    .filter(b => b.products.length >= 2);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
