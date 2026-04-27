import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Get upsell rules for this product
    const rules = await prisma.upsellRule.findMany({
      where: { sourceProductId: id, isActive: true },
      orderBy: { priority: 'desc' },
    });

    const rulesByType: Record<string, string[]> = {};
    for (const r of rules) {
      if (!rulesByType[r.type]) rulesByType[r.type] = [];
      rulesByType[r.type].push(r.targetProductId);
    }

    // Fetch all target products at once
    const allTargetIds = rules.map(r => r.targetProductId);
    const targetProducts = allTargetIds.length
      ? await prisma.product.findMany({ where: { id: { in: allTargetIds }, isPublished: true } })
      : [];
    const targetMap = new Map(targetProducts.map(p => [p.id, p]));

    // Build typed results from rules
    const related = (rulesByType['RELATED'] || []).map(tid => targetMap.get(tid)).filter(Boolean);
    const frequentlyBought = (rulesByType['FREQUENTLY_BOUGHT'] || []).map(tid => targetMap.get(tid)).filter(Boolean);
    const upgrades = (rulesByType['UPGRADE'] || []).map(tid => targetMap.get(tid)).filter(Boolean);

    // Category-based fallback for "you may also like"
    const excludeIds = [id, ...allTargetIds];
    const categoryProducts = await prisma.product.findMany({
      where: { category: product.category, id: { notIn: excludeIds }, isPublished: true },
      take: 8,
      orderBy: { rating: 'desc' },
    });

    // Merge related: rule-based first, then category fallback
    const youMayAlsoLike = [
      ...related,
      ...categoryProducts.filter(p => !related.some((r: any) => r.id === p.id)),
    ].slice(0, 8);

    // Bundles containing this product
    const bundleItems = await prisma.bundleItem.findMany({
      where: { productId: id },
      include: {
        bundle: {
          include: { items: { include: { product: true } } },
        },
      },
    });
    const bundles = bundleItems
      .map(bi => bi.bundle)
      .filter(b => b.isActive)
      .map(b => ({
        ...b,
        products: b.items.map(i => i.product),
        originalPrice: b.items.reduce((s, i) => s + i.product.price, 0),
        bundlePrice: b.items.reduce((s, i) => s + i.product.price, 0) * (1 - b.discount / 100),
      }));

    return NextResponse.json({
      youMayAlsoLike: youMayAlsoLike.map(formatProduct),
      frequentlyBought: frequentlyBought.map(formatProduct),
      upgrades: upgrades.map(formatProduct),
      bundles,
    });
  } catch (e) {
    console.error('Related products error:', e);
    return NextResponse.json({ youMayAlsoLike: [], frequentlyBought: [], upgrades: [], bundles: [] });
  }
}

function formatProduct(p: any) {
  return {
    ...p,
    features: (() => { try { return JSON.parse(p.features); } catch { return []; } })(),
  };
}
