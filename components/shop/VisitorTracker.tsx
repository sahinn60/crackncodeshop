'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const countryRef = useRef('');

  useEffect(() => {
    // Fetch country once
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { countryRef.current = d.country_name || ''; })
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
