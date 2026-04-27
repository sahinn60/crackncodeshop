import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const pages = await prisma.landingPage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(pages.map((p: any) => ({ ...p, sections: JSON.parse(p.sections) })));
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const body = await req.json();
  const { title, slug, productId, sections = [], isPublished = false } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
  }

  const existing = await prisma.landingPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
  }

  const page = await prisma.landingPage.create({
    data: {
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      productId: productId || null,
      sections: JSON.stringify(sections),
      isPublished,
    },
  });

  return NextResponse.json({ ...page, sections: JSON.parse(page.sections) }, { status: 201 });
}
