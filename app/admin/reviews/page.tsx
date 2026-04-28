'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/axios';
import { Star, Search, CheckCircle, XCircle, Trash2, MessageSquare, Clock, User, Upload, FileJson, X, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  comment: string;
  guestName?: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string };
  product: { id: string; title: string; imageUrl: string };
}

interface ProductOption { id: string; title: string }

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];
const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const SAMPLE_JSON = `[
  { "name": "John Doe", "rating": 5, "comment": "Amazing product!" },
  { "name": "Jane Smith", "rating": 4, "comment": "Very helpful, highly recommend." }
]`;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number } | null>(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/reviews').then(({ data }) => setReviews(data)).finally(() => setIsLoading(false));
  }, []);

  // Load products when import box opens
  useEffect(() => {
    if (showImport && !products.length) {
      apiClient.get('/products', { params: { limit: 100 } }).then(({ data }) => {
        setProducts((data.products || []).map((p: any) => ({ id: p.id, title: p.title })));
      });
    }
  }, [showImport, products.length]);

  const filtered = useMemo(() => reviews.filter(r => {
    const q = search.toLowerCase();
    const name = r.guestName || r.user.name;
    const matchSearch = name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q) || r.product.title.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
    const matchTab = tab === 'all' || r.status === tab;
    return matchSearch && matchTab;
  }), [reviews, search, tab]);

  const counts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }), [reviews]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActionId(id);
    try {
      await apiClient.patch(`/admin/reviews/${id}`, { status: action });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    } finally { setActionId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    setActionId(id);
    try {
      await apiClient.delete(`/admin/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } finally { setActionId(null); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJsonText(ev.target?.result as string || '');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    setImportError('');
    setImportResult(null);

    if (!selectedProduct) { setImportError('Select a product'); return; }

    let parsed: any[];
    try {
      parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      setImportError('Invalid JSON. Must be an array of objects.'); return;
    }

    if (!parsed.length) { setImportError('JSON array is empty'); return; }

    setImporting(true);
    try {
      const { data } = await apiClient.post('/admin/reviews', { productId: selectedProduct, reviews: parsed });
      setImportResult(data);
      setJsonText('');
      // Refresh reviews list
      const { data: fresh } = await apiClient.get('/admin/reviews');
      setReviews(fresh);
    } catch (err: any) {
      setImportError(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Reviews <span className="text-gray-400 font-normal text-base">({filtered.length})</span></h1>
          {counts.pending > 0 && <p className="text-xs text-amber-600 mt-0.5 font-medium">{counts.pending} pending review{counts.pending !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImport(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${showImport ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FileJson className="h-3.5 w-3.5" /> Import JSON
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
          </div>
        </div>
      </div>

      {/* JSON Import Box */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-indigo-500" /> Import Reviews from JSON
                </h3>
                <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>

              {/* Product select */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Product</label>
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                  <option value="">— Choose product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              {/* JSON input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">JSON Data</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const tpl = JSON.stringify([{ name: "Your Name", rating: 5, comment: "Write your review here", date: "2026-04-25", dateType: "exact" }], null, 2);
                        navigator.clipboard.writeText(tpl);
                        alert('JSON format copied!');
                      }}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                    >
                      <Copy className="h-3 w-3" /> Copy JSON Format
                    </button>
                    <label className="flex items-center gap-1 text-xs text-indigo-600 hover:underline cursor-pointer">
                      <Upload className="h-3 w-3" /> Upload .json file
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <textarea
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  placeholder={SAMPLE_JSON}
                  rows={6}
                  className="w-full px-3 py-2.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50 resize-y"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Format: <code className="bg-gray-100 px-1 rounded">[{`{ "name": "...", "rating": 5, "comment": "..." }`}]</code>
                </p>
              </div>

              {/* Feedback */}
              {importError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0" /> {importError}
                </div>
              )}
              {importResult && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> Imported {importResult.imported} reviews. Product now has {importResult.total} total reviews.
                </div>
              )}

              {/* Import button */}
              <button onClick={handleImport} disabled={importing || !jsonText.trim() || !selectedProduct}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {importing ? (
                  <><span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Import Reviews</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t} ({counts[t as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No reviews found.</p>
          </div>
        ) : filtered.map(r => {
          const displayName = r.guestName || r.user.name;
          const isImported = !!r.guestName;
          return (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <img src={r.product.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.product.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${statusStyles[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.status}
                        </span>
                        {isImported && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-600">
                            Imported
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{r.comment}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-medium text-gray-600">{displayName}</span>
                      {!isImported && <><span>·</span><span>{r.user.email}</span></>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {r.status !== 'approved' && (
                        <button onClick={() => handleAction(r.id, 'approved')} disabled={actionId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => handleAction(r.id, 'rejected')} disabled={actionId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      <button onClick={() => handleDelete(r.id)} disabled={actionId === r.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
