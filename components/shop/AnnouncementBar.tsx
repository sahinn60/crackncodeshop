'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useCouponStore, Coupon } from '@/store/useCouponStore';

function isExpired(c: Coupon): boolean {
  if (!c.endDate) return false;
  return new Date(c.endDate).getTime() <= Date.now();
}

function getTimeLeft(endDate: string | null): { h: number; m: number; s: number } | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
}

function CountdownTimer({ endDate }: { endDate: string | null }) {
  const [time, setTime] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    if (!endDate) return;
    const t = setInterval(() => setTime(getTimeLeft(endDate)), 1000);
    return () => clearInterval(t);
  }, [endDate]);

  if (!time) return null;

  return (
    <span className="ann-chip__timer">
      {String(time.h).padStart(2, '0')}:{String(time.m).padStart(2, '0')}:{String(time.s).padStart(2, '0')}
    </span>
  );
}

export function AnnouncementBar() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const setBarVisible = useCouponStore(s => s.setBarVisible);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons');
      if (!res.ok) return;
      const data = await res.json();
      const arr: Coupon[] = Array.isArray(data) ? data : [];
      const active = arr.filter(c => !isExpired(c));
      setCoupons(active);
      useCouponStore.setState({ coupons: active, fetched: true });
      if (active.length > 0) setVisible(true);
      else { setClosing(true); setTimeout(() => { setVisible(false); setClosing(false); }, 400); }
    } catch {}
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCoupons(prev => {
        const active = prev.filter(c => !isExpired(c));
        if (active.length < prev.length) {
          useCouponStore.setState({ coupons: active });
          if (active.length === 0) {
            setClosing(true);
            setTimeout(() => { setVisible(false); setClosing(false); }, 400);
          }
        }
        return active;
      });
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(fetchCoupons, 5 * 60_000);
    return () => clearInterval(timer);
  }, [fetchCoupons]);

  useEffect(() => {
    setBarVisible(visible && !closing && coupons.length > 0);
    return () => setBarVisible(false);
  }, [visible, closing, coupons.length, setBarVisible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setVisible(false); setClosing(false); }, 400);
  }, []);

  if (!visible || coupons.length === 0) return null;

  const barColor = coupons[0]?.barColor || '#DC2626';
  const speedDesktop = coupons[0]?.speedDesktop || 47;
  const speedMobile = coupons[0]?.speedMobile || 70;
  const tickerItems = [...coupons, ...coupons, ...coupons, ...coupons, ...coupons, ...coupons];

  return (
    <>
      <div
        className={`ann-bar ${closing ? 'ann-bar--closing' : ''}`}
        style={{ background: `linear-gradient(135deg, ${barColor} 0%, ${barColor}dd 40%, ${barColor} 70%, ${barColor}bb 100%)` }}
      >
        <div className="ann-bar__glow ann-bar__glow--left" />
        <div className="ann-bar__glow ann-bar__glow--right" />
        <div className="ann-bar__shimmer" />

        <div className="ann-bar__track">
          {/* Desktop tickers */}
          <div className="ann-bar__ticker hidden sm:flex" style={{ '--ticker-duration': `${speedDesktop}s` } as React.CSSProperties}>
            {tickerItems.map((c, i) => <CouponChip key={`a-${c.id}-${i}`} coupon={c} />)}
          </div>
          <div className="ann-bar__ticker hidden sm:flex" aria-hidden style={{ '--ticker-duration': `${speedDesktop}s` } as React.CSSProperties}>
            {tickerItems.map((c, i) => <CouponChip key={`b-${c.id}-${i}`} coupon={c} />)}
          </div>
          {/* Mobile tickers */}
          <div className="ann-bar__ticker flex sm:hidden" style={{ '--ticker-duration': `${speedMobile}s` } as React.CSSProperties}>
            {tickerItems.map((c, i) => <CouponChip key={`c-${c.id}-${i}`} coupon={c} />)}
          </div>
          <div className="ann-bar__ticker flex sm:hidden" aria-hidden style={{ '--ticker-duration': `${speedMobile}s` } as React.CSSProperties}>
            {tickerItems.map((c, i) => <CouponChip key={`d-${c.id}-${i}`} coupon={c} />)}
          </div>
        </div>

        <div className="ann-bar__fade ann-bar__fade--left" style={{ background: `linear-gradient(to right, ${barColor}, transparent)` }} />
        <div className="ann-bar__fade ann-bar__fade--right" style={{ background: `linear-gradient(to left, ${barColor}, transparent)` }} />

        <button onClick={handleClose} className="ann-bar__close" aria-label="Close announcement">
          <X className="h-3 w-3" />
        </button>
      </div>
      {!closing && <div className="ann-bar-spacer" />}
    </>
  );
}

function CouponChip({ coupon }: { coupon: Coupon }) {
  const discountMatch = coupon.discount?.match(/(\d+%?)/);
  const discountLabel = discountMatch ? discountMatch[1] : null;
  const [copied, setCopied] = useState(false);
  const emoji = coupon.emoji || '🔥';
  const textColor = coupon.textColor || '#FFFFFF';

  const handleCopy = useCallback(() => {
    if (!coupon.code) return;
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [coupon.code]);

  return (
    <span className="ann-chip" role="button" tabIndex={0} onClick={handleCopy} onKeyDown={e => e.key === 'Enter' && handleCopy()} style={{ color: textColor }}>
      <span className="ann-chip__fire">{emoji}</span>
      <span className="ann-chip__msg">{coupon.message}</span>
      {discountLabel && (
        <span className="ann-chip__discount">{discountLabel} OFF</span>
      )}
      {coupon.showTimer && coupon.endDate && (
        <CountdownTimer endDate={coupon.endDate} />
      )}
      {coupon.code && (
        <>
          <span className="ann-chip__sep">|</span>
          <span className="ann-chip__label">USE CODE</span>
          <span className={`ann-chip__code ${copied ? 'ann-chip__code--copied' : ''}`}>
            {copied ? <>✓ Copied!</> : <>{coupon.code}</>}
          </span>
        </>
      )}
      <span className="ann-chip__divider">✦</span>
    </span>
  );
}
