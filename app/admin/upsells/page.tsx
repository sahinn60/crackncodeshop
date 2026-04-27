'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, ArrowRight, ToggleLeft, ToggleRight, Link2 } from 'lucide-react';

interface Product { id: string; title: string; imageUrl: string; price: number }
interface UpsellRule {
  id: string; sourceProductId: string; targetProductId: string;
  type: string; priority: number; isActive: boolean;
  sourceProduct: Product | null; targetProduct: Product | null;
}

const TYPES = ['RELATED', 'FREQUENTLY_BOUGHT', 'UPGRADE', 'POST_PURCHASE'] as const;
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  RELATED: { label: 'Related', color: 'bg-blue-100 text-blue-700' },
  FREQUENTLY_BOUGHT: { label: 'Frequently Bought', color: 'bg-green-100 text-green-700' },
  UPGRADE: { label: 'Upgrade', color: 'bg-purple-100 text-purple-700' },
  POST_PURCHASE: { label: 'Post-Purchase', color: 'bg-amber-100 text-amber-700' },
};

export default function AdminUpsellsPage() {
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sourceProductId: '', targetProductId: '', type: 'RELATED' as string, priority: '0' });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = () => {
    Promise.all([
      apiClient.get('/admin/upsells'),
      apiClient.get('/products', { params: { limit: 100 } }),
    ]).then(([{ data: r }, { data: p }]) => {
      setRules(r);
      setProducts(p.products || []);
    }).finally(() => setIsLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/admin/upsells', { ...form, priority: parseInt(form.priority) || 0 });
      setShowForm(false);
      setForm({ sourceProductId: '', targetProductId: '', type: 'RELATED', priority: '0' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this upsell rule?')) return;
    try {
      await apiClient.delete(`/admin/upsells/${id}`);
      setRules(r => r.filter(x => x.id !== id));
    } catch { /* ignore */ }
  };

  const toggleActive = async (rule: UpsellRule) => {
    try {
      await apiClient.patch(`/admin/upsells/${rule.id}`, { isActive: !rule.isActive });
      load();
    } catch { /* ignore */ }
  };

  const filtered = filter === 'ALL' ? rules : rules.filter(r => r.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Upsell Rules</h1>
          <p className="text-sm text-gray-500 mt-1">Map product relationships for upsells and cross-sells</p>
        </div>
        <Button onClick={() => { setShowForm(true); setError(''); }} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...TYPES].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t === 'ALL' ? 'All' : TYPE_LABELS[t]?.label || t}
            {t !== 'ALL' && <span className="ml-1 opacity-70">({rules.filter(r => r.type === t).length})</span>}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Upsell Rule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Product (when viewing this...)</label>
                <select required value={form.sourceProductId} onChange={e => setForm(f => ({ ...f, sourceProductId: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Product (...suggest this)</label>
                <select required value={form.targetProductId} onChange={e => setForm(f => ({ ...f, targetProductId: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">Select product...</option>
                  {products.filter(p => p.id !== form.sourceProductId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t].label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.type === 'RELATED' && 'Shows in "You May Also Like" section'}
                  {form.type === 'FREQUENTLY_BOUGHT' && 'Shows in "Frequently Bought Together" section'}
                  {form.type === 'UPGRADE' && 'Shows as bundle upgrade suggestion'}
                  {form.type === 'POST_PURCHASE' && 'Shows after successful payment'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher = shown first)</label>
                <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Create Rule</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Source', '', 'Target', 'Type', 'Priority', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                <Link2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No upsell rules yet
              </td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className={`hover:bg-gray-50 ${!r.isActive ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.sourceProduct && <img src={r.sourceProduct.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{r.sourceProduct?.title || 'Deleted'}</span>
                  </div>
                </td>
                <td className="px-2 py-3"><ArrowRight className="h-4 w-4 text-gray-400" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.targetProduct && <img src={r.targetProduct.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{r.targetProduct?.title || 'Deleted'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_LABELS[r.type]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[r.type]?.label || r.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.priority}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(r)}>
                    {r.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
