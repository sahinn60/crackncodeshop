import crypto from 'crypto';
import { prisma } from './prisma';

const HASH_KEY = process.env.EPS_HASH_KEY!;
const EPS_BASE = 'https://pgapi.eps.com.bd/v1';

export function generateHash(data: string): string {
  const hmac = crypto.createHmac('sha512', Buffer.from(HASH_KEY, 'utf8'));
  hmac.update(Buffer.from(data, 'utf8'));
  return hmac.digest('base64');
}

// In-memory fallback (works within same invocation)
let memToken: { token: string; expiresAt: number } | null = null;

async function getCachedToken(): Promise<string | null> {
  // Check memory first
  if (memToken && Date.now() < memToken.expiresAt) return memToken.token;

  // Check database
  try {
    const cached = await prisma.activityLog.findFirst({
      where: { action: 'eps_token', createdAt: { gt: new Date(Date.now() - 45 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      const data = JSON.parse(cached.metadata);
      if (data.token && data.expiresAt > Date.now()) {
        memToken = { token: data.token, expiresAt: data.expiresAt };
        return data.token;
      }
      // Token expired in DB, clean it up
      await prisma.activityLog.deleteMany({ where: { action: 'eps_token' } }).catch(() => {});
    }
  } catch {}
  return null;
}

async function saveTokenToCache(token: string, expiresAt: number) {
  memToken = { token, expiresAt };
  try {
    // Clean old token entries
    await prisma.activityLog.deleteMany({ where: { action: 'eps_token' } });
    // Save new token
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'eps_token',
        metadata: JSON.stringify({ token, expiresAt }),
      },
    });
  } catch {}
}

export async function getEpsToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = await getCachedToken();
    if (cached) return cached;
  }

  console.log('[eps] Fetching fresh token from EPS...');
  const username = process.env.EPS_USERNAME!;
  const xHash = generateHash(username);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  const res = await fetch(`${EPS_BASE}/Auth/GetToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hash': xHash },
    body: JSON.stringify({ userName: username, password: process.env.EPS_PASSWORD }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (res.status === 429) {
    const cached = await getCachedToken();
    if (cached) return cached;
    throw new Error('EPS authentication rate limited. Please try again in a few minutes.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EPS auth failed (${res.status}): ${text}`);
  }

  const resText = await res.text();
  if (!resText) throw new Error('EPS auth returned empty response');
  
  let data: any;
  try { data = JSON.parse(resText); } catch {
    throw new Error(`EPS auth returned invalid JSON: ${resText.slice(0, 200)}`);
  }
  
  if (!data.token) throw new Error(data.errorMessage || 'Failed to get EPS token');

  // Use 45 min expiry (EPS tokens last ~60 min) to avoid edge cases
  const expiresAt = data.expireDate
    ? new Date(data.expireDate).getTime() - 10 * 60 * 1000
    : Date.now() + 45 * 60 * 1000;

  console.log('[eps] Fresh token obtained, expires in', Math.round((expiresAt - Date.now()) / 60000), 'min');
  await saveTokenToCache(data.token, expiresAt);
  return data.token;
}

export function clearTokenCache() {
  memToken = null;
  // Also clear DB cache
  prisma.activityLog.deleteMany({ where: { action: 'eps_token' } }).catch(() => {});
}

export { EPS_BASE };
