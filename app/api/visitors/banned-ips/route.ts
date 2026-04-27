import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rows = await prisma.bannedIp.findMany({ select: { ip: true } });
    return NextResponse.json(rows.map(r => r.ip));
  } catch {
    return NextResponse.json([]);
  }
}
