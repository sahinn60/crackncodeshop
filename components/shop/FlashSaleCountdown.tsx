'use client';

import { useState, useEffect, useRef } from 'react';

function pad(n: number) { return String(n).padStart(2, '0'); }

const BD_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6

// Get BD end-of-day (23:59:59.999 BD time) as a UTC timestamp
function getBDEndOfDay(nowUtcMs: number): number {
  // Convert UTC ms to BD local ms
  const bdMs = nowUtcMs + BD_OFFSET_MS;
  const bdDate = new Date(bdMs);
  // Set to end of BD day in "fake UTC" space
  const endOfBD = Date.UTC(
    bdDate.getUTCFullYear(),
    bdDate.getUTCMonth(),
    bdDate.getUTCDate(),
    23, 59, 59, 999
  );
  // Convert back to real UTC
  return endOfBD - BD_OFFSET_MS;
}

interface Props {
  endTime: string;
  isDaily: boolean;
  serverTime?: number;
}

export function FlashSaleCountdown({ endTime, isDaily, serverTime }: Props) {
  // Offset = how far ahead/behind the server is vs client
  const offsetRef = useRef(serverTime ? serverTime - Date.now() : 0);

  const calcTime = () => {
    const nowUtc = Date.now() + offsetRef.current;
    const target = isDaily ? getBDEndOfDay(nowUtc) : new Date(endTime).getTime();
    const diff = Math.max(0, target - nowUtc);
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff,
    };
  };

  const [time, setTime] = useState(calcTime);
  const [expired, setExpired] = useState(false);

  // Main tick — runs every second
  useEffect(() => {
    const id = setInterval(() => {
      const t = calcTime();
      if (t.total <= 0 && !isDaily) {
        setExpired(true);
        setTime({ h: 0, m: 0, s: 0, total: 0 });
        clearInterval(id);
      } else {
        // For daily: calcTime() automatically targets the NEXT BD midnight,
        // so it never gets stuck — no static 23:59:59 needed
        setTime(t);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime, isDaily]);

  // Re-sync with server every 5 minutes
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/time');
        const { serverTime: st } = await res.json();
        offsetRef.current = st - Date.now();
      } catch {}
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Sync offset if serverTime prop changes
  useEffect(() => {
    if (serverTime) offsetRef.current = serverTime - Date.now();
  }, [serverTime]);

  if (expired) return null;

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
            urgent ? 'shadow-[0_0_12px_rgba(255,45,45,0.15)]' : ''
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
