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
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: { footerText: true }, // reuse footerText temporarily? No, use a dedicated approach
    });
    // Store token in a simple key-value approach using Settings model
    // We'll use the ActivityLog model to store the token
    const cached = await prisma.activityLog.findFirst({
      where: { action: 'eps_token', createdAt: { gt: new Date(Date.now() - 55 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      const data = JSON.parse(cached.metadata);
      if (data.token && data.expiresAt > Date.now()) {
        memToken = { token: data.token, expiresAt: data.expiresAt };
        return data.token;
      }
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

  const username = process.env.EPS_USERNAME!;
  const xHash = generateHash(username);

  const res = await fetch(`${EPS_BASE}/Auth/GetToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hash': xHash },
    body: JSON.stringify({ userName: username, password: process.env.EPS_PASSWORD }),
  });

  if (res.status === 429) {
    // Rate limited — check DB cache one more time (another invocation may have refreshed it)
    const cached = await getCachedToken();
    if (cached) return cached;
    throw new Error('EPS authentication rate limited. Please try again in a few minutes.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EPS auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error(data.errorMessage || 'Failed to get EPS token');

  const expiresAt = data.expireDate
    ? new Date(data.expireDate).getTime() - 5 * 60 * 1000
    : Date.now() + 55 * 60 * 1000;

  await saveTokenToCache(data.token, expiresAt);
  return data.token;
}

export function clearTokenCache() {
  memToken = null;
  // Also clear DB cache
  prisma.activityLog.deleteMany({ where: { action: 'eps_token' } }).catch(() => {});
}

export { EPS_BASE };
