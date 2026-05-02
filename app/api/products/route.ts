import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAdminOrSubAdmin, getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const maxPriceParam = searchParams.get('maxPrice');
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
    ...(maxPriceParam && { price: { lte: parseFloat(maxPriceParam) } }),
  };

  const orderByMap: Record<string, any> = {
    'price-asc': { price: 'asc' },
    'price-desc': { price: 'desc' },
    'rating': { rating: 'desc' },
    'newest': { createdAt: 'desc' },
  };
  const orderBy = orderByMap[sort] || [{ displayOrder: 'asc' }, { createdAt: 'desc' }];

  // Build a "base" where without maxPrice filter for getting the true max price
  const baseWhere = {
    isPublished: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && category !== 'All' && { category }),
  };

  const [products, total, priceAgg] = await Promise.all([
    prisma.product.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy,
      omit: { fileUrl: true },
    }),
    prisma.product.count({ where }),
    prisma.product.aggregate({ where: baseWhere, _max: { price: true } }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit), maxPrice: priceAgg._max.price || 0 }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  try {
    const data = await req.json();
    if (!data.title || !data.price)
      return NextResponse.json({ error: 'title and price are required' }, { status: 400 });

    const price = parseFloat(data.price);
    const oldPrice = data.oldPrice ? parseFloat(data.oldPrice) : null;
    const rating = Math.min(5, Math.max(0, parseFloat(data.rating) || 0));
    const reviewCount = Math.min(999999, Math.max(0, parseInt(data.reviewCount) || 0));

    if (isNaN(price) || price < 0 || price > 9999999)
      return NextResponse.json({ error: 'Price must be between 0 and 9,999,999' }, { status: 400 });
    if (oldPrice !== null && (isNaN(oldPrice) || oldPrice < 0 || oldPrice > 9999999))
      return NextResponse.json({ error: 'Old price must be between 0 and 9,999,999' }, { status: 400 });

    // Generate slug from title
    const baseSlug = String(data.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100);
    const existing = await prisma.product.findFirst({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    // Get author info
    const author = await prisma.user.findUnique({ where: { id: user!.id }, select: { id: true, name: true } });

    const product = await prisma.product.create({
      data: {
        title: String(data.title).trim().slice(0, 200),
        description: String(data.description || '').trim().slice(0, 1000),
        longDescription: String(data.longDescription || '').trim().slice(0, 10000),
        price,
        oldPrice,
        imageUrl: String(data.imageUrl || '').trim().slice(0, 500),
        category: String(data.category || '').trim().slice(0, 100),
        rating,
        reviewCount,
        features: JSON.stringify(Array.isArray(data.features) ? data.features.slice(0, 50) : []),
        lastUpdated: data.lastUpdated || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        format: String(data.format || '').trim().slice(0, 50),
        isTopSelling: data.isTopSelling ?? false,
        isBundle: data.isBundle ?? false,
        isPublished: data.isPublished ?? true,
        youtubeUrl: String(data.youtubeUrl || '').trim().slice(0, 500),
        fileUrl: String(data.fileUrl || '').trim().slice(0, 500),
        slug,
        authorId: user!.id,
        authorName: author?.name || 'Unknown',
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error('[products/POST] Error:', err?.message);
    return NextResponse.json({ error: err?.message || 'Failed to create product' }, { status: 500 });
  }
}
