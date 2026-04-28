import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin, requireAdmin } from '@/lib/auth';
import { isProtectedUser } from '@/lib/protected';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'ADMIN' || isProtectedUser(target.email))
    return NextResponse.json({ error: 'This user is protected and cannot be deleted' }, { status: 403 });

  await prisma.order.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
