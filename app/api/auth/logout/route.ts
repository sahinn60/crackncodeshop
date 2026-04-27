import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  if (!refreshToken) return NextResponse.json({ success: true });

  const user = getAuthUser(req);

  if (user) {
    // Authenticated: only delete tokens belonging to this user
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId: user.id },
    });
  } else {
    // Unauthenticated logout (expired access token): still allow cleanup
    // but verify the token exists before deleting
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  return NextResponse.json({ success: true });
}
