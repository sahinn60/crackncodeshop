'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const prevRef = useRef({ h: '', m: '', s: '' });

  const units = [
    { val: pad(time.h), label: 'HRS', key: 'h' as const },
    { val: pad(time.m), label: 'MIN', key: 'm' as const },
    { val: pad(time.s), label: 'SEC', key: 's' as const },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className={`text-xs sm:text-sm font-light ${urgent ? 'text-primary' : 'text-white/25'}`}>:</span>
          )}
          <div className={`flex flex-col items-center justify-center w-10 h-[46px] sm:w-12 sm:h-14 rounded-lg sm:rounded-xl transition-all ${
            urgent
              ? 'shadow-[0_0_12px_rgba(255,45,45,0.15)]'
              : ''
          }`} style={{
            background: urgent ? 'rgba(255,45,45,0.08)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${urgent ? 'rgba(255,45,45,0.25)' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: urgent ? undefined : '0 0 10px rgba(255,255,255,0.05)',
            animation: urgent ? undefined : 'fs-timer-breathe 2.5s ease-in-out infinite',
          }}>
            <span
              key={unit.val}
              className={`text-sm sm:text-lg font-semibold tabular-nums leading-none ${
                urgent ? 'text-red-300' : 'text-white'
              }`}
              style={{
                textShadow: urgent ? '0 0 8px rgba(255,80,80,0.3)' : '0 0 6px rgba(255,255,255,0.1)',
                animation: prevRef.current[unit.key] !== unit.val ? 'fs-num-pop 0.2s ease-out' : undefined,
              }}
              ref={(el) => { if (el) prevRef.current[unit.key] = unit.val; }}
            >
              {unit.val}
            </span>
            <span className="text-[8px] sm:text-[8px] font-medium tracking-wider text-white/30 mt-0.5">{unit.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
