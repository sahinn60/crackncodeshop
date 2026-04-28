import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';
import { isProtectedUser } from '@/lib/protected';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'users');
  if (error) return error;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(users.map(u => ({ ...u, protected: u.role === 'ADMIN' || isProtectedUser(u.email) })));
}
