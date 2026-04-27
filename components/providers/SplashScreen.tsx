'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSettingsStore();
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Skip splash if already shown this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('splash-shown')) {
      setShow(false);
      return;
    }

    // Animate progress bar
    const steps = [
      { target: 30, delay: 100 },
      { target: 60, delay: 400 },
      { target: 80, delay: 700 },
      { target: 95, delay: 1000 },
    ];

    steps.forEach(({ target, delay }) => {
      setTimeout(() => setProgress(target), delay);
    });
  }, []);

  useEffect(() => {
    if (!show) return;
    if (isLoading) return;

    // Settings loaded — complete the bar and fade out
    setProgress(100);
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShow(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('splash-shown', '1');
        }
      }, 500);
    }, 600);

    return () => clearTimeout(timer);
  }, [isLoading, show]);

  if (!show) return <>{children}</>;

  return (
    <>
      {/* Splash overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo / Site name */}
          <div className="animate-[fadeInUp_0.6s_ease_forwards] opacity-0" style={{ animationDelay: '0.1s' }}>
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings?.siteName || 'Loading'}
                className="h-12 sm:h-16 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-dark">
                {settings?.siteName || 'Crackncode'}
                <span className="text-primary">.</span>
              </h1>
            )}
          </div>

          {/* Loading bar */}
          <div className="w-48 sm:w-56 animate-[fadeInUp_0.6s_ease_forwards] opacity-0" style={{ animationDelay: '0.3s' }}>
            <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-red-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-3 font-medium tracking-wider uppercase">
              Loading
            </p>
          </div>
        </div>
      </div>

      {/* Content hidden behind splash */}
      <div className={fadeOut ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 0.3s' }}>
        {children}
      </div>
    </>
  );
}
