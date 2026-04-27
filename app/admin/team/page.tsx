'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Key, Copy, Check, RefreshCw, Shield } from 'lucide-react';

const ALL_PERMISSIONS = [
  { key: 'products', label: 'Products', desc: 'Create, edit, delete products' },
  { key: 'orders', label: 'Orders', desc: 'View and manage orders' },
  { key: 'categories', label: 'Categories', desc: 'Manage categories' },
  { key: 'users', label: 'Users', desc: 'View user list' },
  { key: 'analytics', label: 'Analytics', desc: 'View analytics data' },
  { key: 'coupons', label: 'Coupons', desc: 'Manage discount coupons' },
  { key: 'settings', label: 'Settings', desc: 'View site settings (read-only)' },
];

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  credentialKey: string | null;
  createdAt: string;
}

interface Credentials {
  credentialKey: string;
  generatedPassword: string;
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', permissions: [] as string[] });
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => apiClient.get('/admin/team').then(({ data }) => setMembers(data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const togglePerm = (key: string) => {
    setForm(p => ({
      ...p,
      permissions: p.permissions.includes(key) ? p.permissions.filter(k => k !== key) : [...p.permissions, key],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await apiClient.post('/admin/team', form);
      setCredentials({ credentialKey: data.credentialKey, generatedPassword: data.generatedPassword });
      setShowForm(false);
      setForm({ name: '', email: '', permissions: [] });
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create sub-admin');
    }
  };

  const handleUpdatePerms = async (id: string, permissions: string[]) => {
    try {
      await apiClient.patch(`/admin/team/${id}`, { permissions });
      load();
    } catch { /* ignore */ }
  };

  const handleResetCreds = async (id: string) => {
    if (!confirm('Reset credentials? The sub-admin will need new login details.')) return;
    try {
      const { data } = await apiClient.put(`/admin/team/${id}`);
      setCredentials(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset credentials');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this sub-admin?')) return;
    try {
      await apiClient.delete(`/admin/team/${id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete sub-admin');
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team & RBAC</h1>
          <p className="text-sm text-gray-500 mt-1">Manage sub-admins with role-based access control</p>
        </div>
        <Button onClick={() => { setShowForm(true); setForm({ name: '', email: '', permissions: [] }); }} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Sub-Admin
        </Button>
      </div>

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Credentials Generated</h2>
                <p className="text-xs text-red-500 font-medium">Save these now — the password won't be shown again!</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Credential Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded-lg border text-sm font-mono font-bold text-indigo-600">{credentials.credentialKey}</code>
                  <button onClick={() => copyText(credentials.credentialKey, 'key')} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                    {copied === 'key' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded-lg border text-sm font-mono font-bold text-gray-900">{credentials.generatedPassword}</code>
                  <button onClick={() => copyText(credentials.generatedPassword, 'pass')} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                    {copied === 'pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>
            <Button onClick={() => setCredentials(null)} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Done</Button>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Create Sub-Admin</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.key} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p.key)}
                        onChange={() => togglePerm(p.key)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.label}</p>
                        <p className="text-xs text-gray-400">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                A unique credential key and password will be auto-generated. The sub-admin uses these to log in via the credential login page.
              </p>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Create & Generate Credentials</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Permissions</h2>
            <div className="space-y-2">
              {ALL_PERMISSIONS.map(p => {
                const member = members.find(m => m.id === editingId);
                const checked = member?.permissions.includes(p.key) || false;
                return (
                  <label key={p.key} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const newPerms = checked ? member!.permissions.filter(k => k !== p.key) : [...member!.permissions, p.key];
                        setMembers(prev => prev.map(m => m.id === editingId ? { ...m, permissions: newPerms } : m));
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                onClick={() => {
                  const member = members.find(m => m.id === editingId);
                  if (member) handleUpdatePerms(editingId, member.permissions);
                  setEditingId(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Permissions
              </Button>
              <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No sub-admins yet. Create one to delegate access.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Member', 'Credential Key', 'Permissions', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">{m.credentialKey || '—'}</code>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {m.permissions.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : m.permissions.map(p => (
                        <span key={p} className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditingId(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors" title="Edit permissions">
                        <Shield className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleResetCreds(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors" title="Reset credentials">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">How Sub-Admin Login Works</h3>
        <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
          <li>Create a sub-admin above — a unique Credential Key and Password are generated.</li>
          <li>Share the credentials with the sub-admin securely.</li>
          <li>The sub-admin goes to <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">/staff-login</code> and enters their Credential Key + Password.</li>
          <li>They see a limited dashboard based on their assigned permissions.</li>
        </ol>
      </div>
    </div>
  );
}
