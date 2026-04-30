import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBDStartOfDay, getBDEndOfDay } from '@/lib/bdTime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sales = await prisma.flashSale.findMany({
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

  const now = new Date();
  const bdDayStart = getBDStartOfDay();
  const bdDayEnd = getBDEndOfDay();

  const result = sales
    .map(sale => {
      const publishedProducts = sale.items
        .filter(i => i.product.isPublished)
        .map(i => {
          const { isPublished, ...prod } = i.product;
          return prod;
        });

      if (publishedProducts.length === 0) return null;

      let computedStart: string;
      let computedEnd: string;

      if (sale.isDaily) {
        computedStart = bdDayStart;
        computedEnd = bdDayEnd;
      } else {
        // Custom timer — check if currently within window
        if (!sale.startTime || !sale.endTime) return null;
        if (now < sale.startTime || now > sale.endTime) return null;
        computedStart = sale.startTime.toISOString();
        computedEnd = sale.endTime.toISOString();
      }

      return {
        id: sale.id,
        title: sale.title,
        discountPercentage: sale.discountPercentage,
        isDaily: sale.isDaily,
        startTime: computedStart,
        endTime: computedEnd,
        animation: sale.animation,
        animationSpeed: sale.animationSpeed,
        products: publishedProducts.map(p => ({
          ...p,
          salePrice: p.price * (1 - sale.discountPercentage / 100),
        })),
      };
    })
    .filter(Boolean);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
