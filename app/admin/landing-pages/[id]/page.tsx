'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  ArrowLeft, Save, GripVertical, ChevronDown, ChevronUp,
  Eye, EyeOff, Plus, Trash2, X,
} from 'lucide-react';

interface Section {
  id: string;
  type: string;
  isActive: boolean;
  content: any;
  settings: { animationType: string; delay: number; duration: number };
}

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  productId: string | null;
  sections: Section[];
  isPublished: boolean;
}

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/admin/landing-pages/${id}`),
      apiClient.get('/products', { params: { limit: 100 } }),
    ]).then(([pageRes, prodRes]) => {
      setPage(pageRes.data);
      setProducts(prodRes.data.products || []);
    }).catch(() => router.push('/admin/landing-pages'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const save = async () => {
    if (!page || saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiClient.put(`/admin/landing-pages/${id}`, {
        title: page.title,
        slug: page.slug,
        productId: page.productId,
        sections: page.sections,
        isPublished: page.isPublished,
      });
      setPage(res.data);
      setMsg({ type: 'ok', text: 'Saved successfully!' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const updateSection = (sectionId: string, updater: (s: Section) => Section) => {
    setPage(p => p ? { ...p, sections: p.sections.map(s => s.id === sectionId ? updater(s) : s) } : p);
  };

  const updateContent = (sectionId: string, content: any) => {
    updateSection(sectionId, s => ({ ...s, content: { ...s.content, ...content } }));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setPage(p => {
      if (!p) return p;
      const arr = [...p.sections];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...p, sections: arr };
    });
  };

  const removeSection = (sectionId: string) => {
    setPage(p => p ? { ...p, sections: p.sections.filter(s => s.id !== sectionId) } : p);
  };

  const addSection = (type: string) => {
    const defaults: Record<string, any> = {
      hero: { headline: '', subheadline: '', buttonText: 'Buy Now', buttonLink: '/checkout', images: [] },
      video: { youtubeUrl: '' },
      features: { title: 'Features', items: [] },
      reviews: { title: 'Reviews', items: [] },
      pricing: { title: 'Pricing', price: 0, oldPrice: 0, features: [], countdown: { enabled: false, isDaily: true, endTime: '' } },
      faq: { title: 'FAQ', items: [] },
      cta: { headline: '', subheadline: '', buttonText: 'Buy Now', buttonLink: '/checkout', secondaryButtonText: '', secondaryButtonLink: '' },
    };
    const section: Section = {
      id: crypto.randomUUID(),
      type,
      isActive: true,
      content: defaults[type] || {},
      settings: { animationType: 'fade', delay: 0, duration: 0.6 },
    };
    setPage(p => p ? { ...p, sections: [...p.sections, section] } : p);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!page) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/admin/landing-pages')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm font-medium ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
          <Button type="button" onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Page Settings */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Page Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={page.title} onChange={e => setPage({ ...page, title: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={page.slug} onChange={e => setPage({ ...page, slug: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select value={page.productId || ''} onChange={e => setPage({ ...page, productId: e.target.value || null })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="">No product linked</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={page.isPublished} onChange={e => setPage({ ...page, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Published</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <h2 className="font-bold text-gray-900">Sections</h2>
        {page.sections.map((section, idx) => {
          const isExpanded = expandedSection === section.id;
          return (
            <div key={section.id} className={`bg-white rounded-xl border transition-all ${!section.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" onClick={() => setExpandedSection(isExpanded ? null : section.id)}>
                <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} className="p-0.5 text-gray-400 hover:text-gray-600"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} className="p-0.5 text-gray-400 hover:text-gray-600"><ChevronDown className="h-3.5 w-3.5" /></button>
                </div>
                <span className="text-xs font-semibold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{section.type}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{section.content.headline || section.content.title || section.content.youtubeUrl || ''}</span>
                <button onClick={e => { e.stopPropagation(); updateSection(section.id, s => ({ ...s, isActive: !s.isActive })); }}
                  className="p-1 text-gray-400 hover:text-gray-600" title={section.isActive ? 'Hide' : 'Show'}>
                  {section.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={e => { e.stopPropagation(); removeSection(section.id); }}
                  className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t space-y-3 pt-3">
                  <SectionEditor section={section} updateContent={(c: any) => updateContent(section.id, c)}
                    updateSection={(updater: (s: Section) => Section) => updateSection(section.id, updater)} />
                </div>
              )}
            </div>
          );
        })}

        {/* Add Section */}
        <div className="flex flex-wrap gap-2 pt-2">
          {['hero', 'video', 'features', 'reviews', 'pricing', 'faq', 'cta'].map(type => (
            <Button key={type} size="sm" variant="outline" onClick={() => addSection(type)} className="gap-1 text-xs capitalize">
              <Plus className="h-3 w-3" /> {type}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({ section, updateContent, updateSection }: {
  section: Section;
  updateContent: (c: any) => void;
  updateSection: (updater: (s: Section) => Section) => void;
}) {
  const c = section.content;

  const input = (label: string, value: string, key: string, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => updateContent({ [key]: type === 'number' ? +e.target.value : e.target.value })}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
    </div>
  );

  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          {input('Headline', c.headline, 'headline')}
          {input('Subheadline', c.subheadline, 'subheadline')}
          <div className="grid grid-cols-2 gap-3">
            {input('Button Text', c.buttonText, 'buttonText')}
            {input('Button Link', c.buttonLink, 'buttonLink')}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Images</label>
            <div className="flex flex-wrap gap-2">
              {(c.images || []).map((img: string, i: number) => (
                <div key={i} className="relative group">
                  <img src={img} className="h-20 w-20 object-cover rounded-lg border" />
                  <button onClick={() => updateContent({ images: c.images.filter((_: any, j: number) => j !== i) })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <ImageUpload value="" onChange={url => url && updateContent({ images: [...(c.images || []), url] })}
                previewClass="h-20 w-20 rounded-lg" folder="landing-pages" />
            </div>
          </div>
        </div>
      );

    case 'video':
      return input('YouTube URL', c.youtubeUrl, 'youtubeUrl');

    case 'features':
      return (
        <div className="space-y-3">
          {input('Section Title', c.title, 'title')}
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="flex gap-2 items-start">
              <input value={item.icon} onChange={e => {
                const items = [...c.items]; items[i] = { ...items[i], icon: e.target.value };
                updateContent({ items });
              }} className="w-12 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center" placeholder="🔥" />
              <input value={item.title} onChange={e => {
                const items = [...c.items]; items[i] = { ...items[i], title: e.target.value };
                updateContent({ items });
              }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Title" />
              <input value={item.description} onChange={e => {
                const items = [...c.items]; items[i] = { ...items[i], description: e.target.value };
                updateContent({ items });
              }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Description" />
              <button onClick={() => updateContent({ items: c.items.filter((_: any, j: number) => j !== i) })}
                className="p-2 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => updateContent({ items: [...(c.items || []), { icon: '⭐', title: '', description: '' }] })} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add Feature
          </Button>
        </div>
      );

    case 'reviews':
      return (
        <div className="space-y-3">
          {input('Section Title', c.title, 'title')}
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input value={item.name || ''} onChange={e => {
                  const items = [...c.items]; items[i] = { ...items[i], name: e.target.value };
                  updateContent({ items });
                }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Name" />
                <input type="number" min="1" max="5" value={item.rating || 5} onChange={e => {
                  const items = [...c.items]; items[i] = { ...items[i], rating: +e.target.value };
                  updateContent({ items });
                }} className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <button onClick={() => updateContent({ items: c.items.filter((_: any, j: number) => j !== i) })}
                  className="p-2 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={item.text || ''} onChange={e => {
                const items = [...c.items]; items[i] = { ...items[i], text: e.target.value };
                updateContent({ items });
              }} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Review text" />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => updateContent({ items: [...(c.items || []), { name: '', text: '', rating: 5 }] })} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add Review
          </Button>
        </div>
      );

    case 'pricing':
      return (
        <div className="space-y-3">
          {input('Section Title', c.title, 'title')}
          <div className="grid grid-cols-2 gap-3">
            {input('Price', c.price, 'price', 'number')}
            {input('Old Price', c.oldPrice, 'oldPrice', 'number')}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Features (one per line)</label>
            <textarea value={(c.features || []).join('\n')} onChange={e => updateContent({ features: e.target.value.split('\n') })}
              rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={c.countdown?.enabled || false}
                onChange={e => updateContent({ countdown: { ...c.countdown, enabled: e.target.checked } })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600" /> Countdown
            </label>
            {c.countdown?.enabled && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={c.countdown?.isDaily || false}
                  onChange={e => updateContent({ countdown: { ...c.countdown, isDaily: e.target.checked } })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600" /> Daily Reset
              </label>
            )}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-3">
          {input('Section Title', c.title, 'title')}
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input value={item.question} onChange={e => {
                  const items = [...c.items]; items[i] = { ...items[i], question: e.target.value };
                  updateContent({ items });
                }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Question" />
                <button onClick={() => updateContent({ items: c.items.filter((_: any, j: number) => j !== i) })}
                  className="p-2 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={item.answer} onChange={e => {
                const items = [...c.items]; items[i] = { ...items[i], answer: e.target.value };
                updateContent({ items });
              }} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Answer" />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => updateContent({ items: [...(c.items || []), { question: '', answer: '' }] })} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add FAQ
          </Button>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-3">
          {input('Headline', c.headline, 'headline')}
          {input('Subheadline', c.subheadline, 'subheadline')}
          <div className="grid grid-cols-2 gap-3">
            {input('Button Text', c.buttonText, 'buttonText')}
            {input('Button Link', c.buttonLink, 'buttonLink')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {input('Secondary Button', c.secondaryButtonText, 'secondaryButtonText')}
            {input('Secondary Link', c.secondaryButtonLink, 'secondaryButtonLink')}
          </div>
        </div>
      );

    default:
      return <p className="text-sm text-gray-400">Unknown section type: {section.type}</p>;
  }
}
