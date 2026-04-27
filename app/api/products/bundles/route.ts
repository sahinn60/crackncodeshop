import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '16'));

  const where = {
    isBundle: true,
    isPublished: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit) }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
