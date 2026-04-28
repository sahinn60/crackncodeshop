'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, Percent, DollarSign, Star,
  MessageSquare, UserPlus, UserCheck, Eye, MousePointerClick, CreditCard, CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/currency';
import { Price } from '@/components/ui/Price';

type Range = '7' | '14' | '30' | 'all';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue?: number;
  avgOrderValue?: number;
  conversionRate?: number;
  completedOrders: number;
  newUsersThisWeek: number;
  totalCategories: number;
  dailyRevenue?: { date: string; revenue: number; orders: number }[];
  orderStatusData: { status: string; count: number }[];
  monthlyRevenue?: { month: string; revenue: number; orders: number }[];
  visitorsByDay: { day: string; visitors: number; mobile: number; desktop: number }[];
  categoryData?: { name: string; value: number }[];
  topProducts: { title: string; category: string; price: number; reviewCount: number }[];
  totalReviews: number;
  avgRating: number;
  newUsersInRange: number;
  returningBuyers: number;
  uniqueBuyers: number;
  funnel?: { visitors: number; productViews: number; purchasers: number; completed: number };
}

const RANGES: { key: Range; label: string }[] = [
  { key: '7', label: '7D' },
  { key: '14', label: '14D' },
  { key: '30', label: '30D' },
  { key: 'all', label: 'Lifetime' },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10B981', PENDING: '#F59E0B', REFUNDED: '#8B5CF6', CANCELLED: '#EF4444',
};
const PIE_COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1'];
const CAT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
const tooltipStyle = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 };

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>('7');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = useAuthStore(s => s.user?.role) === 'ADMIN';

  const fetchStats = useCallback((r: Range) => {
    setLoading(true);
    apiClient.get('/admin/stats', { params: { range: r } })
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(range); }, [range, fetchStats]);

  const kpis = useMemo(() => {
    if (!stats) return [];
    const items: { label: string; value: React.ReactNode; icon: any; color: string; iconColor: string }[] = [];
    if (isAdmin && stats.totalRevenue !== undefined)
      items.push({ label: 'Total Revenue', value: <Price amount={stats.totalRevenue} />, icon: TrendingUp, color: 'bg-green-50', iconColor: 'text-green-600' });
    items.push({ label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-indigo-50', iconColor: 'text-indigo-600' });
    items.push({ label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'bg-purple-50', iconColor: 'text-purple-600' });
    if (isAdmin && stats.conversionRate !== undefined)
      items.push({ label: 'Conversion Rate', value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent, color: 'bg-amber-50', iconColor: 'text-amber-600' });
    if (isAdmin && stats.avgOrderValue !== undefined)
      items.push({ label: 'Avg Order Value', value: <Price amount={stats.avgOrderValue} />, icon: DollarSign, color: 'bg-emerald-50', iconColor: 'text-emerald-600' });
    return items;
  }, [stats, isAdmin]);

  const funnelSteps = useMemo(() => {
    if (!stats?.funnel) return [];
    const f = stats.funnel;
    const base = f.visitors || 1;
    return [
      { label: 'Visitors', value: f.visitors, pct: 100, icon: Eye, color: '#6366F1' },
      { label: 'Product Views', value: f.productViews, pct: Math.round((f.productViews / base) * 100), icon: MousePointerClick, color: '#F59E0B' },
      { label: 'Purchasers', value: f.purchasers, pct: Math.round((f.purchasers / base) * 100), icon: CreditCard, color: '#10B981' },
      { label: 'Completed', value: f.completed, pct: Math.round((f.completed / base) * 100), icon: CheckCircle2, color: '#8B5CF6' },
    ];
  }, [stats]);

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
  );

  return (
    <div className="space-y-6">
      {/* Header + Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                range === r.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 ${kpis.length >= 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-3'} gap-3`}>
        {loading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-[80px]" />) :
          kpis.map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className={`${k.color} rounded-xl p-2.5 flex-shrink-0`}>
                <k.icon className={`h-4 w-4 ${k.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 truncate">{k.label}</p>
                <p className="text-lg font-semibold text-gray-900">{k.value}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Revenue + Orders Charts */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Revenue Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue</h3>
            <div className="h-56">
              {loading ? <Skeleton className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.dailyRevenue || []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [formatPrice(v), 'Revenue']} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Orders per Day</h3>
            <div className="h-56">
              {loading ? <Skeleton className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.dailyRevenue || []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Performance + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top 5 Products */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Top Products</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? Array(5).fill(0).map((_, i) => <div key={i} className="h-14 mx-5 my-2 bg-gray-100 rounded-lg animate-pulse" />) :
              stats?.topProducts?.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-[10px] font-bold text-gray-300 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.category} · {p.reviewCount} reviews</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-shrink-0"><Price amount={p.price} /></span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Order Status</h3>
          {loading ? <Skeleton className="h-52" /> : stats && stats.orderStatusData.length > 0 ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.orderStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                      {stats.orderStatusData.map((e, i) => (
                        <Cell key={e.status} fill={STATUS_COLORS[e.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                {stats.orderStatusData.map((s, i) => (
                  <div key={s.status} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.status] || PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[11px] text-gray-500">{s.status} ({s.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-gray-400 text-center py-8">No orders in this period</p>}
        </div>
      </div>

      {/* User Analytics + Review Analytics + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Analytics */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">User Analytics</h3>
          {loading ? <Skeleton className="h-32" /> : stats && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 rounded-xl p-2.5"><UserPlus className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="text-[11px] text-gray-500">New Users</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.newUsersInRange}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 rounded-xl p-2.5"><UserCheck className="h-4 w-4 text-emerald-600" /></div>
                <div>
                  <p className="text-[11px] text-gray-500">Unique Buyers</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.uniqueBuyers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 rounded-xl p-2.5"><Users className="h-4 w-4 text-purple-600" /></div>
                <div>
                  <p className="text-[11px] text-gray-500">Returning Buyers</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.returningBuyers}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Review Analytics */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-500" /> Review Analytics
          </h3>
          {loading ? <Skeleton className="h-32" /> : stats && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stats.avgRating}</p>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(stats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Average Rating</p>
              </div>
              <div className="text-center border-t border-gray-100 pt-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                <p className="text-xs text-gray-500">Total Reviews</p>
              </div>
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Conversion Funnel</h3>
            {loading ? <Skeleton className="h-32" /> : funnelSteps.length > 0 ? (
              <div className="space-y-3">
                {funnelSteps.map((step, i) => (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-3.5 w-3.5" style={{ color: step.color }} />
                        <span className="text-xs text-gray-600">{step.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">{step.value}</span>
                        {i > 0 && (
                          <span className="text-[10px] text-gray-400">({step.pct}%)</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${step.pct}%`, background: step.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
          </div>
        )}
      </div>

      {/* Visitors + Category Revenue */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-5`}>
        {/* Visitors */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Visitors</h3>
          <div className="h-52">
            {loading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.visitorsByDay || []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="desktop" stackId="a" fill="#6366F1" name="Desktop" />
                  <Bar dataKey="mobile" stackId="a" fill="#A5B4FC" radius={[4, 4, 0, 0]} name="Mobile" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Revenue */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue by Category</h3>
            {loading ? <Skeleton className="h-52" /> : stats && stats.categoryData && stats.categoryData.length > 0 ? (
              <div className="space-y-3">
                {stats.categoryData.map((cat, i) => {
                  const max = stats.categoryData![0]?.value || 1;
                  const pct = Math.round((cat.value / max) * 100);
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 truncate">{cat.name}</span>
                        <span className="text-xs font-medium text-gray-900">{formatPrice(cat.value)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
          </div>
        )}
      </div>
    </div>
  );
}
