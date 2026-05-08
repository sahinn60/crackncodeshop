'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const countryRef = useRef('');
  const sent = useRef(false);

  useEffect(() => {
    // Delay tracking to not interfere with page load
    const timeout = setTimeout(() => {
      fetch('/api/visitors/country')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.country) countryRef.current = d.country; })
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (sent.current) {
      // Subsequent navigations - send immediately
      fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage: pathname, country: countryRef.current }),
      }).catch(() => {});
    } else {
      // First load - delay to not block rendering
      const timeout = setTimeout(() => {
        sent.current = true;
        fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPage: pathname, country: countryRef.current }),
        }).catch(() => {});
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  return null;
}
