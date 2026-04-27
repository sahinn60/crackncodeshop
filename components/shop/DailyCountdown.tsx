'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timer, Flame } from 'lucide-react';

function pad(n: number) { return String(n).padStart(2, '0'); }

// Compute BD end-of-day (23:59:59.999) as UTC ms — mirrors server logic
function getBDEndOfDayMs(): number {
  const now = new Date();
  const BD_OFFSET = 6 * 60; // minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const bdNow = new Date(utcMs + BD_OFFSET * 60000);
  const bdEnd = new Date(bdNow);
  bdEnd.setHours(23, 59, 59, 999);
  return bdEnd.getTime() - BD_OFFSET * 60000;
}

interface Props {
  endTime?: string | null; // ISO string from API (optional, we can self-compute)
  variant?: 'card' | 'hero';
}

export function DailyCountdown({ endTime, variant = 'card' }: Props) {
  const getRemaining = useCallback(() => {
    const target = endTime ? new Date(endTime).getTime() : getBDEndOfDayMs();
    const diff = Math.max(0, target - Date.now());
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, expired: false };
  }, [endTime]);

  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const tick = setInterval(() => {
      const t = getRemaining();
      if (t.expired) {
        // Auto-reset: recompute for next BD day
        setTime({ h: 23, m: 59, s: 59, expired: false });
      } else {
        setTime(t);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [getRemaining]);

  const isUrgent = time.h < 3;

  if (variant === 'hero') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isUrgent ? 'bg-red-500/20 border-red-400/30' : 'bg-white/10 border-white/20'}`}>
          <Flame className={`h-4 w-4 ${isUrgent ? 'text-red-300 animate-pulse' : 'text-amber-300'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">Ends Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { val: pad(time.h), label: 'HRS' },
            { val: pad(time.m), label: 'MIN' },
            { val: pad(time.s), label: 'SEC' },
          ].map((unit, i) => (
            <div key={unit.label} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-white/40 font-bold text-lg">:</span>}
              <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg min-w-[48px] ${isUrgent ? 'bg-red-500/30 shadow-red-500/20 shadow-lg' : 'bg-white/10'}`}>
                <span className={`text-xl sm:text-2xl font-black tabular-nums ${isUrgent ? 'text-red-200' : 'text-white'}`}>{unit.val}</span>
                <span className="text-[9px] font-bold tracking-widest text-white/50">{unit.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card variant — compact
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${isUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-amber-50 text-amber-700'}`}>
      <Timer className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
      <span className="hidden sm:inline opacity-70">left today</span>
    </div>
  );
}
