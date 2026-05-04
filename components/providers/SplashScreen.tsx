'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '@/store/useSettingsStore';

function SplashOverlay() {
  const { settings, isLoading } = useSettingsStore();
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    [30, 60, 80, 95].forEach((t, i) => setTimeout(() => setProgress(t), [100, 400, 700, 1000][i]));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    setProgress(100);
    const t = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => { setGone(true); sessionStorage.setItem('splash-shown', '1'); }, 500);
    }, 600);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (gone) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-dark transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col items-center gap-8">
        {/* Logo with pulse ring animation */}
        <div className="animate-[fadeInUp_0.6s_ease_forwards] opacity-0 relative" style={{ animationDelay: '0.1s' }}>
          {/* Outer glow rings */}
          <div className="absolute inset-0 -m-6 rounded-full animate-[splashPing_2s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, rgba(255,45,45,0.15) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 -m-4 rounded-full animate-[splashPing_2s_ease-in-out_0.5s_infinite]" style={{ background: 'radial-gradient(circle, rgba(255,45,45,0.1) 0%, transparent 70%)' }} />

          {/* Logo container with subtle breathing */}
          <div className="relative animate-[splashBreathe_3s_ease-in-out_infinite]">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings?.siteName || 'Loading'}
                className="h-16 sm:h-20 w-auto max-w-[220px] object-contain drop-shadow-[0_0_20px_rgba(255,45,45,0.3)]"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="text-white">Crackncode</span>{' '}
                <span className="text-primary" style={{ textShadow: '0 0 20px rgba(255,45,45,0.4)' }}>Premium</span>
              </h1>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 sm:w-56 animate-[fadeInUp_0.6s_ease_forwards] opacity-0" style={{ animationDelay: '0.3s' }}>
          <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FF2D2D, #ff6b6b, #FF2D2D)',
                boxShadow: '0 0 8px rgba(255,45,45,0.5)',
              }}
            />
          </div>
          <p className="text-[10px] text-white/25 text-center mt-3 font-medium tracking-wider uppercase">Loading</p>
        </div>
      </div>
    </div>
  );
}

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('splash-shown')) setShowSplash(true);
  }, []);

  return (
    <>
      {children}
      {showSplash && createPortal(<SplashOverlay />, document.body)}
    </>
  );
}
