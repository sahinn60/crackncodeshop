'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, TrendingUp, ArrowUpRight, Package, ShoppingCart, Eye, Star,
  FolderTree, MessageSquare, DollarSign, UserPlus, CheckCircle2, Activity,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { Price } from '@/components/ui/Price';

interface LeaderboardEntry {
  rank: number; authorId: string; authorName: string;
  totalProducts: number; weeklyProducts: number; isCurrentUser: boolean;
}

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  avgOrderValue: number;
  completedOrders: number;
  newUsersThisWeek: number;
  totalCategories: number;
  totalReviews: number;
  chartData: { name: string; sales: number }[];
  recentOrders: { id: string; total: number; status: string; createdAt: string; user: { name: string; email: string }; items: { product: { title: string } }[] }[];
  topProducts: { title: string; category: string; price: number; reviewCount: number }[];
  topCartProducts: { id: string; title: string; category: string; price: number; cartCount: number; imageUrl: string }[];
  recentReviews: { id: string; rating: number; comment: string; createdAt: string; user: { name: string }; product: { title: string } }[];
  orderStatusData: { status: string; count: number }[];
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  visitorsByDay: { day: string; visitors: number; mobile: number; desktop: number }[];
  categoryData: { name: string; value: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10B981',
  PENDING: '#F59E0B',
  REFUNDED: '#8B5CF6',
  CANCELLED: '#EF4444',
};

const PIE_COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1', '#EC4899'];
const CAT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

const tooltipStyle = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<LeaderboardEntry | null>(null);
  const isAdmin = useAuthStore(s => s.user?.role) === 'ADMIN';

  useEffect(() => {
    apiClient.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
    apiClient.get('/admin/leaderboard').then(({ data }) => {
      setLeaderboard(data.leaderboard || []);
      setMyStats(data.myStats || null);
    }).catch(() => {});
  }, []);

  const cards = stats ? [
    ...(isAdmin ? [
      { label: 'Total Revenue', value: <Price amount={stats.totalRevenue} />, icon: TrendingUp, color: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
      { label: 'Monthly Revenue', value: <Price amount={stats.monthRevenue} />, icon: DollarSign, color: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
    ] : []),
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
    { label: 'Completed', value: stats.completedOrders.toLocaleString(), icon: CheckCircle2, color: 'bg-teal-50', iconColor: 'text-teal-600', border: 'border-teal-100' },
    { label: 'Products', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
    { label: 'Categories', value: stats.totalCategories.toLocaleString(), icon: FolderTree, color: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'bg-purple-50', iconColor: 'text-purple-600', border: 'border-purple-100' },
    { label: 'New This Week', value: stats.newUsersThisWeek.toLocaleString(), icon: UserPlus, color: 'bg-pink-50', iconColor: 'text-pink-600', border: 'border-pink-100' },
  ] : [];

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
  );

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Add Product', href: '/admin/products', color: 'bg-indigo-600 text-white' },
          { label: 'Categories', href: '/admin/categories', color: 'bg-amber-500 text-white' },
          { label: 'Team', href: '/admin/team', color: 'bg-violet-600 text-white' },
          { label: 'Settings', href: '/admin/settings', color: 'bg-gray-700 text-white' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`px-4 py-2 rounded-lg text-xs font-medium ${a.color} hover:opacity-90 transition-opacity`}>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats ? cards.map((card) => (
          <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
            <div className={`${card.color} rounded-xl p-2.5 flex-shrink-0`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 truncate">{card.label}</p>
              <p className="text-base font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        )) : Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}
      </div>

      {/* KPI Row */}
      {stats && (
        <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
          {isAdmin && (
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white">
              <p className="text-xs opacity-70">Avg Order Value</p>
              <p className="text-xl font-semibold mt-1"><Price amount={stats.avgOrderValue} /></p>
            </div>
          )}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
            <p className="text-xs opacity-70">Total Reviews</p>
            <p className="text-xl font-semibold mt-1">{stats.totalReviews}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
            <p className="text-xs opacity-70">Conversion Rate</p>
            <p className="text-xl font-semibold mt-1">{stats.totalUsers > 0 ? ((stats.totalOrders / stats.totalUsers) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
      )}

      {/* Row 1: Monthly Revenue Trend + Order Status Donut */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-5`}>
        {isAdmin && (
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue — Last 6 Months</h3>
            <div className="h-56">
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyRevenue} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [formatPrice(v), 'Revenue']} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full" />}
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Order Status</h3>
          {stats && stats.orderStatusData.length > 0 ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.orderStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                      {stats.orderStatusData.map((entry, i) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
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
          ) : <Skeleton className="h-52" />}
        </div>
      </div>

      {/* Row 2: Weekly Sales Bar + Visitors */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-5`}>
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Sales — Last 7 Days</h3>
            <div className="h-52">
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [formatPrice(v), 'Sales']} contentStyle={tooltipStyle} />
                    <Bar dataKey="sales" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full" />}
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" /> Visitors — Last 7 Days
          </h3>
          <div className="h-52">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.visitorsByDay} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="desktop" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} name="Desktop" />
                  <Bar dataKey="mobile" stackId="a" fill="#A5B4FC" radius={[4, 4, 0, 0]} name="Mobile" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full" />}
          </div>
        </div>
      </div>

      {/* Row 3: Category Revenue + Monthly Orders */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-5`}>
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue by Category</h3>
            {stats && stats.categoryData.length > 0 ? (
              <div className="space-y-3">
                {stats.categoryData.map((cat, i) => {
                  const max = stats.categoryData[0]?.value || 1;
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
            ) : <Skeleton className="h-48" />}
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Monthly Orders</h3>
          <div className="h-52">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyRevenue} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full" />}
          </div>
        </div>
      </div>

      {/* Recent Orders + Top Products + Cart Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!stats ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-14 mx-5 my-2 bg-gray-100 rounded-lg animate-pulse" />)
            ) : stats.recentOrders?.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No orders yet.</p>
            ) : stats.recentOrders?.map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{o.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{o.items.map(i => i.product.title).join(', ')}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {isAdmin && <span className="text-sm font-medium text-gray-900"><Price amount={o.total} /></span>}
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Top Products</h3>
            <Link href="/admin/products" className="text-xs text-indigo-600 hover:underline font-medium">Manage</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!stats ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-14 mx-4 my-2 bg-gray-100 rounded-lg animate-pulse" />)
            ) : stats.topProducts?.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-[10px] font-bold text-gray-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </div>
                <span className="text-sm font-medium text-gray-900 flex-shrink-0"><Price amount={p.price} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Activity — Top Products by Add to Cart */}
      {stats?.topCartProducts && stats.topCartProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-500" /> Cart Activity — Most Added Products
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {stats.topCartProducts.slice(0, 5).map((p, i) => (
              <div key={p.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-bold ${i < 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover bg-gray-100 flex-shrink-0" />}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-500"><Price amount={p.price} /></span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                    <ShoppingCart className="h-2.5 w-2.5" /> {p.cartCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {stats.topCartProducts.length > 5 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <div className="space-y-2">
                {stats.topCartProducts.slice(5).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 w-5">#{i + 6}</span>
                      <span className="text-xs text-gray-700 truncate">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 flex-shrink-0">{p.cartCount} adds</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Reviews */}
      {stats?.recentReviews && stats.recentReviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" /> Recent Reviews
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentReviews.map(r => (
              <div key={r.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{r.user.name}</span>
                    <span className="text-xs text-gray-400">on</span>
                    <span className="text-sm font-medium text-indigo-600">{r.product.title}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              🏆 Upload Leaderboard
            </h3>
          </div>
          {!isAdmin && myStats && (
            <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-indigo-600">#{myStats.rank}</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Your Position</p>
                  <p className="text-xs text-indigo-600">{myStats.totalProducts} total · {myStats.weeklyProducts} this week</p>
                </div>
              </div>
              {myStats.rank === 1 && <span className="text-lg">👑</span>}
            </div>
          )}
          <div className="divide-y divide-gray-50">
            {leaderboard.slice(0, 10).map(entry => (
              <div key={entry.authorId} className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors ${entry.isCurrentUser ? 'bg-indigo-50/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 text-center ${entry.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.authorName} {entry.isCurrentUser ? '(You)' : ''}</p>
                    <p className="text-xs text-gray-400">{entry.weeklyProducts} this week</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{entry.totalProducts} products</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
