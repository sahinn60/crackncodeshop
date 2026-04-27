import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const rules = await prisma.upsellRule.findMany({ orderBy: { createdAt: 'desc' } });

  // Enrich with product titles
  const productIds = [...new Set(rules.flatMap(r => [r.sourceProductId, r.targetProductId]))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, imageUrl: true, price: true },
  });
  const pMap = new Map(products.map(p => [p.id, p]));

  return NextResponse.json(rules.map(r => ({
    ...r,
    sourceProduct: pMap.get(r.sourceProductId) || null,
    targetProduct: pMap.get(r.targetProductId) || null,
  })));
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { sourceProductId, targetProductId, type, priority } = await req.json();
  if (!sourceProductId || !targetProductId || !type)
    return NextResponse.json({ error: 'sourceProductId, targetProductId, and type are required' }, { status: 400 });

  const validTypes = ['RELATED', 'FREQUENTLY_BOUGHT', 'UPGRADE', 'POST_PURCHASE'];
  if (!validTypes.includes(type))
    return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });

  if (sourceProductId === targetProductId)
    return NextResponse.json({ error: 'Source and target must be different products' }, { status: 400 });

  try {
    const rule = await prisma.upsellRule.upsert({
      where: {
        sourceProductId_targetProductId_type: { sourceProductId, targetProductId, type },
      },
      update: { priority: priority || 0, isActive: true },
      create: { sourceProductId, targetProductId, type, priority: priority || 0 },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to create upsell rule' }, { status: 500 });
  }
}
