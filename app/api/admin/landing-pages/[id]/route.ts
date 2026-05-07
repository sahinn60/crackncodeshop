import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { id } = await params;
  const page = await prisma.landingPage.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ...page, sections: JSON.parse(page.sections) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (body.productId !== undefined) data.productId = body.productId || null;
  if (body.sections !== undefined) data.sections = JSON.stringify(body.sections);
  if (body.isPublished !== undefined) data.isPublished = body.isPublished;

  if (data.slug) {
    const existing = await prisma.landingPage.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
  }

  const page = await prisma.landingPage.update({ where: { id }, data });
  return NextResponse.json({ ...page, sections: JSON.parse(page.sections) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const { id } = await params;
  await prisma.landingPage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
