import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'categories');
  if (error) return error;

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'categories');
  if (error) return error;

  const { name, imageUrl, parentId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });

  const category = await prisma.category.create({
    data: { name: name.trim(), slug, imageUrl: imageUrl || '', parentId: parentId || null },
    include: { children: true },
  });
  return NextResponse.json(category, { status: 201 });
}
