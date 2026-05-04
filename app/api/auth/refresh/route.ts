import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success: rlOk } = rateLimit(`refresh:${ip}`, 15, 60_000);
  if (!rlOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { refreshToken } = await req.json();
  if (!refreshToken) return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  const permissions = (() => { try { return JSON.parse(stored.user.permissions); } catch { return []; } })();
  const accessToken = signAccessToken({ id: stored.user.id, role: stored.user.role, permissions });
  const newRefreshToken = signRefreshToken();

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  await prisma.refreshToken.create({
    data: { userId: stored.user.id, token: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  const u = stored.user;
  return NextResponse.json({
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl, bio: u.bio, permissions },
  });
}
