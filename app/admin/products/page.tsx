'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Pencil } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Price } from '@/components/ui/Price';

interface Product { id: string; title: string; description: string; longDescription: string; price: number; oldPrice: number | null; imageUrl: string; category: string; features: string; format: string; rating: number; reviewCount: number; isTopSelling: boolean; isBundle: boolean; isPublished: boolean; createdAt: string }
interface Category { id: string; name: string; children: Category[] }

const emptyForm = { title: '', description: '', longDescription: '', price: '', oldPrice: '', imageUrl: '', category: '', features: '', format: '', rating: '', reviewCount: '', isTopSelling: false, isBundle: false, isPublished: true, youtubeUrl: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => apiClient.get('/admin/products').then(({ data }) => setProducts(data)).finally(() => setIsLoading(false));
  useEffect(() => {
    load();
    apiClient.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      longDescription: p.longDescription || '',
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      imageUrl: p.imageUrl,
      category: p.category,
      features: (() => { try { return JSON.parse(p.features).join('\n'); } catch { return p.features; } })(),
      format: p.format,
      rating: String(p.rating),
      reviewCount: String(p.reviewCount),
      isTopSelling: p.isTopSelling,
      isBundle: p.isBundle,
      isPublished: p.isPublished,
      youtubeUrl: (p as any).youtubeUrl || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts(p => p.filter(x => x.id !== id));
    } catch {
      alert('Failed to delete product.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null, features: form.features.split('\n').filter(Boolean), rating: parseFloat(form.rating) || 0, reviewCount: parseInt(form.reviewCount) || 0, youtubeUrl: form.youtubeUrl };
    if (editingId) {
      await apiClient.put(`/products/${editingId}`, payload);
    } else {
      await apiClient.post('/products', payload);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {([
                { label: 'Title', key: 'title', type: 'text' },
                { label: 'Price (৳)', key: 'price', type: 'number' },
                { label: 'Old Price (৳) — leave empty if no discount', key: 'oldPrice', type: 'number' },
                { label: 'Rating (0-5)', key: 'rating', type: 'number' },
                { label: 'Review Count', key: 'reviewCount', type: 'number' },
                { label: 'Format', key: 'format', type: 'text' },
                { label: 'YouTube URL (optional)', key: 'youtubeUrl', type: 'text' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} required={f.key !== 'oldPrice'} value={form[f.key] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              ))}
              <ImageUpload
                value={form.imageUrl}
                onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
                label="Product Image"
                folder="crackncode/products"
                previewClass="h-40 w-full rounded-xl"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <optgroup key={c.id} label={c.name}>
                      <option value={c.name}>{c.name}</option>
                      {c.children.map(sub => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long Description (detailed, shown on product page)</label>
                <textarea value={form.longDescription} onChange={e => setForm(p => ({ ...p, longDescription: e.target.value }))} rows={5} placeholder="Detailed product description with all information..." className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                <textarea value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} rows={3} placeholder={"Feature 1\nFeature 2"} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              {/* Flags */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isTopSelling as boolean} onChange={e => setForm(p => ({ ...p, isTopSelling: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">⭐ Top Selling</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isBundle as boolean} onChange={e => setForm(p => ({ ...p, isBundle: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm font-medium text-gray-700">📦 Bundle Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer col-span-2">
                  <input type="checkbox" checked={form.isPublished as boolean} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm font-medium text-gray-700">✅ Published (visible on storefront)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">{editingId ? 'Save Changes' : 'Create Product'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Title', 'Category', 'Price', 'Flags', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No products yet. Add your first product!</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.category}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div><Price amount={p.price} /></div>
                  {p.oldPrice && p.oldPrice > p.price && (
                    <span className="text-xs text-gray-400 line-through"><Price amount={p.oldPrice} /></span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {p.isTopSelling && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">⭐ Top</span>}
                    {p.isBundle && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">📦 Bundle</span>}
                    {p.isPublished ? <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">Published</span> : <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">Draft</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button onClick={() => openEdit(p)} className="text-indigo-500 hover:text-indigo-700 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
