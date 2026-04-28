import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.toLowerCase().trim();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const successMsg = { message: 'If an account exists with this email, a reset link has been sent.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json(successMsg);

    // Rate limit: 1 reset per 2 minutes
    const recent = await prisma.passwordReset.findFirst({
      where: { email: user.email, createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) } },
    });
    if (recent) return NextResponse.json(successMsg);

    // Invalidate old tokens
    await prisma.passwordReset.updateMany({
      where: { email: user.email, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: { email: user.email, token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (emailErr: any) {
      console.error('[forgot-password] Email failed:', emailErr?.message || emailErr);
      return NextResponse.json({ error: 'Failed to send email. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json(successMsg);
  } catch (err: any) {
    console.error('[forgot-password] Error:', err?.message || err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
