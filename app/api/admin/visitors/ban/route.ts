import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrSubAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { removeVisitor } from '@/lib/visitors';

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'analytics');
  if (error) return error;

  const { ip, reason } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP required' }, { status: 400 });

  await prisma.bannedIp.upsert({
    where: { ip },
    create: { ip, reason: reason || '' },
    update: { reason: reason || '' },
  });
  removeVisitor(ip);

  return NextResponse.json({ ok: true, message: `${ip} banned` });
}

export async function DELETE(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'analytics');
  if (error) return error;

  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP required' }, { status: 400 });

  await prisma.bannedIp.deleteMany({ where: { ip } });

  return NextResponse.json({ ok: true, message: `${ip} unbanned` });
}

// GET all banned IPs
export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'analytics');
  if (error) return error;

  const banned = await prisma.bannedIp.findMany({ orderBy: { bannedAt: 'desc' } });
  return NextResponse.json(banned);
}
