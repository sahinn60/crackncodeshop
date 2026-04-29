import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [allProducts, weeklyProducts] = await Promise.all([
    prisma.product.groupBy({
      by: ['authorId', 'authorName'],
      _count: { id: true },
      where: { authorId: { not: '' } },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.product.groupBy({
      by: ['authorId', 'authorName'],
      _count: { id: true },
      where: { authorId: { not: '' }, createdAt: { gte: weekAgo } },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  const weeklyMap = new Map(weeklyProducts.map(w => [w.authorId, w._count.id]));

  const leaderboard = allProducts.map((a, i) => ({
    rank: i + 1,
    authorId: a.authorId,
    authorName: a.authorName || 'Unknown',
    totalProducts: a._count.id,
    weeklyProducts: weeklyMap.get(a.authorId) || 0,
    isCurrentUser: a.authorId === user!.id,
  }));

  const myStats = leaderboard.find(l => l.isCurrentUser) || {
    rank: leaderboard.length + 1,
    authorId: user!.id,
    authorName: 'You',
    totalProducts: 0,
    weeklyProducts: 0,
    isCurrentUser: true,
  };

  return NextResponse.json({ leaderboard, myStats });
}
