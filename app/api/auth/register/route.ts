import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';
import { validateRegister } from '@/lib/validate';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success } = rateLimit(`register:${ip}`, 5, 60_000);
  if (!success) return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });

  const body = await req.json();
  const errors = validateRegister(body);
  if (errors.length) return NextResponse.json({ error: errors[0].message, errors }, { status: 400 });

  const email = body.email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email } }))
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

  const hashed = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({ data: { name: body.name.trim(), email, password: hashed } });

  const accessToken = signAccessToken({ id: user.id, role: user.role, permissions: [] });
  const refreshToken = signRefreshToken();

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, permissions: [] },
    accessToken,
    refreshToken,
  }, { status: 201 });
}
