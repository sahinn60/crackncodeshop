export interface Visitor {
  ip: string;
  country: string;
  device: string;
  browser: string;
  currentPage: string;
  entryTime: number;
  lastActivity: number;
}

const ACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const CLEANUP_THRESHOLD = 15 * 60 * 1000; // 15 minutes

// Global singleton survives HMR in dev
const g = globalThis as any;
if (!g.__visitors) g.__visitors = new Map<string, Visitor>();
if (!g.__visitorCleanup) {
  g.__visitorCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, v] of g.__visitors.entries()) {
      if (now - v.lastActivity > CLEANUP_THRESHOLD) g.__visitors.delete(ip);
    }
  }, 60_000);
}

export const visitors: Map<string, Visitor> = g.__visitors;

export function getActiveVisitors(): Visitor[] {
  const cutoff = Date.now() - ACTIVE_THRESHOLD;
  return Array.from(visitors.values()).filter(v => v.lastActivity > cutoff);
}

export function getAllVisitors(): Visitor[] {
  return Array.from(visitors.values());
}

export function trackVisitor(data: Omit<Visitor, 'entryTime' | 'lastActivity'>) {
  const existing = visitors.get(data.ip);
  const now = Date.now();
  visitors.set(data.ip, {
    ...data,
    entryTime: existing?.entryTime || now,
    lastActivity: now,
  });
}

export function removeVisitor(ip: string) {
  visitors.delete(ip);
}
