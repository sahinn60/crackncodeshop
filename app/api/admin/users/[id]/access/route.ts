import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET — fetch user's product access (all products + which ones they have access to)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user: admin } = requireAdmin(req);
  if (error) return error;

  const { id } = await params;

  const [products, accessList, orders] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, title: true, imageUrl: true, category: true, price: true },
      orderBy: { title: 'asc' },
    }),
    prisma.userProductAccess.findMany({
      where: { userId: id },
      select: { productId: true, grantedAt: true, grantedBy: true },
    }),
    prisma.order.findMany({
      where: { userId: id, status: 'COMPLETED' },
      select: { items: { select: { productId: true } } },
    }),
  ]);

  const accessIds = new Set(accessList.map(a => a.productId));
  const purchasedIds = new Set(orders.flatMap(o => o.items.map(i => i.productId)));

  return NextResponse.json({
    products: products.map(p => ({
      ...p,
      hasAccess: accessIds.has(p.id),
      purchased: purchasedIds.has(p.id),
    })),
    accessCount: accessIds.size,
    purchasedCount: purchasedIds.size,
  });
}

// POST — update user's product access (replace entire list)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user: admin } = requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  const { productIds } = await req.json();

  if (!Array.isArray(productIds))
    return NextResponse.json({ error: 'productIds must be an array' }, { status: 400 });

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Replace all access: delete existing, create new
  await prisma.$transaction([
    prisma.userProductAccess.deleteMany({ where: { userId: id } }),
    ...productIds.map((productId: string) =>
      prisma.userProductAccess.create({
        data: { userId: id, productId, grantedBy: admin!.id },
      })
    ),
  ]);

  return NextResponse.json({ success: true, count: productIds.length });
}
