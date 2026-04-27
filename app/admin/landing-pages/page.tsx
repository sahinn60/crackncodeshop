'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Pencil, FileText, ToggleLeft, ToggleRight, ExternalLink, Copy } from 'lucide-react';
import Link from 'next/link';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  productId: string | null;
  sections: any[];
  isPublished: boolean;
  createdAt: string;
}

export default function AdminLandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '' });
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  const load = () => {
    apiClient.get('/admin/landing-pages').then(({ data }) => setPages(data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    apiClient.get('/products', { params: { limit: 100 } }).then(({ data }) => setProducts(data.products || [])).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const defaultSections = [
      { id: crypto.randomUUID(), type: 'hero', isActive: true, content: { headline: 'Your Amazing Product', subheadline: 'The best solution for your needs', buttonText: 'Buy Now', buttonLink: '/checkout', images: [] }, settings: { animationType: 'fade', delay: 0, duration: 0.6 } },
      { id: crypto.randomUUID(), type: 'video', isActive: false, content: { youtubeUrl: '' }, settings: { animationType: 'fade', delay: 0.1, duration: 0.6 } },
      { id: crypto.randomUUID(), type: 'features', isActive: true, content: { title: 'Why Choose Us', items: [{ icon: '⚡', title: 'Fast', description: 'Lightning fast delivery' }, { icon: '🛡️', title: 'Secure', description: '100% secure checkout' }, { icon: '💎', title: 'Premium', description: 'Top quality products' }] }, settings: { animationType: 'slide', delay: 0.1, duration: 0.6 } },
      { id: crypto.randomUUID(), type: 'reviews', isActive: true, content: { title: 'What Our Customers Say', items: [] }, settings: { animationType: 'fade', delay: 0.1, duration: 0.6 } },
      { id: crypto.randomUUID(), type: 'pricing', isActive: true, content: { title: 'Special Offer', price: 0, oldPrice: 0, features: ['Instant delivery', 'Lifetime access', 'Free updates'], countdown: { enabled: true, isDaily: true, endTime: '' } }, settings: { animationType: 'zoom', delay: 0.1, duration: 0.6 } },
      { id: crypto.randomUUID(), type: 'faq', isActive: true, content: { title: 'Frequently Asked Questions', items: [{ question: 'How do I get my product?', answer: 'You will receive instant access after payment.' }] }, settings: { animationType: 'slide', delay: 0.1, duration: 0.6 } },
      { id: crypto.randomUUID(), type: 'cta', isActive: true, content: { headline: "Don't Miss Out!", subheadline: 'Limited time offer', buttonText: 'Get It Now', buttonLink: '/checkout', secondaryButtonText: '', secondaryButtonLink: '' }, settings: { animationType: 'zoom', delay: 0, duration: 0.6 } },
    ];

    try {
      await apiClient.post('/admin/landing-pages', {
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        productId: selectedProduct || null,
        sections: defaultSections,
      });
      setShowCreate(false);
      setForm({ title: '', slug: '' });
      setSelectedProduct('');
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this landing page?')) return;
    await apiClient.delete(`/admin/landing-pages/${id}`);
    load();
  };

  const togglePublish = async (page: LandingPage) => {
    await apiClient.put(`/admin/landing-pages/${page.id}`, { isPublished: !page.isPublished });
    load();
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" /> Landing Pages
          </h1>
          <p className="text-sm text-gray-500 mt-1">Build high-converting sales pages with multimedia support</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> New Page
        </Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create Landing Page</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Premium UI Kit Sale" className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">/p/<span className="text-gray-700">{form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'your-slug'}</span></div>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated from title" className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Product (optional)</label>
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">No product linked</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pages List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No landing pages yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <div key={page.id} className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${page.isPublished ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 truncate">{page.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">/p/{page.slug}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  <button onClick={() => togglePublish(page)} title={page.isPublished ? 'Unpublish' : 'Publish'}>
                    {page.isPublished ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </button>
                  <button onClick={() => copyUrl(page.slug)} className="text-gray-400 hover:text-gray-600" title="Copy URL">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded-full font-medium ${page.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {page.isPublished ? 'Published' : 'Draft'}
                </span>
                <span>{page.sections.length} sections</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/landing-pages/${page.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                {page.isPublished && (
                  <Link href={`/p/${page.slug}`} target="_blank">
                    <Button size="sm" variant="ghost" className="gap-1 text-xs text-indigo-600">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(page.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
