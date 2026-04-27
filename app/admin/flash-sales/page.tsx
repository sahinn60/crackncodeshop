'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Pencil, Flame, ToggleLeft, ToggleRight, Clock, Calendar } from 'lucide-react';
import { Price } from '@/components/ui/Price';

interface Product { id: string; title: string; price: number; imageUrl: string }
interface FlashSale {
  id: string; title: string; discountPercentage: number; isDaily: boolean;
  startTime: string | null; endTime: string | null; isActive: boolean; createdAt: string;
  items: { id: string; product: Product }[];
}

const emptyForm = {
  title: '', discountPercentage: '0', isDaily: true,
  startTime: '', endTime: '', productIds: [] as string[],
};

export default function AdminFlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    Promise.all([
      apiClient.get('/admin/flash-sales'),
      apiClient.get('/products', { params: { limit: 100 } }),
    ]).then(([{ data: s }, { data: p }]) => {
      setSales(s);
      setProducts(p.products || []);
    }).finally(() => setIsLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (s: FlashSale) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      discountPercentage: String(s.discountPercentage),
      isDaily: s.isDaily,
      startTime: s.startTime ? new Date(s.startTime).toISOString().slice(0, 16) : '',
      endTime: s.endTime ? new Date(s.endTime).toISOString().slice(0, 16) : '',
      productIds: s.items.map(i => i.product.id),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        discountPercentage: parseFloat(form.discountPercentage) || 0,
        startTime: form.isDaily ? null : form.startTime || null,
        endTime: form.isDaily ? null : form.endTime || null,
      };
      if (editingId) {
        await apiClient.put(`/admin/flash-sales/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/flash-sales', payload);
      }
      setShowForm(false); setForm(emptyForm); setEditingId(null); load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this flash sale?')) return;
    try { await apiClient.delete(`/admin/flash-sales/${id}`); setSales(s => s.filter(x => x.id !== id)); } catch {}
  };

  const toggleActive = async (s: FlashSale) => {
    try { await apiClient.put(`/admin/flash-sales/${s.id}`, { isActive: !s.isActive }); load(); } catch {}
  };

  const toggleProduct = (pid: string) => {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(pid) ? f.productIds.filter(id => id !== pid) : [...f.productIds, pid],
    }));
  };

  const selectedProducts = products.filter(p => form.productIds.includes(p.id));
  const originalTotal = selectedProducts.reduce((s, p) => s + p.price, 0);
  const discountedTotal = originalTotal * (1 - (parseFloat(form.discountPercentage) || 0) / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-500" /> Flash Sales
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create time-limited flash sales with countdown timers</p>
        </div>
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Create Flash Sale
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Flash Sale' : 'Create Flash Sale'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Weekend Mega Sale" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input type="number" min="0" max="99" value={form.discountPercentage} onChange={e => setForm(f => ({ ...f, discountPercentage: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </div>

              {/* Timer Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Timer Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm(f => ({ ...f, isDaily: true }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${form.isDaily ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Clock className={`h-5 w-5 ${form.isDaily ? 'text-red-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Daily Timer</p>
                      <p className="text-xs text-gray-500">Resets every midnight BD</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isDaily: false }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${!form.isDaily ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Calendar className={`h-5 w-5 ${!form.isDaily ? 'text-red-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Custom Timer</p>
                      <p className="text-xs text-gray-500">Set start & end time</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Time Pickers */}
              {!form.isDaily && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
                  </div>
                </div>
              )}

              {/* Product Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Products</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {products.map(p => (
                    <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-xs ${
                        form.productIds.includes(p.id) ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 line-clamp-1">{p.title}</p>
                        <p className="text-gray-500"><Price amount={p.price} /></p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Preview */}
              {selectedProducts.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total: <span className="line-through"><Price amount={originalTotal} /></span></p>
                    <p className="text-lg font-bold text-gray-900">Sale: <Price amount={discountedTotal} /></p>
                  </div>
                  <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">
                    {form.discountPercentage}% OFF
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={form.productIds.length < 1} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {editingId ? 'Save Changes' : 'Create Flash Sale'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Flame className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No flash sales yet. Create your first one!</p>
          </div>
        ) : sales.map(s => {
          const orig = s.items.reduce((sum, i) => sum + i.product.price, 0);
          return (
            <div key={s.id} className={`bg-white rounded-xl border shadow-sm p-5 ${s.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-red-500" /> {s.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.items.length} products · {s.discountPercentage}% off ·
                    {s.isDaily ? ' 🔄 Daily' : ` 📅 ${s.startTime ? new Date(s.startTime).toLocaleDateString() : ''} → ${s.endTime ? new Date(s.endTime).toLocaleDateString() : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(s)} title={s.isActive ? 'Deactivate' : 'Activate'}>
                    {s.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(s)} className="text-red-500 hover:text-red-700"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {s.items.map(i => (
                  <div key={i.id} className="relative group">
                    <img src={i.product.imageUrl} alt={i.product.title} className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {i.product.title}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through"><Price amount={orig} /></span>
                <span className="text-lg font-bold text-gray-900"><Price amount={orig * (1 - s.discountPercentage / 100)} /></span>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{s.discountPercentage}% OFF</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
