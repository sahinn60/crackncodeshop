import { create } from 'zustand';
import { apiClient } from '@/lib/axios';

export interface BannerImage {
  url: string;
  link: string;
  alt: string;
}

export interface SiteSettings {
  siteName: string;
  tagline?: string;
  seoDescription?: string;
  logoUrl: string;
  faviconUrl: string;
  heroBannerUrl: string;
  bannerImages: BannerImage[];
  facebookPixelId?: string;
  tiktokPixelId?: string;
  tawktoScriptUrl?: string;
  footerLogoUrl?: string;
  footerDescription?: string;
  socialLinks: { twitter?: string; facebook?: string; instagram?: string };
  whatsappNumber?: string;
  youtubeChannel?: string;
}

interface SettingsState {
  settings: SiteSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<any>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: true,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get('/settings');
      set({ settings: data, isLoading: false });
    } catch {
      set({ settings: { siteName: 'CrackncodePremium', logoUrl: '', faviconUrl: '', heroBannerUrl: '', bannerImages: [], socialLinks: {} }, isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const { data } = await apiClient.put('/settings', newSettings);
    // Use the server response directly — this is the source of truth
    set({ settings: data });
    return data;
  },
}));
