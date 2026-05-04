import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  const { productId } = await req.json();
  if (!productId || typeof productId !== 'string')
    return NextResponse.json({ error: 'productId required' }, { status: 400 });

  // Debounce: same IP + same product = max 1 per 30 seconds
  const { success } = rateLimit(`cart:${ip}:${productId}`, 1, 30_000);
  if (!success) return NextResponse.json({ ok: true }); // silently ignore spam

  // Global rate limit: 30 cart tracks per minute per IP
  const { success: globalOk } = rateLimit(`cart-global:${ip}`, 30, 60_000);
  if (!globalOk) return NextResponse.json({ ok: true });

  await prisma.product.update({
    where: { id: productId },
    data: { cartCount: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
