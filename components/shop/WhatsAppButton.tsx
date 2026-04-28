'use client';

import { useSettingsStore } from '@/store/useSettingsStore';

export function WhatsAppButton() {
  const number = useSettingsStore(s => s.settings?.whatsappNumber);
  if (!number) return null;

  const clean = number.replace(/[^0-9]/g, '');
  const href = `https://wa.me/${clean}?text=${encodeURIComponent('Hi, I need help!')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#25D366] shadow-lg shadow-green-500/30 flex items-center justify-center hover:scale-110 transition-transform"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 sm:h-7 sm:w-7 fill-white">
        <path d="M16.004 2.667A13.26 13.26 0 002.667 15.87a13.16 13.16 0 001.803 6.664L2.667 29.333l7.013-1.84A13.28 13.28 0 0016.004 29.2 13.27 13.27 0 0029.333 15.87 13.27 13.27 0 0016.004 2.667zm0 24.266a11 11 0 01-5.613-1.536l-.403-.24-4.176 1.096 1.115-4.076-.263-.418a10.88 10.88 0 01-1.677-5.89A11.01 11.01 0 0116.004 4.934 11.01 11.01 0 0127.066 15.87 11.01 11.01 0 0116.004 26.933zm6.037-8.24c-.331-.166-1.96-.967-2.264-1.078-.304-.11-.525-.166-.746.166s-.856 1.078-1.05 1.3c-.193.22-.387.248-.718.083a9.06 9.06 0 01-2.664-1.644 9.99 9.99 0 01-1.843-2.293c-.193-.331-.02-.51.145-.675.15-.148.331-.387.497-.58.166-.193.22-.331.331-.553.11-.22.055-.414-.028-.58-.083-.166-.746-1.798-1.022-2.462-.27-.647-.543-.56-.746-.57l-.636-.01a1.22 1.22 0 00-.884.414c-.304.331-1.16 1.134-1.16 2.766s1.188 3.208 1.354 3.428c.166.22 2.34 3.57 5.668 5.006.792.342 1.41.546 1.892.699.795.252 1.518.217 2.09.131.637-.095 1.96-.801 2.237-1.575.276-.773.276-1.436.193-1.575-.083-.138-.304-.22-.636-.387z" />
      </svg>
    </a>
  );
}
