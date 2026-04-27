'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, ChevronLeft, ChevronRight, Tag, Gift } from 'lucide-react';
import { useCouponStore, Coupon } from '@/store/useCouponStore';

const SLIDE_DURATION = 4000;

const icons = [Sparkles, Tag, Gift];

export function PromoBanner() {
  const { coupons, fetchCoupons } = useCouponStore();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const slideRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const slideCount = coupons.length === 1 ? 3 : coupons.length;

  const advance = useCallback(() => {
    setDirection(1);
    setCurrent(p => (p + 1) % slideCount);
    setProgress(0);
  }, [slideCount]);

  // Auto-slide + progress — always runs
  useEffect(() => {
    if (coupons.length === 0) return;
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / SLIDE_DURATION) * 100));
    }, 30);
    slideRef.current = setTimeout(advance, SLIDE_DURATION);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (slideRef.current) clearTimeout(slideRef.current);
    };
  }, [current, coupons.length, advance]);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent(p => (p + dir + slideCount) % slideCount);
    setProgress(0);
  }, [slideCount]);

  if (coupons.length === 0) return null;

  // With single coupon, loop it by duplicating so slider still animates
  const slides = coupons.length === 1 ? [coupons[0], coupons[0], coupons[0]] : coupons;
  const coupon = slides[current % slides.length];
  const Icon = icons[current % icons.length];

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Outer glow wrapper */}
      <div className="relative group">
        {/* Animated border glow */}
        <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-500 via-orange-400 to-red-500 opacity-60 blur-[1px] group-hover:opacity-80 transition-opacity promo-border-shift" />

        {/* Main card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a0808] via-[#120404] to-[#0d0000]">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,45,45,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,120,30,0.08),transparent_60%)]" />
          {/* Shimmer sweep */}
          <div className="absolute inset-0 promo-shimmer pointer-events-none" />
          {/* Decorative elements */}
          <div className="absolute -top-8 -right-8 w-32 h-32 sm:w-48 sm:h-48 bg-red-500/[0.06] rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 sm:w-40 sm:h-40 bg-orange-500/[0.05] rounded-full blur-[50px] pointer-events-none" />

          <div className="relative z-10 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
              {/* Left: icon + sliding content */}
              <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left flex-1 min-w-0 overflow-hidden">
                {/* Animated icon */}
                <div className="hidden sm:flex h-11 w-11 rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-red-400 promo-icon-pulse" />
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current}
                    custom={direction}
                    initial={{ x: direction > 0 ? 60 : -60, opacity: 0, scale: 0.95 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: direction > 0 ? -60 : 60, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="min-w-0"
                  >
                    <p className="text-white font-bold text-base sm:text-lg leading-tight truncate">{coupon.message}</p>
                    {coupon.discount && (
                      <p className="text-white/40 text-xs sm:text-sm mt-0.5 font-medium">
                        Get <span className="font-bold text-red-300">{coupon.discount}</span> off — use code at checkout
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: code badge + nav */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Code copy button */}
                <button
                  onClick={handleCopy}
                  className="group/btn relative flex items-center gap-2.5 bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-md border border-white/[0.1] hover:border-red-500/30 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-red-500/10"
                >
                  {/* Discount badge */}
                  {coupon.discount && (
                    <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-extrabold rounded-md shadow-lg shadow-red-500/30 promo-badge-pulse">
                      {coupon.discount}
                    </span>
                  )}
                  <span className="font-mono font-bold text-white tracking-[0.15em] text-sm sm:text-base">
                    {coupon.code}
                  </span>
                  <span className="h-5 w-px bg-white/15" />
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="h-4 w-4 text-green-400" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Copy className="h-4 w-4 text-white/40 group-hover/btn:text-white/70 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {/* Nav arrows */}
                <div className="hidden sm:flex items-center gap-1">
                  <button onClick={() => go(-1)} className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/[0.12] text-white/40 hover:text-white transition-all">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => go(1)} className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/[0.12] text-white/40 hover:text-white transition-all">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mt-3">
              {coupons.length > 1 && (
                <div className="flex gap-1.5">
                  {coupons.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setProgress(0); }}
                      className={`h-1 rounded-full transition-all duration-300 ${i === current % coupons.length ? 'w-5 bg-red-400' : 'w-1.5 bg-white/15 hover:bg-white/30'}`}
                    />
                  ))}
                </div>
              )}
              <div className="flex-1 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500/60 to-orange-400/60 rounded-full transition-[width] duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
