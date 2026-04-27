import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrSubAdmin } from '@/lib/auth';
import { getAllVisitors, getActiveVisitors } from '@/lib/visitors';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'analytics');
  if (error) return error;

  const mode = req.nextUrl.searchParams.get('mode');
  const list = mode === 'active' ? getActiveVisitors() : getAllVisitors();
  const bannedIps = await prisma.bannedIp.findMany({ select: { ip: true } });
  const bannedSet = new Set(bannedIps.map(b => b.ip));

  const visitors = list.map(v => ({
    ...v,
    isBanned: bannedSet.has(v.ip),
    timeOnline: Math.round((Date.now() - v.entryTime) / 1000),
  }));

  return NextResponse.json({
    total: visitors.length,
    activeCount: getActiveVisitors().length,
    visitors,
  });
}
