import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { productIds } = await req.json();
  if (!Array.isArray(productIds) || !productIds.length)
    return NextResponse.json({ offers: [] });

  try {
    // 1. Get POST_PURCHASE upsell rules for purchased products
    const rules = await prisma.upsellRule.findMany({
      where: { sourceProductId: { in: productIds }, type: 'POST_PURCHASE', isActive: true },
      orderBy: { priority: 'desc' },
    });

    const targetIds = [...new Set(rules.map(r => r.targetProductId))].filter(id => !productIds.includes(id));

    // 2. Get user's already-purchased products to exclude
    const user = getAuthUser(req);
    let ownedIds: string[] = [];
    if (user) {
      const orders = await prisma.order.findMany({
        where: { userId: user.id, status: 'COMPLETED' },
        include: { items: { select: { productId: true } } },
      });
      ownedIds = orders.flatMap(o => o.items.map(i => i.productId));
    }

    const excludeIds = [...productIds, ...ownedIds];

    // 3. Fetch rule-based targets
    let offers = targetIds.length
      ? await prisma.product.findMany({ where: { id: { in: targetIds.filter(id => !excludeIds.includes(id)) }, isPublished: true } })
      : [];

    // 4. Fallback: category-based recommendations
    if (offers.length < 3) {
      const purchased = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { category: true } });
      const categories = [...new Set(purchased.map(p => p.category))];
      const fallback = await prisma.product.findMany({
        where: { category: { in: categories }, id: { notIn: [...excludeIds, ...offers.map(o => o.id)] }, isPublished: true },
        take: 3 - offers.length,
        orderBy: { rating: 'desc' },
      });
      offers = [...offers, ...fallback];
    }

    // 5. Bundles containing any purchased product
    const bundleItems = await prisma.bundleItem.findMany({
      where: { productId: { in: productIds } },
      include: { bundle: { include: { items: { include: { product: true } } } } },
    });
    const seenBundles = new Set<string>();
    const bundles = bundleItems
      .map(bi => bi.bundle)
      .filter(b => { if (seenBundles.has(b.id) || !b.isActive) return false; seenBundles.add(b.id); return true; })
      .map(b => ({
        ...b,
        products: b.items.map(i => i.product),
        originalPrice: b.items.reduce((s, i) => s + i.product.price, 0),
        bundlePrice: b.items.reduce((s, i) => s + i.product.price, 0) * (1 - b.discount / 100),
      }));

    return NextResponse.json({
      offers: offers.slice(0, 4).map(p => ({
        ...p,
        features: (() => { try { return JSON.parse(p.features); } catch { return []; } })(),
        postPurchaseDiscount: 15, // 15% off for post-purchase
      })),
      bundles,
    });
  } catch (e) {
    console.error('Post-purchase upsell error:', e);
    return NextResponse.json({ offers: [], bundles: [] });
  }
}
