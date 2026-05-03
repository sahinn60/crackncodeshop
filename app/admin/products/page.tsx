'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Pencil, Upload, FileText, Link2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Price } from '@/components/ui/Price';

interface Product { id: string; title: string; description: string; longDescription: string; price: number; oldPrice: number | null; imageUrl: string; fileUrl: string; category: string; features: string; format: string; rating: number; reviewCount: number; isTopSelling: boolean; isBundle: boolean; isPublished: boolean; createdAt: string }
interface Category { id: string; name: string; children: Category[] }

const emptyForm = { title: '', description: '', longDescription: '', price: '', oldPrice: '', imageUrl: '', fileUrl: '', category: '', features: '', format: '', rating: '', reviewCount: '', isTopSelling: false, isBundle: false, isPublished: true, youtubeUrl: '' };

const ALLOWED_TYPES = [
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  'text/csv', 'text/plain',
];

const FILE_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/x-rar-compressed': 'RAR',
  'application/x-7z-compressed': '7Z',
  'text/csv': 'CSV',
};

function FileUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.includes('cloudinary') ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(value && !value.includes('cloudinary') ? value : '');

  const cancelUpload = () => {
    if (xhrRef.current) { xhrRef.current.abort(); xhrRef.current = null; }
    setUploading(false); setProgress(0); setError('Upload cancelled.');
  };

  const handleUpload = (file: File) => {
    if (file.size > 100 * 1024 * 1024) { setError('File too large. Max 100MB.'); return; }
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|zip|rar|7z|xlsx?|csv|docx?|pptx?|txt)$/i)) {
      setError('Invalid file type. Allowed: PDF, ZIP, RAR, Excel, Word, PPT.'); return;
    }

    setUploading(true); setProgress(0); setError('');

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxhezbur2';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'crackncode_unsigned');
    formData.append('folder', 'crackncode/files');
    formData.append('resource_type', 'raw');
    formData.append('access_mode', 'public');

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      xhrRef.current = null; setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try { onChange(JSON.parse(xhr.responseText).secure_url); } catch { setError('Failed to parse upload response.'); }
      } else {
        try { setError(JSON.parse(xhr.responseText)?.error?.message || `Upload failed (${xhr.status})`); } catch { setError(`Upload failed (${xhr.status})`); }
      }
    };
    xhr.onerror = () => { xhrRef.current = null; setUploading(false); setError('Network error.'); };
    xhr.onabort = () => { xhrRef.current = null; setUploading(false); };
    xhr.send(formData);
  };

  const fileName = value ? value.split('/').pop()?.split('?')[0] || 'file' : '';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || '';

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button type="button" onClick={() => setMode('upload')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Upload className="h-3 w-3 inline mr-1" />Upload File
        </button>
        <button type="button" onClick={() => setMode('url')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Link2 className="h-3 w-3 inline mr-1" />Paste URL
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          {value ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">{fileName}</p>
                <p className="text-xs text-green-600">{fileExt} file uploaded ✓</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button type="button" onClick={() => inputRef.current?.click()} className="px-2 py-1 text-xs bg-white border border-green-200 rounded text-green-700 hover:bg-green-50">Replace</button>
                <button type="button" onClick={() => onChange('')} className="px-2 py-1 text-xs bg-white border border-red-200 rounded text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !uploading && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploading ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30'}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">Uploading... {progress}%</p>
                  <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <button type="button" onClick={cancelUpload} className="mt-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    ✕ Cancel Upload
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">Click to upload file</p>
                  <p className="text-xs text-gray-400">PDF, ZIP, Excel, Word, PPT, RAR up to 100MB</p>
                </div>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.zip,.rar,.7z,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
            className="hidden"
          />
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://drive.google.com/... or any direct link"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => { if (urlInput.trim()) { onChange(urlInput.trim()); } }}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >Set</button>
          </div>
          {value && mode === 'url' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-xs">✓ URL set</span>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline ml-auto">Test link →</a>
              <button type="button" onClick={() => { onChange(''); setUrlInput(''); }} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          )}
          <p className="text-xs text-gray-400">Paste Google Drive, Dropbox, or any direct download URL</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [authorFilter, setAuthorFilter] = useState('');
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (authorFilter) params.set('author', authorFilter);
    if (sortBy) params.set('sort', sortBy);
    apiClient.get(`/admin/products?${params}`).then(({ data }) => {
      const list = Array.isArray(data) ? data : data.products || [];
      setProducts(list);
      // Extract unique authors for filter dropdown
      const authorMap = new Map<string, string>();
      list.forEach((p: any) => { if (p.authorId && p.authorName) authorMap.set(p.authorId, p.authorName); });
      setAuthors(Array.from(authorMap, ([id, name]) => ({ id, name })));
    }).finally(() => setIsLoading(false));
  };
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
      fileUrl: p.fileUrl || '',
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
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, price: parseFloat(form.price), oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null, features: form.features.split('\n').filter(Boolean), rating: parseFloat(form.rating) || 0, reviewCount: parseInt(form.reviewCount) || 0, youtubeUrl: form.youtubeUrl, fileUrl: form.fileUrl };
      if (editingId) {
        await apiClient.put(`/products/${editingId}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      setSaveError(err.response?.data?.error || err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
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
                { label: 'Title', key: 'title', type: 'text', max: undefined },
                { label: 'Price (৳)', key: 'price', type: 'number', max: '9999999' },
                { label: 'Old Price (৳) — leave empty if no discount', key: 'oldPrice', type: 'number', max: '9999999' },
                { label: 'Rating (0-5)', key: 'rating', type: 'number', max: '5' },
                { label: 'Review Count', key: 'reviewCount', type: 'number', max: '999999' },
                { label: 'Format', key: 'format', type: 'text', max: undefined },
                { label: 'YouTube URL (optional)', key: 'youtubeUrl', type: 'text', max: undefined },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} required={f.key === 'title' || f.key === 'price'} max={f.max} min={f.type === 'number' ? '0' : undefined} step={f.key === 'rating' ? '0.1' : f.key === 'price' || f.key === 'oldPrice' ? '0.01' : '1'} value={form[f.key] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">📁 Product File (downloadable)</label>
                <FileUpload
                  value={form.fileUrl}
                  onChange={url => setForm(p => ({ ...p, fileUrl: url }))}
                />
              </div>
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
              {saveError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{saveError}</div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text" placeholder="Search products..." value={search}
          onChange={e => { setSearch(e.target.value); setTimeout(load, 300); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white w-48"
        />
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setTimeout(load, 100); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-high">Price: High→Low</option>
          <option value="price-low">Price: Low→High</option>
          <option value="popular">Most Popular</option>
        </select>
        <select value={authorFilter} onChange={e => { setAuthorFilter(e.target.value); setTimeout(load, 100); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="">All Authors</option>
          {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['', 'Title', 'Author', 'Category', 'Price', 'Flags', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No products yet. Add your first product!</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100" /> : <div className="h-10 w-10 rounded-lg bg-gray-100" />}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.title}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{(p as any).authorName || '—'}</td>
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
                    {p.fileUrl ? <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">📁 File</span> : <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-400">No file</span>}
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
