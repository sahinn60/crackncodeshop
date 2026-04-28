import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req);
  if (error) return error;

  const isAdmin = user!.role === 'ADMIN';

  try {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [totalUsers, totalProducts, orders, recentOrders, topProducts, newUsersThisWeek, totalCategories, totalReviews, recentReviews, monthOrders, allProducts, visitors7d] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({ select: { total: true, createdAt: true, status: true } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, items: { include: { product: { select: { title: true } } } } },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { reviewCount: 'desc' },
      select: { title: true, category: true, price: true, reviewCount: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.category.count().catch(() => 0),
    prisma.review.count(),
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, product: { select: { title: true } } },
    }),
    prisma.order.findMany({ where: { createdAt: { gte: monthAgo } }, select: { total: true } }),
    prisma.product.findMany({ select: { category: true, price: true } }),
    prisma.analytics.findMany({ where: { date: { gte: weekAgo.toISOString().slice(0, 10) } }, select: { date: true, ip: true, device: true } }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const salesByDay = Array(7).fill(0);
  orders.forEach(o => {
    const diff = Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / 86400000);
    if (diff < 7) salesByDay[6 - diff] += o.total;
  });

  const chartData = salesByDay.map((sales, i) => ({
    name: days[(new Date().getDay() - 6 + i + 7) % 7],
    sales: Math.round(sales),
  }));

  // Order status breakdown
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en', { month: 'short' });
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    let rev = 0, cnt = 0;
    orders.forEach(o => {
      const t = new Date(o.createdAt);
      if (t >= start && t < end) { rev += o.total; cnt++; }
    });
    monthlyRevenue.push({ month: label, revenue: Math.round(rev), orders: cnt });
  }

  // Daily visitors (last 7 days)
  const visitorsByDay: { day: string; visitors: number; mobile: number; desktop: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleString('en', { weekday: 'short' });
    const dayVisitors = visitors7d.filter(v => v.date === dateStr);
    const uniqueIps = new Set(dayVisitors.map(v => v.ip)).size;
    const mobile = dayVisitors.filter(v => v.device === 'mobile').length;
    const desktop = dayVisitors.filter(v => v.device === 'desktop').length;
    visitorsByDay.push({ day: label, visitors: uniqueIps, mobile, desktop });
  }

  // Category revenue breakdown
  const catRevenue: Record<string, number> = {};
  allProducts.forEach(p => { catRevenue[p.category] = (catRevenue[p.category] || 0) + p.price; });
  const categoryData = Object.entries(catRevenue)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return NextResponse.json({
    totalUsers,
    totalProducts,
    totalOrders: orders.length,
    totalRevenue: isAdmin ? totalRevenue : undefined,
    monthRevenue: isAdmin ? monthRevenue : undefined,
    avgOrderValue: isAdmin ? avgOrderValue : undefined,
    completedOrders,
    newUsersThisWeek,
    totalCategories,
    totalReviews,
    chartData: isAdmin ? chartData : undefined,
    recentOrders,
    topProducts,
    recentReviews,
    orderStatusData,
    monthlyRevenue: isAdmin ? monthlyRevenue : undefined,
    visitorsByDay,
    categoryData: isAdmin ? categoryData : undefined,
  });
  } catch (err: any) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
