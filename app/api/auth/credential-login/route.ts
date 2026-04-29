import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success } = rateLimit(`cred-login:${ip}`, 10, 60_000);
  if (!success) return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });

  const { credentialKey, password } = await req.json();
  if (!credentialKey || !password) return NextResponse.json({ error: 'Credential key and password are required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { credentialKey: credentialKey.trim().toUpperCase() } });
  if (!user || user.role !== 'SUB_ADMIN' || !(await bcrypt.compare(password, user.password)))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const permissions = (() => { try { return JSON.parse(user.permissions); } catch { return []; } })();
  const accessToken = signAccessToken({ id: user.id, role: user.role, permissions });
  const refreshToken = signRefreshToken();

  await Promise.all([
    prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, permissions },
    accessToken,
    refreshToken,
  });
}
