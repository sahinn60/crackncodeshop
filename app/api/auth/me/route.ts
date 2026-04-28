import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const dbUser = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, bio: true, permissions: true },
  });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const permissions = (() => { try { return JSON.parse(dbUser.permissions); } catch { return []; } })();
  return NextResponse.json({ user: { ...dbUser, permissions } });
}
