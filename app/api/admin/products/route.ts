import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') || '';
  const author = searchParams.get('author') || '';
  const sort = searchParams.get('sort') || 'newest';

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(author && { authorId: author }),
  };

  const orderByMap: Record<string, any> = {
    'newest': { createdAt: 'desc' },
    'oldest': { createdAt: 'asc' },
    'price-high': { price: 'desc' },
    'price-low': { price: 'asc' },
    'popular': { reviewCount: 'desc' },
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: orderByMap[sort] || { createdAt: 'desc' },
  });

  return NextResponse.json(products);
}
