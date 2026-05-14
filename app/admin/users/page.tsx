'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/axios';
import { Search, Trash2, KeyRound, X, Check, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Price } from '@/components/ui/Price';

interface User { id: string; name: string; email: string; role: string; createdAt: string; protected?: boolean; _count: { orders: number } }

interface AccessProduct {
  id: string; title: string; imageUrl: string; category: string; price: number;
  hasAccess: boolean; purchased: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const currentUser = useAuthStore(s => s.user);

  // Access modal state
  const [accessUser, setAccessUser] = useState<User | null>(null);
  const [accessProducts, setAccessProducts] = useState<AccessProduct[]>([]);
  const [accessSearch, setAccessSearch] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiClient.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);


  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await apiClient.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Open access modal
  const openAccess = async (u: User) => {
    setAccessUser(u);
    setAccessSearch('');
    setAccessLoading(true);
    try {
      const { data } = await apiClient.get(`/admin/users/${u.id}/access`);
      setAccessProducts(data.products);
      setSelectedIds(new Set(data.products.filter((p: AccessProduct) => p.hasAccess).map((p: AccessProduct) => p.id)));
    } catch {
      setAccessProducts([]);
      setSelectedIds(new Set());
    } finally {
      setAccessLoading(false);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveAccess = async () => {
    if (!accessUser) return;
    setSaving(true);
    try {
      await apiClient.post(`/admin/users/${accessUser.id}/access`, { productIds: Array.from(selectedIds) });
      setAccessUser(null);
    } catch {
      alert('Failed to save access');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!accessSearch.trim()) return accessProducts;
    const q = accessSearch.toLowerCase();
    return accessProducts.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [accessProducts, accessSearch]);

  const accessCount = selectedIds.size;
  const purchasedCount = accessProducts.filter(p => p.purchased).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-gray-900">Users <span className="text-gray-400 font-normal text-base">({filtered.length})</span></h1>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
            {['ALL', 'USER', 'ADMIN', 'SUB_ADMIN'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No users found.</p>
        ) : filtered.map(u => (
          <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : u.role === 'SUB_ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                {u.role}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{u._count.orders} orders</span>
                <span>{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openAccess(u)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg">
                  <KeyRound className="h-3 w-3" /> Access
                </button>
                {u.id !== currentUser?.id && !u.protected && (
                  <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Role', 'Orders', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No users found.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                      {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : u.role === 'SUB_ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{u._count.orders}</td>
                <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openAccess(u)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                      <KeyRound className="h-3.5 w-3.5" /> Access
                    </button>
                    {u.id !== currentUser?.id && !u.protected && (
                      <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Access Modal */}
      <AnimatePresence>
        {accessUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAccessUser(null)} className="absolute inset-0 bg-black/50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col z-10">

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-medium text-gray-900">Manage Product Access</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{accessUser.name} — {accessUser.email}</p>
                </div>
                <button onClick={() => setAccessUser(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stats + Search */}
              <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-semibold">
                    <KeyRound className="h-3 w-3" /> {accessCount} granted
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-600 text-[10px] font-semibold">
                    <ShoppingBag className="h-3 w-3" /> {purchasedCount} purchased
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input type="text" placeholder="Search products..." value={accessSearch} onChange={e => setAccessSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white" />
                </div>
              </div>

              {/* Product list */}
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {accessLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-12">No products found</p>
                ) : (
                  <div className="space-y-1">
                    {filteredProducts.map(p => {
                      const checked = selectedIds.has(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            checked ? 'bg-indigo-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                          }`}>
                            {checked && <Check className="h-3 w-3 text-white" />}
                          </div>

                          {/* Product info */}
                          <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400">{p.category}</span>
                              <span className="text-[10px] font-medium text-gray-500"><Price amount={p.price} /></span>
                            </div>
                          </div>

                          {/* Purchased badge */}
                          {p.purchased && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-100 text-green-700 flex-shrink-0">
                              Purchased
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <p className="text-xs text-gray-400">{accessCount} product{accessCount !== 1 ? 's' : ''} selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setAccessUser(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveAccess} disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Access'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
