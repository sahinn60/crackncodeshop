import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function generateCredentialKey() {
  return 'SA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generatePassword() {
  return crypto.randomBytes(8).toString('base64url');
}

export async function GET(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const subAdmins = await prisma.user.findMany({
    where: { role: 'SUB_ADMIN' },
    select: { id: true, name: true, email: true, role: true, permissions: true, credentialKey: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(subAdmins.map(u => ({
    ...u,
    permissions: (() => { try { return JSON.parse(u.permissions); } catch { return []; } })(),
  })));
}

export async function POST(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const { name, email, permissions } = await req.json();
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const credentialKey = generateCredentialKey();
  const rawPassword = generatePassword();
  const hashed = await bcrypt.hash(rawPassword, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: 'SUB_ADMIN',
      permissions: JSON.stringify(permissions || []),
      credentialKey,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    credentialKey,
    generatedPassword: rawPassword,
    permissions: permissions || [],
  }, { status: 201 });
}
