import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isTopSelling: true, isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    take: 8,
    omit: { fileUrl: true },
  });
  return NextResponse.json(products, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
