import { create } from 'zustand';
import { apiClient } from '@/lib/axios';

export interface BannerImage {
  url: string;
  link: string;
  alt: string;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  heroBannerUrl: string;
  bannerImages: BannerImage[];
  facebookPixelId?: string;
  tiktokPixelId?: string;
  tawktoScriptUrl?: string;
  socialLinks: { twitter?: string; facebook?: string; instagram?: string };
}

interface SettingsState {
  settings: SiteSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
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
      set({ settings: { siteName: 'Crackncode', logoUrl: '', faviconUrl: '', heroBannerUrl: '', bannerImages: [], socialLinks: {} }, isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const { data } = await apiClient.put('/settings', newSettings);
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...newSettings } : null,
    }));
    return data;
  },
}));
