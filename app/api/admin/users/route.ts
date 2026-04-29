import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req, 'users');
  if (error) return error;

  const isStaff = user!.role === 'SUB_ADMIN';

  const users = await prisma.user.findMany({
    where: isStaff ? { role: 'USER' } : {},
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}
