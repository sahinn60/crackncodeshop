'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Plus, Trash2, X, Pencil, Package, ToggleLeft, ToggleRight, Timer } from 'lucide-react';
import { Price } from '@/components/ui/Price';

interface Product { id: string; title: string; price: number; imageUrl: string }
interface Bundle {
  id: string; name: string; slug: string; description: string; imageUrl: string;
  discount: number; isActive: boolean; isDailyTimer: boolean; createdAt: string;
  items: { id: string; product: Product }[];
}

const emptyForm = { name: '', description: '', imageUrl: '', discount: '0', isDailyTimer: false, productIds: [] as string[] };

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    Promise.all([
      apiClient.get('/admin/bundles'),
      apiClient.get('/products', { params: { limit: 100 } }),
    ]).then(([{ data: b }, { data: p }]) => {
      setBundles(b);
      setProducts(p.products || []);
    }).finally(() => setIsLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (b: Bundle) => {
    setEditingId(b.id);
    setForm({
      name: b.name, description: b.description, imageUrl: b.imageUrl,
      discount: String(b.discount), isDailyTimer: b.isDailyTimer,
      productIds: b.items.map(i => i.product.id),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, discount: parseFloat(form.discount) || 0 };
      if (editingId) {
        await apiClient.put(`/admin/bundles/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/bundles', payload);
      }
      setShowForm(false); setForm(emptyForm); setEditingId(null); load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bundle?')) return;
    try {
      await apiClient.delete(`/admin/bundles/${id}`);
      setBundles(b => b.filter(x => x.id !== id));
    } catch { /* ignore */ }
  };

  const toggleActive = async (b: Bundle) => {
    try {
      await apiClient.put(`/admin/bundles/${b.id}`, { isActive: !b.isActive });
      load();
    } catch { /* ignore */ }
  };

  const toggleProduct = (pid: string) => {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(pid)
        ? f.productIds.filter(id => id !== pid)
        : [...f.productIds, pid],
    }));
  };

  const selectedProducts = products.filter(p => form.productIds.includes(p.id));
  const originalPrice = selectedProducts.reduce((s, p) => s + p.price, 0);
  const bundlePrice = originalPrice * (1 - (parseFloat(form.discount) || 0) / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bundles</h1>
          <p className="text-sm text-gray-500 mt-1">Create product bundles with discounts to increase AOV</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Create Bundle
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Bundle' : 'Create Bundle'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} label="Bundle Image" folder="crackncode/bundles" previewClass="h-32 w-full rounded-xl" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input type="number" min="0" max="99" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Products (min 2)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {products.map(p => (
                    <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-xs ${
                        form.productIds.includes(p.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
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
              {selectedProducts.length >= 2 && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Original: <span className="line-through"><Price amount={originalPrice} /></span></p>
                    <p className="text-lg font-bold text-gray-900">Bundle: <Price amount={bundlePrice} /></p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                    Save {form.discount}%
                  </span>
                </div>
              )}

              {/* Daily Timer Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                <input type="checkbox" checked={form.isDailyTimer} onChange={e => setForm(f => ({ ...f, isDailyTimer: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <div>
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Timer className="h-4 w-4 text-amber-500" /> Enable Daily Countdown Timer</span>
                  <p className="text-xs text-gray-500 mt-0.5">Shows a countdown that resets daily at midnight (Bangladesh time)</p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={form.productIds.length < 2} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {editingId ? 'Save Changes' : 'Create Bundle'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bundles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">Loading...</div>
        ) : bundles.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No bundles yet. Create your first bundle!</p>
          </div>
        ) : bundles.map(b => {
          const orig = b.items.reduce((s, i) => s + i.product.price, 0);
          const discounted = orig * (1 - b.discount / 100);
          return (
            <div key={b.id} className={`bg-white rounded-xl border shadow-sm p-5 ${b.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{b.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{b.items.length} products · {b.discount}% off{b.isDailyTimer ? ' · ⏳ Daily Timer' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(b)} className="text-gray-400 hover:text-gray-600" title={b.isActive ? 'Deactivate' : 'Activate'}>
                    {b.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => openEdit(b)} className="text-indigo-500 hover:text-indigo-700"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                {b.items.map(i => (
                  <div key={i.id} className="relative group">
                    <img src={i.product.imageUrl} alt={i.product.title} className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {i.product.title}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through"><Price amount={orig} /></span>
                <span className="text-lg font-bold text-gray-900"><Price amount={discounted} /></span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">Save {b.discount}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
