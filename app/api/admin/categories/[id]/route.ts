import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'categories');
  if (error) return error;

  const { id } = await params;
  const { name, imageUrl, parentId } = await req.json();

  try {
    const slug = name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness (exclude self)
    if (slug) {
      const existing = await prisma.category.findFirst({ where: { slug, id: { not: id } } });
      if (existing) {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim(), slug }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
      include: { children: true },
    });
    return NextResponse.json(category);
  } catch (e) {
    console.error('Update category error:', e);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminOrSubAdmin(req, 'categories');
  if (error) return error;

  const { id } = await params;

  try {
    // Move children to root before deleting
    await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete category error:', e);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
