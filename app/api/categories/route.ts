import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let cache: { data: any; expiresAt: number } | null = null;

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });

  cache = { data: categories, expiresAt: Date.now() + 60_000 };
  return NextResponse.json(categories);
}
