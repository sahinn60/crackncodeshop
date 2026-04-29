import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { error, user } = requireAuth(req);
    if (error) return error;

    // Staff cannot change their own password — only admin can
    if (user!.role === 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Staff members cannot change passwords. Contact your admin.' }, { status: 403 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user!.id }, data: { password: hashed } });

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    console.error('[change-password] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
