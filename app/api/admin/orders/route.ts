import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req, 'orders');
  if (error) return error;

  const isStaff = user!.role === 'SUB_ADMIN';
  const where = isStaff ? { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } : {};

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, title: true, price: true, imageUrl: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}
