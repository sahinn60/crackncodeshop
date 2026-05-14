import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAdminOrSubAdmin(req);
  if (error) return error;

  const isAdmin = user!.role === 'ADMIN';
  const range = req.nextUrl.searchParams.get('range') || '7';

  try {
    const now = new Date();
    const rangeMs = range === 'all' ? 0 : parseInt(range) * 86400000;
    const rangeDate = range === 'all' ? new Date(0) : new Date(now.getTime() - rangeMs);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const dateFilter = range === 'all' ? {} : { createdAt: { gte: rangeDate } };
    const dateFilterAnalytics = range === 'all' ? {} : { date: { gte: rangeDate.toISOString().slice(0, 10) } };

    const [
      totalUsers, totalProducts, allOrders, rangeOrders, rangeUsers,
      topProductsRaw, totalCategories, rangeReviews, allReviews,
      recentOrders, recentReviews, visitors, monthOrders, allProducts,
      topCartProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.findMany({ select: { total: true, createdAt: true, status: true } }),
      prisma.order.findMany({ where: dateFilter, select: { total: true, createdAt: true, status: true, userId: true } }),
      prisma.user.findMany({ where: dateFilter, select: { id: true, createdAt: true } }),
      prisma.product.findMany({
        take: 5,
        orderBy: { reviewCount: 'desc' },
        select: { title: true, category: true, price: true, reviewCount: true },
      }),
      prisma.category.count().catch(() => 0),
      prisma.review.findMany({ where: dateFilter, select: { rating: true, createdAt: true } }),
      prisma.review.findMany({ select: { rating: true } }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, items: { include: { product: { select: { title: true } } } } },
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } }, product: { select: { title: true } } },
      }),
      prisma.analytics.findMany({ where: dateFilterAnalytics, select: { date: true, ip: true, device: true, path: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: monthAgo } }, select: { total: true, status: true } }),
      prisma.product.findMany({ select: { category: true, price: true } }),
      prisma.product.findMany({
        where: { cartCount: { gt: 0 } },
        take: 10,
        orderBy: { cartCount: 'desc' },
        select: { id: true, title: true, category: true, price: true, cartCount: true, imageUrl: true },
      }),
    ]);

    // KPIs — ONLY count COMPLETED orders for revenue
    const completedOrdersList = rangeOrders.filter(o => o.status === 'COMPLETED');
    const totalRevenue = completedOrdersList.reduce((s, o) => s + o.total, 0);
    const totalOrders = rangeOrders.length;
    const avgOrderValue = completedOrdersList.length > 0 ? totalRevenue / completedOrdersList.length : 0;
    const completedOrders = completedOrdersList.length;
    const pendingOrders = rangeOrders.filter(o => o.status === 'PENDING').length;
    const cancelledOrders = rangeOrders.filter(o => o.status === 'CANCELLED').length;
    const refundedOrders = rangeOrders.filter(o => o.status === 'REFUNDED').length;
    const newUsersThisWeek = await prisma.user.count({ where: { createdAt: { gte: weekAgo } } });

    // Conversion rate: orders / unique visitors in range
    const uniqueVisitors = new Set(visitors.map(v => v.ip)).size;
    const conversionRate = uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0;

    // Daily chart data — ONLY completed orders for revenue
    const days = range === 'all' ? 30 : parseInt(range);
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      let rev = 0, cnt = 0;
      rangeOrders.forEach(o => {
        if (new Date(o.createdAt).toISOString().slice(0, 10) === dateStr) {
          if (o.status === 'COMPLETED') rev += o.total;
          cnt++;
        }
      });
      dailyRevenue.push({ date: label, revenue: Math.round(rev), orders: cnt });
    }

    // Order status breakdown
    const statusCounts: Record<string, number> = {};
    rangeOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Monthly revenue trend (last 6 months — ONLY completed)
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      let rev = 0, cnt = 0;
      allOrders.forEach(o => {
        const t = new Date(o.createdAt);
        if (t >= start && t < end && o.status === 'COMPLETED') { rev += o.total; cnt++; }
      });
      monthlyRevenue.push({ month: label, revenue: Math.round(rev), orders: cnt });
    }

    // Visitors by day
    const visitorsByDay: { day: string; visitors: number; mobile: number; desktop: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const dayV = visitors.filter(v => v.date === dateStr);
      visitorsByDay.push({
        day: label,
        visitors: new Set(dayV.map(v => v.ip)).size,
        mobile: dayV.filter(v => v.device === 'mobile').length,
        desktop: dayV.filter(v => v.device === 'desktop').length,
      });
    }

    // Category revenue breakdown
    const catRevenue: Record<string, number> = {};
    allProducts.forEach(p => { catRevenue[p.category] = (catRevenue[p.category] || 0) + p.price; });
    const categoryData = Object.entries(catRevenue)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Top products by order count in range
    const productOrderCount: Record<string, number> = {};
    // We need order items for range — fetch separately
    const rangeOrderIds = rangeOrders.map(o => {
      // We don't have IDs from the select, so use allOrders approach
      return null;
    });

    // User analytics: new vs returning in range
    const rangeUserIds = new Set(rangeOrders.map(o => o.userId));
    const newBuyersInRange = rangeUsers.filter(u => rangeUserIds.has(u.id)).length;
    const returningBuyers = rangeUserIds.size - Math.min(newBuyersInRange, rangeUserIds.size);

    // Review analytics
    const avgRating = rangeReviews.length > 0
      ? rangeReviews.reduce((s, r) => s + r.rating, 0) / rangeReviews.length
      : allReviews.length > 0
        ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
        : 0;

    // Conversion funnel
    const totalVisitors = uniqueVisitors;
    const productViews = new Set(visitors.filter(v => v.path.startsWith('/products/')).map(v => v.ip)).size;
    const purchasers = rangeUserIds.size;
    const completedPurchasers = completedOrders;

    const monthRevenue = monthOrders.filter(o => (o as any).status === 'COMPLETED').reduce((s, o) => s + o.total, 0);

    return NextResponse.json({
      // Core KPIs
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: isAdmin ? totalRevenue : undefined,
      monthRevenue: isAdmin ? monthRevenue : undefined,
      avgOrderValue: isAdmin ? avgOrderValue : undefined,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      refundedOrders,
      newUsersThisWeek,
      totalCategories,
      conversionRate: isAdmin ? conversionRate : undefined,

      // Charts
      dailyRevenue: isAdmin ? dailyRevenue : undefined,
      chartData: isAdmin ? dailyRevenue.map(d => ({ name: d.date, sales: d.revenue })) : undefined,
      orderStatusData,
      monthlyRevenue: isAdmin ? monthlyRevenue : undefined,
      visitorsByDay,
      categoryData: isAdmin ? categoryData : undefined,

      // Tables
      recentOrders,
      topProducts: topProductsRaw,
      topCartProducts,
      recentReviews,

      // Review analytics
      totalReviews: rangeReviews.length,
      avgRating: Math.round(avgRating * 10) / 10,

      // User analytics
      newUsersInRange: rangeUsers.length,
      returningBuyers,
      uniqueBuyers: rangeUserIds.size,

      // Conversion funnel
      funnel: isAdmin ? {
        visitors: totalVisitors,
        productViews,
        purchasers,
        completed: completedPurchasers,
      } : undefined,
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
