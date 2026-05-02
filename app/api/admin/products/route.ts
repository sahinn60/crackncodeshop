import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || ''; // published | draft
  const author = searchParams.get('author') || '';
  const sort = searchParams.get('sort') || 'order';

  const where: any = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && { category }),
    ...(status === 'published' && { isPublished: true }),
    ...(status === 'draft' && { isPublished: false }),
    ...(author && { authorId: author }),
  };

  const orderByMap: Record<string, any> = {
    'order': { displayOrder: 'asc' },
    'newest': { createdAt: 'desc' },
    'oldest': { createdAt: 'asc' },
    'price-high': { price: 'desc' },
    'price-low': { price: 'asc' },
    'popular': { reviewCount: 'desc' },
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: orderByMap[sort] || { displayOrder: 'asc' },
  });

  return NextResponse.json({ products, total: products.length });
}
