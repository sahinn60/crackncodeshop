import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const profile = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { id: true, name: true, email: true, avatarUrl: true, bio: true, createdAt: true, role: true },
  });
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { name, avatarUrl, bio } = await req.json();

  if (name !== undefined && typeof name === 'string' && name.trim().length < 2)
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user!.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl.trim() }),
      ...(bio !== undefined && { bio: bio.trim() }),
    },
    select: { id: true, name: true, email: true, avatarUrl: true, bio: true, role: true },
  });

  return NextResponse.json(updated);
}
