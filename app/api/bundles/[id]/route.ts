import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBDEndOfDay } from '@/lib/bdTime';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await prisma.bundle.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { items: { include: { product: true } } },
  });
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const publishedItems = bundle.items.filter(i => i.product.isPublished);

  return NextResponse.json({
    id: bundle.id,
    name: bundle.name,
    slug: bundle.slug,
    description: bundle.description,
    imageUrl: bundle.imageUrl,
    discount: bundle.discount,
    isActive: bundle.isActive,
    isDailyTimer: bundle.isDailyTimer,
    endTime: bundle.isDailyTimer ? getBDEndOfDay() : null,
    createdAt: bundle.createdAt,
    products: publishedItems.map(i => i.product),
    originalPrice: publishedItems.reduce((s, i) => s + i.product.price, 0),
    bundlePrice: publishedItems.reduce((s, i) => s + i.product.price, 0) * (1 - bundle.discount / 100),
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
