'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { apiClient } from '@/lib/axios';

interface LogoItem {
  id: string;
  image: string;
  alt: string;
  link?: string;
  active: boolean;
}

interface LogoShowcaseConfig {
  title: string;
  subtitle: string;
  titleEffects: string[];
  logoAnimations: string[];
  speed: 'slow' | 'medium' | 'fast';
  pauseOnHover: boolean;
  logos: LogoItem[];
}

// ── Constants ──
const SPEED_DURATION = { slow: 40, medium: 25, fast: 14 };

const LOGO_ANIMS = ['scroll', 'float', 'scale', 'glow', 'fade', 'blur', 'tilt'] as const;
const TITLE_EFFECTS = ['slide-left', 'fade-up', 'glow-text', 'gradient-shift', 'blur-reveal', 'scale-in', 'letter-stagger'] as const;

// ── Logo Card ──
function LogoCard({ logo, extraClass }: { logo: LogoItem; extraClass: string }) {
  const inner = logo.image ? (
    <img
      src={logo.image}
      alt={logo.alt}
      className="h-9 sm:h-11 w-auto max-w-[130px] object-contain opacity-45 transition-all duration-300 group-hover:opacity-90"
      loading="lazy"
    />
  ) : (
    <span className="text-sm text-white/20 font-semibold">{logo.alt || 'Logo'}</span>
  );

  const card = (
    <div className={`group flex-shrink-0 w-32 h-22 sm:w-40 sm:h-28 rounded-xl flex items-center justify-center p-4 sm:p-5 ls-card ${extraClass}`}>
      {inner}
    </div>
  );

  return logo.link ? (
    <a href={logo.link} target="_blank" rel="noopener noreferrer">{card}</a>
  ) : card;
}

// ── Animated Title with IntersectionObserver ──
function AnimatedTitle({ text, effects }: { text: string; effects: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cls = effects.map(e => `lst-${e}`).join(' ');
  const isStagger = effects.includes('letter-stagger');

  if (isStagger && visible) {
    return (
      <p ref={ref} className={`ls-title ${cls} ${visible ? 'lst-visible' : ''}`} aria-label={text}>
        {text.split('').map((ch, i) => (
          <span key={i} className="lst-letter" style={{ animationDelay: `${i * 0.03}s` }}>
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p ref={ref} className={`ls-title ${cls} ${visible ? 'lst-visible' : ''}`}>
      {text}
    </p>
  );
}

// ── Build a set of logos wide enough to fill the viewport, then double it ──
function buildScrollSet(logos: LogoItem[]): LogoItem[] {
  // Card ~160px + gap ~28px ≈ 188px per logo on desktop
  // We need one "set" to be >= viewport width so -50% never shows empty space
  const PER_LOGO_PX = 188;
  const target = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const repeats = Math.max(2, Math.ceil(target / (logos.length * PER_LOGO_PX)) + 1);
  const oneSet: LogoItem[] = [];
  for (let r = 0; r < repeats; r++) oneSet.push(...logos);
  // Double the set: first half scrolls out, second half fills in
  return [...oneSet, ...oneSet];
}

// ── Scroll Track ──
function ScrollTrack({ logos, duration, pauseOnHover, extraCardClass }: {
  logos: LogoItem[]; duration: number; pauseOnHover: boolean; extraCardClass: string;
}) {
  const items = buildScrollSet(logos);

  return (
    <div className="ls-scroll-wrap">
      <div className="ls-fade-left" />
      <div className="ls-fade-right" />
      <div
        className={`ls-scroll-track ls-scroll-forward ${pauseOnHover ? 'ls-pause-hover' : ''}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {items.map((logo, i) => (
          <LogoCard key={`${i}-${logo.id}`} logo={logo} extraClass={extraCardClass} />
        ))}
      </div>
    </div>
  );
}

// ── Grid Layout ──
function GridLayout({ logos, animations }: { logos: LogoItem[]; animations: string[] }) {
  const cardClass = animations.filter(a => a !== 'scroll').map(a => `lsa-${a}`).join(' ');

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7">
        {logos.map((logo, i) => (
          <div key={logo.id} className="lsa-item" style={{ animationDelay: `${i * 0.35}s` }}>
            <LogoCard logo={logo} extraClass={cardClass} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Renderer ──
function LogoShowcaseInner({ config }: { config: LogoShowcaseConfig }) {
  const activeLogos = config.logos.filter(l => l.active);
  if (activeLogos.length === 0) return null;

  const anims = config.logoAnimations;
  const hasScroll = anims.includes('scroll');
  const duration = SPEED_DURATION[config.speed];

  // Build extra CSS classes for non-scroll animations applied to each card
  const overlayAnims = anims.filter(a => a !== 'scroll');
  const cardClass = overlayAnims.map(a => `lsa-${a}`).join(' ');

  let content: React.ReactNode;

  if (hasScroll) {
    // Scroll mode: other animations layer on top via card classes
    content = (
      <ScrollTrack
        logos={activeLogos}
        duration={duration}
        pauseOnHover={config.pauseOnHover}
        extraCardClass={cardClass}
      />
    );
  } else {
    // Grid mode: all animations via card classes + wrapper stagger
    content = <GridLayout logos={activeLogos} animations={anims} />;
  }

  return (
    <section
      className="py-8 sm:py-14 overflow-hidden my-4 sm:my-8 relative"
      style={{ background: 'linear-gradient(160deg, #070D1A 0%, #0B1428 35%, #0F172A 60%, #0D1225 100%)' }}
    >
      <div className="absolute top-0 left-1/4 w-[500px] h-40 rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(255,45,45,0.06)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-32 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(99,102,241,0.05)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(139,92,246,0.04)' }} />

      <div className="container mx-auto px-4 mb-6 sm:mb-10 text-center relative">
        <AnimatedTitle text={config.title} effects={config.titleEffects} />
        {config.subtitle && (
          <p className="mt-2 text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {config.subtitle}
          </p>
        )}
      </div>

      {content}
    </section>
  );
}

const MemoizedShowcase = memo(LogoShowcaseInner);

export function LogoShowcase() {
  const [config, setConfig] = useState<LogoShowcaseConfig | null>(null);

  useEffect(() => {
    apiClient.get('/logo-showcase').then(({ data }) => setConfig(data)).catch(() => {});
  }, []);

  if (!config || config.logos.filter(l => l.active).length === 0) return null;
  return <MemoizedShowcase config={config} />;
}

export { LogoShowcaseInner as LogoShowcasePreview };
export type { LogoShowcaseConfig, LogoItem };
export { LOGO_ANIMS, TITLE_EFFECTS };
