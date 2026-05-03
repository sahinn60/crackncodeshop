'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const countryRef = useRef('');

  useEffect(() => {
    // Use server-side visitor API to get country (avoids CORS issues with third-party APIs)
    fetch('/api/visitors/country')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.country) countryRef.current = d.country; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const send = () => {
      fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage: pathname, country: countryRef.current }),
      }).catch(() => {});
    };

    send();
    const interval = setInterval(send, 30_000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
