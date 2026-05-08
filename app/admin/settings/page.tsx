'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore, SiteSettings, BannerImage } from '@/store/useSettingsStore';
import { Button } from '@/components/ui/Button';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function AdminSettingsPage() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const [formData, setFormData] = useState<SiteSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (settings) setFormData(settings); }, [settings]);

  if (!formData) return <div className="p-8 text-gray-500">Loading settings...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const key = name.replace('social_', '');
      setFormData(prev => ({ ...prev!, socialLinks: { ...prev!.socialLinks, [key]: value } }));
    } else {
      setFormData(prev => ({ ...prev!, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await updateSettings(formData!);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || err?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addBanner = () => {
    setFormData(prev => ({
      ...prev!,
      bannerImages: [...(prev!.bannerImages || []), { url: '', link: '', alt: '' }],
    }));
  };

  const updateBanner = (index: number, field: keyof BannerImage, value: string) => {
    setFormData(prev => ({
      ...prev!,
      bannerImages: prev!.bannerImages.map((b, i) => i === index ? { ...b, [field]: value } : b),
    }));
  };

  const removeBanner = (index: number) => {
    setFormData(prev => ({
      ...prev!,
      bannerImages: prev!.bannerImages.filter((_, i) => i !== index),
    }));
  };

  const field = (label: string, name: string, value: string, placeholder = '') => (
    <div className="sm:col-span-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1">
        <input type="text" name={name} value={value} onChange={handleChange} placeholder={placeholder} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Site Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your platform's global configuration.</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 sm:rounded-xl overflow-hidden">
        <div className="px-4 py-5 sm:p-6 space-y-8">
          {/* General */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">General Information</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {field('Site Name', 'siteName', formData.siteName)}
              {field('Tagline', 'tagline', formData.tagline || '', 'Digital Solutions at Your Fingertips')}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">SEO Description</label>
                <div className="mt-1">
                  <textarea
                    name="seoDescription"
                    value={formData.seoDescription || ''}
                    onChange={e => setFormData(prev => ({ ...prev!, seoDescription: e.target.value }))}
                    rows={2}
                    placeholder="Custom SEO description (leave empty to use tagline)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Used in search results and social previews. Leave empty to auto-generate from tagline.</p>
              </div>
              <div className="sm:col-span-6">
                <ImageUpload
                  value={formData.logoUrl}
                  onChange={url => setFormData(prev => ({ ...prev!, logoUrl: url }))}
                  label="Logo"
                  folder="crackncode/branding"
                  previewClass="h-16 w-auto rounded-lg"
                />
              </div>
              <div className="sm:col-span-6">
                <ImageUpload
                  value={formData.faviconUrl || ''}
                  onChange={url => setFormData(prev => ({ ...prev!, faviconUrl: url }))}
                  label="Favicon"
                  hint="Browser tab icon. Recommended: 32×32 or 64×64px PNG/ICO."
                  folder="crackncode/branding"
                  previewClass="h-10 w-10 rounded"
                />
              </div>
              <div className="sm:col-span-6">
                <ImageUpload
                  value={formData.heroBannerUrl || ''}
                  onChange={url => setFormData(prev => ({ ...prev!, heroBannerUrl: url }))}
                  label="Hero Banner Image"
                  hint="Displayed as the hero banner on the homepage. Recommended size: 1200×600px."
                  folder="crackncode/branding"
                  previewClass="h-40 w-full rounded-xl"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Banner Images */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Banner Images</h3>
                <p className="text-sm text-gray-500 mt-1">Add promotional banners displayed across the site.</p>
              </div>
              <Button onClick={addBanner} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Banner
              </Button>
            </div>
            {(formData.bannerImages || []).length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-6 text-center">No banners added yet.</p>
            ) : (
              <div className="space-y-4">
                {formData.bannerImages.map((banner, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative group">
                    <button onClick={() => removeBanner(i)} className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <GripVertical className="h-3.5 w-3.5" /> Banner #{i + 1}
                    </div>
                    <ImageUpload
                      value={banner.url}
                      onChange={url => updateBanner(i, 'url', url)}
                      label="Image"
                      folder="crackncode/banners"
                      previewClass="h-32 w-full rounded-lg"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                        <input type="text" value={banner.link} onChange={e => updateBanner(i, 'link', e.target.value)} placeholder="https://..." className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                        <input type="text" value={banner.alt} onChange={e => updateBanner(i, 'alt', e.target.value)} placeholder="Banner description" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Footer */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Footer</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <ImageUpload
                  value={formData.footerLogoUrl || ''}
                  onChange={url => setFormData(prev => ({ ...prev!, footerLogoUrl: url }))}
                  label="Footer Logo"
                  hint="Displayed in the footer. Leave empty to use the main site logo."
                  folder="crackncode/branding"
                  previewClass="h-12 w-auto rounded-lg"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Footer Description</label>
                <div className="mt-1">
                  <textarea
                    name="footerDescription"
                    value={formData.footerDescription || ''}
                    onChange={e => setFormData(prev => ({ ...prev!, footerDescription: e.target.value }))}
                    rows={3}
                    placeholder="Your premium destination for high-quality digital products..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Short description shown below the footer logo.</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Tracking */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Tracking & Analytics</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {field('Facebook Pixel ID', 'facebookPixelId', formData.facebookPixelId || '', '123456789012345')}
              {field('TikTok Pixel ID', 'tiktokPixelId', formData.tiktokPixelId || '', 'C123ABCXYZ')}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Support */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Customer Support</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {field('WhatsApp Number', 'whatsappNumber', formData.whatsappNumber || '', '+8801XXXXXXXXX')}
              {field('YouTube Channel URL', 'youtubeChannel', formData.youtubeChannel || '', 'https://youtube.com/@yourchannel')}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Tawk.to Script URL</label>
                <div className="mt-1">
                  <input type="text" name="tawktoScriptUrl" value={formData.tawktoScriptUrl || ''} onChange={handleChange} placeholder="https://embed.tawk.to/YOUR_ID/default" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Social */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {field('Twitter URL', 'social_twitter', formData.socialLinks?.twitter || '')}
              {field('Facebook URL', 'social_facebook', formData.socialLinks?.facebook || '')}
              {field('Instagram URL', 'social_instagram', formData.socialLinks?.instagram || '')}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 flex items-center justify-end gap-4 sm:px-6">
          {saveError && <span className="text-sm text-red-600 font-medium">{saveError}</span>}
          {saved && <span className="text-sm text-green-600 font-medium">✓ Settings saved!</span>}
          <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
