import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { product: { select: { id: true, title: true, price: true, imageUrl: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bundles);
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { name, description, imageUrl, discount, isDailyTimer, productIds } = await req.json();
  if (!name || !Array.isArray(productIds) || productIds.length < 2)
    return NextResponse.json({ error: 'Name and at least 2 product IDs required' }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    // Ensure unique slug
    const existing = await prisma.bundle.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const bundle = await prisma.bundle.create({
      data: {
        name, slug: finalSlug, description: description || '', imageUrl: imageUrl || '',
        discount: parseFloat(discount) || 0,
        isDailyTimer: Boolean(isDailyTimer),
        items: { create: productIds.map((pid: string) => ({ productId: pid })) },
      },
      include: { items: { include: { product: { select: { id: true, title: true, price: true, imageUrl: true } } } } },
    });
    return NextResponse.json(bundle, { status: 201 });
  } catch (e: any) {
    console.error('Create bundle error:', e);
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
  }
}
