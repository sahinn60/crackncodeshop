import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await prisma.landingPage.findUnique({ where: { slug } });
  if (!page || !page.isPublished) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let product = null;
  if (page.productId) {
    product = await prisma.product.findUnique({
      where: { id: page.productId },
      select: { id: true, title: true, price: true, oldPrice: true, imageUrl: true, rating: true, reviewCount: true, category: true },
    });
  }

  return NextResponse.json({
    ...page,
    sections: JSON.parse(page.sections),
    product,
  });
}
