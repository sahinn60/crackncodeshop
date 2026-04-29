'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Pencil, X, Tag, Copy, Check, Eye, ArrowUp, ArrowDown, Power } from 'lucide-react';

interface Coupon {
  id: string;
  title: string;
  code: string;
  discount: string;
  message: string;
  isActive: boolean;
  priority: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

const emptyForm = { title: '', code: '', discount: '', message: '', priority: '0', startDate: '', endDate: '', isActive: true, emoji: '🔥', barColor: '#DC2626', textColor: '#FFFFFF', showTimer: true, speedDesktop: '47', speedMobile: '70' };

function utcToBdtLocal(utc: string): string {
  const bdt = new Date(new Date(utc).getTime() + 6 * 60 * 60 * 1000);
  return bdt.toISOString().slice(0, 16);
}

function bdtLocalToUtc(local: string): string {
  return new Date(new Date(local + ':00.000Z').getTime() - 6 * 60 * 60 * 1000).toISOString();
}

function nowBdt(): string {
  return new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function formatBdt(utc: string): string {
  return new Date(utc).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [copied, setCopied] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const load = () => apiClient.get('/admin/coupons').then(({ data }) => setCoupons(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, startDate: nowBdt() });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      code: c.code,
      discount: c.discount,
      message: c.message,
      priority: String(c.priority),
      startDate: c.startDate ? utcToBdtLocal(c.startDate) : '',
      endDate: c.endDate ? utcToBdtLocal(c.endDate) : '',
      isActive: c.isActive,
      emoji: (c as any).emoji || '🔥',
      barColor: (c as any).barColor || '#DC2626',
      textColor: (c as any).textColor || '#FFFFFF',
      showTimer: (c as any).showTimer ?? true,
      speedDesktop: String((c as any).speedDesktop || 47),
      speedMobile: String((c as any).speedMobile || 70),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        code: form.code,
        discount: form.discount,
        message: form.message,
        priority: form.priority,
        isActive: form.isActive,
        startDate: form.startDate ? bdtLocalToUtc(form.startDate) : undefined,
        endDate: form.endDate ? bdtLocalToUtc(form.endDate) : undefined,
        emoji: form.emoji,
        barColor: form.barColor,
        textColor: form.textColor,
        showTimer: form.showTimer,
        speedDesktop: parseInt(form.speedDesktop as string) || 47,
        speedMobile: parseInt(form.speedMobile as string) || 70,
      };
      if (editingId) {
        await apiClient.put(`/admin/coupons/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/coupons', payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await apiClient.delete(`/admin/coupons/${id}`); load(); }
    catch { alert('Failed to delete'); }
  };

  const handleToggle = async (id: string) => {
    try { await apiClient.patch(`/admin/coupons/${id}`); load(); }
    catch { alert('Failed to toggle'); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const activeCoupons = coupons.filter(c => c.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Manage announcement bar coupons shown to customers</p>
        </div>
        <div className="flex gap-2">
          {activeCoupons.length > 0 && (
            <Button variant="outline" onClick={() => setShowPreview(p => !p)} className="gap-2 text-sm">
              <Eye className="h-4 w-4" /> {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          )}
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm">
            <Plus className="h-4 w-4" /> Add Coupon
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && activeCoupons.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <p className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</p>
          <div className="bg-gradient-to-r from-red-500 via-red-500 to-red-500 px-4 py-2.5 flex items-center justify-center overflow-hidden">
            <div className="flex items-center gap-6 animate-marquee-preview">
              {[...activeCoupons, ...activeCoupons].map((c, i) => (
                <span key={`${c.id}-${i}`} className="inline-flex items-center gap-1.5 text-white text-sm font-medium whitespace-nowrap">
                  🔥 {c.message}
                  {c.code && (
                    <>
                      <span className="mx-0.5">—</span> code
                      <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-xs tracking-wider border border-white/10 ml-1">{c.code}</span>
                    </>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>

            {/* Inline Preview */}
            {form.message && (
              <div className="mb-5 rounded-lg overflow-hidden">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Preview</p>
                <div className="bg-gradient-to-r from-red-500 to-red-500 px-4 py-2 rounded-lg flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 text-white text-sm font-medium">
                    🔥 {form.message}
                    {form.code && (
                      <>
                        <span className="mx-0.5">—</span> code
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-xs tracking-wider border border-white/10 ml-1">{form.code.toUpperCase()}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (internal)</label>
                  <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Spring Sale" className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input required value={form.code} onChange={e => set('code', e.target.value)} placeholder="SPRING20" className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                  <input value={form.discount} onChange={e => set('discount', e.target.value)} placeholder="20% or 50 BDT" className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Message</label>
                  <input required value={form.message} onChange={e => set('message', e.target.value)} placeholder="Spring Sale: 20% OFF all templates" className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input type="number" value={form.priority} onChange={e => set('priority', e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  <p className="text-[11px] text-gray-400 mt-1">Higher = shows first</p>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive as boolean} onChange={e => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Active immediately</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-gray-400 font-normal">(BDT)</span></label>
                  <input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-gray-400 font-normal">(BDT, optional)</span></label>
                  <input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>

              {/* Design Controls */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-sm font-semibold text-gray-900 mb-3">🎨 Design</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                    <select value={form.emoji} onChange={e => set('emoji', e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      {['🔥', '⚡', '🎉', '💥', '🚀', '💰', '🎁', '✨', '🏷️', '⏰', '🛒', '❤️'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.showTimer as boolean} onChange={e => set('showTimer', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">⏰ Show Timer</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bar Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.barColor as string} onChange={e => set('barColor', e.target.value)} className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                      <input type="text" value={form.barColor as string} onChange={e => set('barColor', e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.textColor as string} onChange={e => set('textColor', e.target.value)} className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                      <input type="text" value={form.textColor as string} onChange={e => set('textColor', e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🖥️ Desktop Speed (seconds)</label>
                    <input type="number" min="5" max="200" value={form.speedDesktop as string} onChange={e => set('speedDesktop', e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <p className="text-[11px] text-gray-400 mt-1">Higher = slower scroll</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📱 Mobile Speed (seconds)</label>
                    <input type="number" min="5" max="200" value={form.speedMobile as string} onChange={e => set('speedMobile', e.target.value)} className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <p className="text-[11px] text-gray-400 mt-1">Higher = slower scroll</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">{editingId ? 'Save Changes' : 'Create Coupon'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No coupons yet. Create your first announcement!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Coupon', 'Message', 'Priority', 'Schedule', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => {
                const now = new Date();
                const started = new Date(c.startDate) <= now;
                const ended = c.endDate && new Date(c.endDate) < now;
                const isLive = c.isActive && started && !ended;

                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${!c.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.code}</span>
                          <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-indigo-500 transition-colors">
                            {copied === c.code ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                          {c.discount && <span className="text-xs text-gray-400">{c.discount} off</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[200px] truncate">{c.message}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        {c.priority > 0 ? <ArrowUp className="h-3 w-3 text-green-500" /> : <ArrowDown className="h-3 w-3 text-gray-300" />}
                        {c.priority}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-gray-500">
                        <p>{formatBdt(c.startDate)}</p>
                        {c.endDate && <p className="text-gray-400">→ {formatBdt(c.endDate)}</p>}
                        {!c.endDate && <p className="text-gray-300">No end date</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleToggle(c.id)} className="group flex items-center gap-1.5">
                        {isLive ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                          </span>
                        ) : ended ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">Expired</span>
                        ) : !c.isActive ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">Inactive</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">Scheduled</span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleToggle(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors" title="Toggle active">
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
