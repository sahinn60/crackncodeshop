'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/axios';
import { Search, ChevronDown, FileText, X, Package, Mail, Calendar, Hash, Printer } from 'lucide-react';
import { Price } from '@/components/ui/Price';
import { formatPrice } from '@/lib/currency';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AnimatePresence, motion } from 'framer-motion';

interface OrderItem {
  id: string;
  price: number;
  downloadCount: number;
  product: { id: string; title: string; price: number; imageUrl: string; category: string };
}

interface Order {
  id: string;
  total: number;
  status: string;
  epsTransactionId: string;
  epsMerchantTxId: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: OrderItem[];
}

const STATUSES = ['ALL', 'COMPLETED', 'PENDING', 'REFUNDED', 'CANCELLED'];

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function generateInvoiceHTML(order: Order, siteName: string, logoUrl: string) {
  const items = order.items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f1f1;font-size:13px">${i.product.title}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f1f1;font-size:13px;color:#888">${i.product.category}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f1f1;font-size:13px;text-align:right">${formatPrice(i.price)}</td>
    </tr>
  `).join('');

  const discount = order.items.reduce((s, i) => s + i.price, 0) - order.total;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice #${order.id.slice(-8).toUpperCase()}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Inter,-apple-system,sans-serif;color:#1a1a1a;padding:40px;max-width:700px;margin:0 auto;font-weight:300;letter-spacing:-0.01em}
  h1,h2,h3{font-weight:500;letter-spacing:-0.02em}
  @media print{body{padding:20px}button{display:none!important}}
</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
  <div>
    ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="height:32px;margin-bottom:8px">` : `<h2 style="font-size:22px;font-weight:600">${siteName}</h2>`}
    <p style="font-size:12px;color:#888;margin-top:4px">Digital Products Platform</p>
  </div>
  <div style="text-align:right">
    <h1 style="font-size:28px;color:#FF2D2D;font-weight:600">INVOICE</h1>
    <p style="font-size:12px;color:#888;margin-top:4px">#${order.id.slice(-8).toUpperCase()}</p>
  </div>
</div>

<div style="display:flex;justify-content:space-between;margin-bottom:32px;gap:20px">
  <div style="flex:1">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:6px">Bill To</p>
    <p style="font-size:14px;font-weight:500">${order.user.name}</p>
    <p style="font-size:12px;color:#666">${order.user.email}</p>
  </div>
  <div style="text-align:right">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:6px">Invoice Date</p>
    <p style="font-size:13px">${formatDate(order.createdAt)}</p>
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:6px;margin-top:12px">Status</p>
    <p style="font-size:13px;font-weight:500;color:${order.status === 'COMPLETED' ? '#16a34a' : '#d97706'}">${order.status}</p>
  </div>
</div>

<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <thead>
    <tr style="background:#f9fafb">
      <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#888;font-weight:600">Product</th>
      <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#888;font-weight:600">Category</th>
      <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#888;font-weight:600">Price</th>
    </tr>
  </thead>
  <tbody>${items}</tbody>
</table>

<div style="display:flex;justify-content:flex-end">
  <div style="width:240px">
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#666">
      <span>Subtotal</span><span>${formatPrice(order.items.reduce((s, i) => s + i.price, 0))}</span>
    </div>
    ${discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#16a34a">
      <span>Discount</span><span>-${formatPrice(discount)}</span>
    </div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:600;border-top:2px solid #111;margin-top:4px">
      <span>Total</span><span>${formatPrice(order.total)}</span>
    </div>
  </div>
</div>

<div style="margin-top:48px;padding-top:20px;border-top:1px solid #eee;text-align:center">
  <p style="font-size:11px;color:#aaa">Thank you for your purchase!</p>
  <p style="font-size:11px;color:#ccc;margin-top:4px">${siteName} — Digital Products Platform</p>
</div>

<div style="text-align:center;margin-top:24px">
  <button onclick="window.print()" style="padding:10px 28px;background:#FF2D2D;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer">Print Invoice</button>
</div>
</body></html>`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { settings } = useSettingsStore();

  useEffect(() => {
    apiClient.get('/admin/orders').then(({ data }) => setOrders(data)).finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = o.user.name.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiClient.patch(`/admin/orders/${id}`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } finally {
      setUpdatingId(null);
    }
  };

  const openInvoice = useCallback((order: Order) => {
    const html = generateInvoiceHTML(order, settings?.siteName || 'Crackncode', settings?.logoUrl || '');
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }, [settings]);

  const totalRevenue = useMemo(() => filtered.reduce((s, o) => s + o.total, 0), [filtered]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Orders <span className="text-gray-400 font-light text-base">({filtered.length})</span></h1>
          <p className="text-xs text-gray-400 mt-0.5">Total: <span className="font-medium text-gray-600"><Price amount={totalRevenue} /></span></p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No orders found.</p>
          </div>
        ) : filtered.map(o => (
          <div key={o.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
            {/* Order Row */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
            >
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-y-2 gap-x-4 items-center">
                {/* ID + Customer */}
                <div className="col-span-2 sm:col-span-2 min-w-0">
                  <p className="text-xs font-mono text-gray-400">#{o.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{o.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{o.user.email}</p>
                </div>
                {/* Items count */}
                <div className="hidden sm:block">
                  <p className="text-xs text-gray-400">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</p>
                </div>
                {/* Total */}
                <div>
                  <p className="text-sm font-semibold text-gray-900"><Price amount={o.total} /></p>
                  <p className="text-[10px] text-gray-400">{formatDate(o.createdAt)}</p>
                </div>
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${expandedId === o.id ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded Detail */}
            <AnimatePresence>
              {expandedId === o.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                      <div className="flex items-start gap-2">
                        <Hash className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Order ID</p>
                          <p className="text-xs font-mono text-gray-700">{o.id.slice(-12).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Customer</p>
                          <p className="text-xs text-gray-700">{o.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Date</p>
                          <p className="text-xs text-gray-700">{formatDate(o.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Package className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">EPS Txn</p>
                          <p className="text-xs font-mono text-gray-700">{o.epsTransactionId || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase hidden sm:table-cell">Category</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {o.items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={item.product.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                  <span className="text-sm text-gray-900 truncate">{item.product.title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{item.product.category}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right"><Price amount={item.price} /></td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"><Price amount={o.total} /></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-500">Status:</label>
                        <select
                          value={o.status}
                          disabled={updatingId === o.id}
                          onChange={e => updateStatus(o.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white disabled:opacity-50"
                        >
                          {STATUSES.filter(s => s !== 'ALL').map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openInvoice(o); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> Invoice
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
