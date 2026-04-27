import crypto from 'crypto';

const HASH_KEY = process.env.EPS_HASH_KEY!;
const EPS_BASE = 'https://pgapi.eps.com.bd/v1';

export function generateHash(data: string): string {
  const hmac = crypto.createHmac('sha512', Buffer.from(HASH_KEY, 'utf8'));
  hmac.update(Buffer.from(data, 'utf8'));
  return hmac.digest('base64');
}

// Cache token in memory — reuse until 5 min before expiry
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getEpsToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const username = process.env.EPS_USERNAME!;
  const xHash = generateHash(username);

  const res = await fetch(`${EPS_BASE}/Auth/GetToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hash': xHash },
    body: JSON.stringify({ userName: username, password: process.env.EPS_PASSWORD }),
  });

  if (res.status === 429) {
    // Rate limited — wait 2s and retry once
    await new Promise(r => setTimeout(r, 2000));
    const retry = await fetch(`${EPS_BASE}/Auth/GetToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hash': xHash },
      body: JSON.stringify({ userName: username, password: process.env.EPS_PASSWORD }),
    });
    if (!retry.ok) throw new Error(`EPS auth rate limited (429). Please try again.`);
    const retryData = await retry.json();
    if (!retryData.token) throw new Error(retryData.errorMessage || 'Failed to get EPS token');
    cachedToken = { token: retryData.token, expiresAt: Date.now() + 55 * 60 * 1000 };
    return retryData.token;
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

  cachedToken = { token: data.token, expiresAt };
  return data.token;
}

export function clearTokenCache() {
  cachedToken = null;
}

export { EPS_BASE };
