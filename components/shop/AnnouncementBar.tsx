'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';

interface Coupon {
  id: string;
  code: string;
  discount: string;
  message: string;
}

export function AnnouncementBar() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const setBarVisible = useCouponStore(s => s.setBarVisible);

  useEffect(() => {
    fetch('/api/coupons')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setCoupons(arr);
        useCouponStore.setState({ coupons: arr, fetched: true });
        if (arr.length > 0) setVisible(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setBarVisible(visible && !closing);
    return () => setBarVisible(false);
  }, [visible, closing, setBarVisible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setVisible(false); setClosing(false); }, 400);
  }, []);

  if (!visible || coupons.length === 0) return null;

  const tickerItems = [...coupons, ...coupons, ...coupons, ...coupons, ...coupons, ...coupons];
  const speed = Math.max(coupons.length * 25, 28);

  return (
    <>
      <div className={`ann-bar ${closing ? 'ann-bar--closing' : ''}`}>
        <div className="ann-bar__glow ann-bar__glow--left" />
        <div className="ann-bar__glow ann-bar__glow--right" />
        <div className="ann-bar__shimmer" />

        <div className="ann-bar__track">
          <div className="ann-bar__ticker" style={{ '--ticker-duration': `${speed}s` } as React.CSSProperties}>
            {tickerItems.map((c, i) => <CouponChip key={`a-${c.id}-${i}`} coupon={c} />)}
          </div>
          <div className="ann-bar__ticker" aria-hidden style={{ '--ticker-duration': `${speed}s` } as React.CSSProperties}>
            {tickerItems.map((c, i) => <CouponChip key={`b-${c.id}-${i}`} coupon={c} />)}
          </div>
        </div>

        <div className="ann-bar__fade ann-bar__fade--left" />
        <div className="ann-bar__fade ann-bar__fade--right" />

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

  const handleCopy = useCallback(() => {
    if (!coupon.code) return;
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [coupon.code]);

  return (
    <span className="ann-chip" role="button" tabIndex={0} onClick={handleCopy} onKeyDown={e => e.key === 'Enter' && handleCopy()}>
      <span className="ann-chip__fire">🔥</span>
      <span className="ann-chip__msg">{coupon.message}</span>
      {discountLabel && (
        <span className="ann-chip__discount">{discountLabel} OFF</span>
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
