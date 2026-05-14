'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Plus, Trash2, Pencil, X, ChevronRight, FolderTree } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  parentId: string | null;
  children: Category[];
}

const emptyForm = { name: '', imageUrl: '', parentId: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => apiClient.get('/admin/categories').then(({ data }) => setCategories(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = (parentId = '') => { setEditingId(null); setForm({ ...emptyForm, parentId }); setShowForm(true); };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, imageUrl: c.imageUrl, parentId: c.parentId || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, imageUrl: form.imageUrl, parentId: form.parentId || null };
      if (editingId) {
        await apiClient.put(`/admin/categories/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/categories', payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Sub-categories will become root categories.')) return;
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const allFlat = categories.flatMap(c => [c, ...c.children]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories and sub-categories</p>
        </div>
        <Button onClick={() => openCreate()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editingId ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">None (Root Category)</option>
                  {categories.filter(c => c.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <ImageUpload
                value={form.imageUrl}
                onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
                label="Category Image"
                folder="crackncode/categories"
                previewClass="h-24 w-24 rounded-xl"
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">{editingId ? 'Save' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No categories yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Parent */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 rounded-lg object-cover bg-gray-100" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <FolderTree className="h-5 w-5 text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">/{cat.slug} · {cat.children.length} sub-categories</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openCreate(cat.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors" title="Add sub-category">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Children */}
              {cat.children.length > 0 && (
                <div className="border-t border-gray-100">
                  {cat.children.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between px-5 py-3 pl-14 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                        {sub.imageUrl ? (
                          <img src={sub.imageUrl} alt={sub.name} className="h-8 w-8 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <FolderTree className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{sub.name}</p>
                          <p className="text-xs text-gray-400">/{sub.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(sub)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
