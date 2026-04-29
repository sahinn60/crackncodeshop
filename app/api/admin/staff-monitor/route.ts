import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const staffUsers = await prisma.user.findMany({
    where: { role: 'SUB_ADMIN' },
    select: { id: true, name: true, email: true, lastLoginAt: true, totalLoginTime: true, credentialKey: true },
  });

  const productCounts = await prisma.product.groupBy({
    by: ['authorId'],
    _count: { id: true },
    where: { authorId: { in: staffUsers.map(s => s.id) } },
  });

  const weeklyCounts = await prisma.product.groupBy({
    by: ['authorId'],
    _count: { id: true },
    where: { authorId: { in: staffUsers.map(s => s.id) }, createdAt: { gte: weekAgo } },
  });

  const totalMap = new Map(productCounts.map(p => [p.authorId, p._count.id]));
  const weeklyMap = new Map(weeklyCounts.map(p => [p.authorId, p._count.id]));

  const staff = staffUsers.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    credentialKey: s.credentialKey,
    lastLoginAt: s.lastLoginAt,
    totalLoginMinutes: s.totalLoginTime,
    totalProducts: totalMap.get(s.id) || 0,
    weeklyProducts: weeklyMap.get(s.id) || 0,
  }));

  return NextResponse.json(staff);
}
