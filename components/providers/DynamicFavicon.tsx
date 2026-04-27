'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function DynamicFavicon() {
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    const url = settings?.faviconUrl || settings?.logoUrl;
    if (!url) return;

    const href = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [settings?.faviconUrl, settings?.logoUrl]);

  return null;
}
