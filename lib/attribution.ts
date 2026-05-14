/**
 * Attribution Tracking Utility
 * 
 * Detects traffic source on landing and persists for the session.
 * Used to fire purchase pixels ONLY for attributed traffic sources.
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

  const fbclid = params.get('fbclid') || undefined;
  const ttclid = params.get('ttclid') || undefined;
  const gclid = params.get('gclid') || undefined;
  const utm_source = params.get('utm_source') || undefined;
  const utm_medium = params.get('utm_medium') || undefined;
  const utm_campaign = params.get('utm_campaign') || undefined;

  // Determine source with priority
  let source: TrafficSource = 'direct';

  if (fbclid || utm_source?.toLowerCase() === 'facebook' || utm_source?.toLowerCase() === 'fb' || utm_source?.toLowerCase() === 'meta') {
    source = 'facebook';
  } else if (ttclid || utm_source?.toLowerCase() === 'tiktok' || utm_source?.toLowerCase() === 'tt') {
    source = 'tiktok';
  } else if (gclid || utm_source?.toLowerCase() === 'google') {
    source = 'google';
  } else if (referrer) {
    const ref = referrer.toLowerCase();
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fbcdn.net') || ref.includes('l.facebook.com')) {
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
    // No params, no referrer = organic/direct
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
