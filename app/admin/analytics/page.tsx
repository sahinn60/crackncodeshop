'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { apiClient } from '@/lib/axios';
import { formatPrice } from '@/lib/currency';
import { Price } from '@/components/ui/Price';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const categoryData = stats?.topProducts?.reduce((acc: any[], p: any) => {
    const existing = acc.find(x => x.name === p.category);
    if (existing) existing.value += 1;
    else acc.push({ name: p.category, value: 1 });
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: <Price amount={stats?.totalRevenue || 0} /> },
          { label: 'Total Orders',  value: stats?.totalOrders || 0 },
          { label: 'Total Users',   value: stats?.totalUsers || 0 },
          { label: 'Total Products',value: stats?.totalProducts || 0 },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 font-medium">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Revenue Over Last 7 Days</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.chartData || []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [formatPrice(v), 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={2.5} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Products by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
