'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

/**
 * Captures traffic attribution (fbclid, ttclid, utm_source, referrer)
 * on the first page load of a session. Must be placed in the root layout.
 */
export function AttributionTracker() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
