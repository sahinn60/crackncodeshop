'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/axios';
import { Search, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface User { id: string; name: string; email: string; role: string; createdAt: string; _count: { orders: number } }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const currentUser = useAuthStore(s => s.user);

  useEffect(() => {
    apiClient.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

  const toggleRole = async (u: User) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    await apiClient.patch(`/admin/users/${u.id}`, { role: newRole });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await apiClient.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Users <span className="text-gray-400 font-normal text-base">({filtered.length})</span></h1>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white"
          >
            {['ALL', 'USER', 'ADMIN', 'SUB_ADMIN'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
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
                    {u.id !== currentUser?.id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRole(u)}
                          title={u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                          className={`p-1.5 rounded-lg transition-colors ${u.role === 'ADMIN' ? 'text-indigo-500 hover:bg-indigo-50' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-500'}`}
                        >
                          {u.role === 'ADMIN' ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
