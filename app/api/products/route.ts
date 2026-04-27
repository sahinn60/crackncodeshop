import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '16'));

  const where = {
    isPublished: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && category !== 'All' && { category }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      omit: { fileUrl: true },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit) }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function POST(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const data = await req.json();
  if (!data.title || !data.price || !data.imageUrl || !data.category)
    return NextResponse.json({ error: 'title, price, imageUrl and category are required' }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      title: String(data.title).trim(),
      description: String(data.description || '').trim(),
      longDescription: String(data.longDescription || '').trim(),
      price: parseFloat(data.price),
      oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : null,
      imageUrl: String(data.imageUrl).trim(),
      category: String(data.category).trim(),
      rating: parseFloat(data.rating) || 0,
      reviewCount: parseInt(data.reviewCount) || 0,
      features: JSON.stringify(Array.isArray(data.features) ? data.features : []),
      lastUpdated: data.lastUpdated || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      format: String(data.format || '').trim(),
      isTopSelling: data.isTopSelling ?? false,
      isBundle: data.isBundle ?? false,
      isPublished: data.isPublished ?? true,
      youtubeUrl: String(data.youtubeUrl || '').trim(),
      fileUrl: String(data.fileUrl || '').trim(),
    },
  });
  return NextResponse.json(product, { status: 201 });
}
