import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'products');
  if (error) return error;

  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products);
}
