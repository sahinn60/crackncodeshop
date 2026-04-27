import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';
import { validateLogin } from '@/lib/validate';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success } = rateLimit(`login:${ip}`, 10, 60_000);
  if (!success) return NextResponse.json({ error: 'Too many login attempts. Please wait.' }, { status: 429 });

  const body = await req.json();
  const errors = validateLogin(body);
  if (errors.length) return NextResponse.json({ error: errors[0].message, errors }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(body.password, user.password)))
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const permissions = (() => { try { return JSON.parse(user.permissions); } catch { return []; } })();
  const accessToken = signAccessToken({ id: user.id, role: user.role, permissions });
  const refreshToken = signRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, permissions },
    accessToken,
    refreshToken,
  });
}
