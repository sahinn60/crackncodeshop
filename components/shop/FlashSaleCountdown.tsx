'use client';

import { useState, useEffect, useCallback } from 'react';

function pad(n: number) { return String(n).padStart(2, '0'); }

const BD_OFFSET = 6 * 60;

function getBDEndOfDayMs(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utcMs + BD_OFFSET * 60000);
  bd.setHours(23, 59, 59, 999);
  return bd.getTime() - BD_OFFSET * 60000;
}

interface Props {
  endTime: string;
  isDaily: boolean;
}

export function FlashSaleCountdown({ endTime, isDaily }: Props) {
  const getRemaining = useCallback(() => {
    const target = isDaily ? getBDEndOfDayMs() : new Date(endTime).getTime();
    const diff = Math.max(0, target - Date.now());
    if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0 };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff,
    };
  }, [endTime, isDaily]);

  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const tick = setInterval(() => {
      const t = getRemaining();
      if (t.total <= 0 && isDaily) {
        setTime({ h: 23, m: 59, s: 59, total: 86399000 });
      } else {
        setTime(t);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [getRemaining, isDaily]);

  const urgent = time.h < 1;

  const units = [
    { val: pad(time.h), label: 'HRS' },
    { val: pad(time.m), label: 'MIN' },
    { val: pad(time.s), label: 'SEC' },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-1.5 sm:gap-2">
          {i > 0 && (
            <span className={`text-sm font-light ${urgent ? 'text-primary' : 'text-white/25'}`}>:</span>
          )}
          <div className={`flex flex-col items-center justify-center w-10 h-11 sm:w-12 sm:h-14 rounded-xl backdrop-blur-sm transition-all ${
            urgent
              ? 'bg-primary/20 border border-primary/30 shadow-[0_0_12px_rgba(255,45,45,0.15)]'
              : 'bg-white/[0.08] border border-white/[0.1]'
          }`}>
            <span className={`text-base sm:text-lg font-semibold tabular-nums leading-none ${
              urgent ? 'text-red-300' : 'text-white'
            }`}>
              {unit.val}
            </span>
            <span className="text-[7px] sm:text-[8px] font-medium tracking-wider text-white/30 mt-0.5">{unit.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
