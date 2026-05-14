/**
 * Attribution Tracking Utility
 * 
 * Detects traffic source on landing and persists for the session.
 * Used to fire purchase pixels ONLY for attributed traffic sources.
 * 
 * Supports:
 * - Clean short params: ?src=fb, ?src=tt, ?src=g
 * - Standard params: fbclid, ttclid, gclid
 * - UTM params: utm_source=facebook/tiktok/google
 * - Referrer detection
 * - Session persistence
 */

const STORAGE_KEY = 'traffic_attribution';

export type TrafficSource = 'facebook' | 'tiktok' | 'google' | 'organic' | 'direct' | 'other';

export interface Attribution {
  source: TrafficSource;
  fbclid?: string;
  ttclid?: string;
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landingPage?: string;
  timestamp: number;
}

// Short param mapping: ?src=fb → facebook
const SRC_MAP: Record<string, TrafficSource> = {
  fb: 'facebook',
  facebook: 'facebook',
  meta: 'facebook',
  ig: 'facebook', // Instagram (Meta)
  tt: 'tiktok',
  tiktok: 'tiktok',
  g: 'google',
  google: 'google',
};

/** Detect and store attribution on page load */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return { source: 'direct', timestamp: Date.now() };
  }

  // If already captured this session, return existing
  const existing = getAttribution();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || '';

  // Extract all tracking params
  const src = params.get('src') || undefined; // Short param: ?src=fb
  const fbclid = params.get('fbclid') || undefined;
  const ttclid = params.get('ttclid') || undefined;
  const gclid = params.get('gclid') || undefined;
  const utm_source = params.get('utm_source') || undefined;
  const utm_medium = params.get('utm_medium') || undefined;
  const utm_campaign = params.get('utm_campaign') || undefined;

  // Determine source with priority:
  // 1. Platform click IDs (most reliable)
  // 2. Short ?src= param
  // 3. utm_source
  // 4. Referrer
  let source: TrafficSource = 'direct';

  if (fbclid) {
    source = 'facebook';
  } else if (ttclid) {
    source = 'tiktok';
  } else if (gclid) {
    source = 'google';
  } else if (src && SRC_MAP[src.toLowerCase()]) {
    source = SRC_MAP[src.toLowerCase()];
  } else if (utm_source) {
    const us = utm_source.toLowerCase();
    if (us === 'facebook' || us === 'fb' || us === 'meta' || us === 'instagram' || us === 'ig') {
      source = 'facebook';
    } else if (us === 'tiktok' || us === 'tt') {
      source = 'tiktok';
    } else if (us === 'google') {
      source = 'google';
    } else {
      source = 'other';
    }
  } else if (referrer) {
    const ref = referrer.toLowerCase();
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fbcdn.net') || ref.includes('l.facebook.com') || ref.includes('instagram.com')) {
      source = 'facebook';
    } else if (ref.includes('tiktok.com')) {
      source = 'tiktok';
    } else if (ref.includes('google.com') || ref.includes('google.co')) {
      source = 'google';
    } else {
      source = 'other';
    }
  } else if (utm_source) {
    source = 'other';
  } else {
    source = 'direct';
  }

  const attribution: Attribution = {
    source,
    fbclid,
    ttclid,
    gclid,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer: referrer || undefined,
    landingPage: window.location.pathname,
    timestamp: Date.now(),
  };

  // Store in sessionStorage (persists for the session only)
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {}

  // Also store in cookie for cross-tab persistence (7 day expiry)
  try {
    document.cookie = `_attr=${encodeURIComponent(source)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } catch {}

  return attribution;
}

/** Get stored attribution (returns null if not captured yet) */
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Attribution;
  } catch {
    return null;
  }
}

/** Check if traffic is from Facebook */
export function isFromFacebook(): boolean {
  const attr = getAttribution();
  return attr?.source === 'facebook';
}

/** Check if traffic is from TikTok */
export function isFromTikTok(): boolean {
  const attr = getAttribution();
  return attr?.source === 'tiktok';
}

/** Check if traffic is from Google Ads */
export function isFromGoogle(): boolean {
  const attr = getAttribution();
  return attr?.source === 'google';
}

/** Check if traffic is paid (any ad platform) */
export function isPaidTraffic(): boolean {
  const attr = getAttribution();
  if (!attr) return false;
  return attr.source === 'facebook' || attr.source === 'tiktok' || attr.source === 'google';
}

/**
 * Generate a clean tracking URL
 * 
 * Usage:
 *   trackingUrl('/products/ethical-hacking', 'facebook')
 *   → /products/ethical-hacking?src=fb
 */
export function trackingUrl(path: string, platform: 'facebook' | 'tiktok' | 'google'): string {
  const shortCodes: Record<string, string> = {
    facebook: 'fb',
    tiktok: 'tt',
    google: 'g',
  };
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}src=${shortCodes[platform]}`;
}
