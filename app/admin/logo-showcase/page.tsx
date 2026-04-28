'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/axios';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { LogoShowcasePreview, LOGO_ANIMS, TITLE_EFFECTS } from '@/components/shop/LogoShowcase';
import type { LogoShowcaseConfig, LogoItem } from '@/components/shop/LogoShowcase';
import {
  Save, Plus, Trash2, GripVertical, Eye, EyeOff, Pencil, Check,
} from 'lucide-react';

const DEFAULT: LogoShowcaseConfig = {
  title: 'Trusted by 5,000+ creators',
  subtitle: 'Used by professionals worldwide',
  titleEffects: ['glow-text'],
  logoAnimations: ['scroll'],
  speed: 'slow',
  pauseOnHover: true,
  logos: [],
};

const LOGO_ANIM_LABELS: Record<string, string> = {
  scroll: '↔ Scroll',
  float: '↕ Float',
  scale: '⊕ Scale',
  glow: '✦ Glow',
  fade: '◐ Fade',
  blur: '◉ Blur',
  tilt: '↻ Tilt',
};

const TITLE_EFFECT_LABELS: Record<string, string> = {
  'slide-left': '← Slide Left',
  'fade-up': '↑ Fade Up',
  'glow-text': '✦ Glow',
  'gradient-shift': '🌈 Gradient',
  'blur-reveal': '◉ Blur Reveal',
  'scale-in': '⊕ Scale In',
  'letter-stagger': 'Aa Stagger',
};

function genId() { return Math.random().toString(36).slice(2, 10); }

function ToggleChips({ label, options, selected, onChange }: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter(s => s !== val)
        : [...selected, val]
    );
  };

  const labelMap = label === 'Logo Animations' ? LOGO_ANIM_LABELS : TITLE_EFFECT_LABELS;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                active
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {labelMap[opt] || opt}
            </button>
          );
        })}
      </div>
      {selected.length > 1 && (
        <p className="text-[10px] text-indigo-500 mt-1.5">
          Combined: {selected.map(s => (labelMap[s] || s).replace(/^[^\s]+\s/, '')).join(' + ')}
        </p>
      )}
    </div>
  );
}

export default function LogoShowcaseAdmin() {
  const [config, setConfig] = useState<LogoShowcaseConfig>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => {
    apiClient.get('/logo-showcase').then(({ data }) => {
      setConfig({ ...DEFAULT, ...data });
    }).catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<LogoShowcaseConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const updateLogo = useCallback((id: string, patch: Partial<LogoItem>) => {
    setConfig(prev => ({
      ...prev,
      logos: prev.logos.map(l => l.id === id ? { ...l, ...patch } : l),
    }));
  }, []);

  const addLogo = () => {
    const newLogo: LogoItem = { id: genId(), image: '', alt: '', link: '', active: true };
    update({ logos: [...config.logos, newLogo] });
    setEditingId(newLogo.id);
  };

  const removeLogo = (id: string) => {
    update({ logos: config.logos.filter(l => l.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOver.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const logos = [...config.logos];
    const [moved] = logos.splice(dragItem.current, 1);
    logos.splice(dragOver.current, 0, moved);
    update({ logos });
    dragItem.current = null;
    dragOver.current = null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/logo-showcase', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Logo Showcase</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the trusted-by section. Combine multiple animations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">
          ✓ Logo showcase saved successfully!
        </div>
      )}

      {/* Settings */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Display Settings</h3>
        </div>
        <div className="p-5 space-y-5">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={config.title}
                onChange={e => update({ title: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Trusted by 5,000+ creators"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={e => update({ subtitle: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Used by professionals worldwide"
              />
            </div>
          </div>

          {/* Title Effects — multi-select */}
          <ToggleChips
            label="Title Effects (combine multiple)"
            options={TITLE_EFFECTS}
            selected={config.titleEffects}
            onChange={v => update({ titleEffects: v })}
          />

          {/* Logo Animations — multi-select */}
          <ToggleChips
            label="Logo Animations (combine multiple)"
            options={LOGO_ANIMS}
            selected={config.logoAnimations}
            onChange={v => update({ logoAnimations: v })}
          />

          {/* Speed + Pause */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Speed</label>
              <select
                value={config.speed}
                onChange={e => update({ speed: e.target.value as LogoShowcaseConfig['speed'] })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pause on Hover</label>
              <button
                onClick={() => update({ pauseOnHover: !config.pauseOnHover })}
                className={`w-full rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                  config.pauseOnHover
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                {config.pauseOnHover ? '✓ Enabled' : '✗ Disabled'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Management */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Logos ({config.logos.length})</h3>
            <p className="text-xs text-gray-400 mt-0.5">Drag to reorder. Click edit to modify.</p>
          </div>
          <Button onClick={addLogo} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Logo
          </Button>
        </div>

        {config.logos.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No logos added yet. Click &quot;Add Logo&quot; to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {config.logos.map((logo, index) => {
              const isEditing = editingId === logo.id;
              return (
                <div
                  key={logo.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={`p-4 transition-colors ${isEditing ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-300 cursor-grab flex-shrink-0" />
                    <div className="h-12 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logo.image ? (
                        <img src={logo.image} alt={logo.alt} className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-gray-300">No img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{logo.alt || 'Untitled'}</p>
                      {logo.link && <p className="text-xs text-gray-400 truncate">{logo.link}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateLogo(logo.id, { active: !logo.active })}
                        className={`p-1.5 rounded-lg transition-colors ${logo.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={logo.active ? 'Active' : 'Inactive'}
                      >
                        {logo.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditingId(isEditing ? null : logo.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                      >
                        {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => removeLogo(logo.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 ml-7 space-y-3 border-t border-gray-100 pt-4">
                      <ImageUpload
                        value={logo.image}
                        onChange={url => updateLogo(logo.id, { image: url })}
                        label="Logo Image"
                        folder="crackncode/logos"
                        previewClass="h-16 w-auto rounded-lg"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                          <input
                            type="text"
                            value={logo.alt}
                            onChange={e => updateLogo(logo.id, { alt: e.target.value })}
                            placeholder="Company name"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Link (optional)</label>
                          <input
                            type="text"
                            value={logo.link || ''}
                            onChange={e => updateLogo(logo.id, { link: e.target.value })}
                            placeholder="https://..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-500" /> Live Preview
          </h3>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <LogoShowcasePreview config={config} />
            {config.logos.filter(l => l.active).length === 0 && (
              <div className="bg-slate-900 text-center py-12 text-sm text-gray-500">
                Add active logos to see the preview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
