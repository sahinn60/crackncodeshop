import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHash, getEpsToken, clearTokenCache, EPS_BASE } from '@/lib/eps';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success: rlOk } = rateLimit(`eps-verify:${ip}`, 15, 60_000);
  if (!rlOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { merchantTransactionId, epsTransactionId } = body;

  if (!merchantTransactionId && !epsTransactionId)
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });

  try {
    // 1. Find existing order (created during initiation)
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(merchantTransactionId ? [{ epsMerchantTxId: merchantTransactionId }] : []),
          ...(epsTransactionId ? [{ epsTransactionId: epsTransactionId }] : []),
        ],
      },
      include: { items: { select: { productId: true } } },
    });

    // If order already COMPLETED, return success (idempotent)
    if (existingOrder?.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
        productIds: existingOrder.items.map(i => i.productId),
        duplicate: true,
      });
    }

    // 2. Verify with EPS gateway
    const token = await getEpsToken();
    const hashInput = merchantTransactionId || epsTransactionId;
    const xHash = generateHash(hashInput);

    const params = merchantTransactionId
      ? `merchantTransactionId=${merchantTransactionId}`
      : `EPSTransactionId=${epsTransactionId}`;

    let data: any;
    const epsRes = await fetch(`${EPS_BASE}/EPSEngine/CheckMerchantTransactionStatus?${params}`, {
      headers: { 'x-hash': xHash, Authorization: `Bearer ${token}` },
    });

    if (epsRes.status === 401) {
      clearTokenCache();
      const freshToken = await getEpsToken(true);
      const retryRes = await fetch(`${EPS_BASE}/EPSEngine/CheckMerchantTransactionStatus?${params}`, {
        headers: { 'x-hash': xHash, Authorization: `Bearer ${freshToken}` },
      });
      data = await retryRes.json();
    } else {
      data = await epsRes.json();
    }

    // 3. Check payment status
    const epsStatus = (data.Status || data.status || '').toLowerCase();
    if (epsStatus !== 'success') {
      // Update order to reflect failure
      if (existingOrder && existingOrder.status === 'PENDING') {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: 'CANCELLED' },
        }).catch(() => {});
      }
      return NextResponse.json({
        error: data.ErrorMessage || data.errorMessage || `Payment not successful (${epsStatus})`,
        status: epsStatus,
      }, { status: 402 });
    }

    // 4. Payment successful — update or create order
    const epsTransId = data.EPSTransactionId || data.epsTransactionId || epsTransactionId || '';
    const epsMerchantId = data.MerchantTransactionId || merchantTransactionId || '';
    const userId = data.ValueA || data.valueA || existingOrder?.userId || '';
    const rawProductIds = data.ValueB || data.valueB || '';
    const productIds = rawProductIds ? rawProductIds.split(',').filter(Boolean) : existingOrder?.items.map(i => i.productId) || [];

    if (!userId || productIds.length === 0)
      return NextResponse.json({ error: 'Missing order metadata' }, { status: 400 });

    let orderId: string;

    if (existingOrder) {
      // Update existing PENDING order to COMPLETED
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: 'COMPLETED',
          epsTransactionId: epsTransId,
          epsMerchantTxId: epsMerchantId,
        },
      });
      orderId = existingOrder.id;
    } else {
      // Fallback: create order if somehow it doesn't exist (e.g., webhook scenario)
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const epsAmount = parseFloat(data.TotalAmount || data.totalAmount || data.Amount || data.amount || '0');
      const total = epsAmount > 0 ? epsAmount : products.reduce((sum, p) => sum + p.price, 0);

      const newOrder = await prisma.order.create({
        data: {
          userId,
          total,
          status: 'COMPLETED',
          epsTransactionId: epsTransId,
          epsMerchantTxId: epsMerchantId,
          items: { create: products.map(p => ({ productId: p.id, price: p.price })) },
        },
      });
      orderId = newOrder.id;
    }

    return NextResponse.json({ success: true, orderId, productIds });
  } catch (err: any) {
    console.error('[eps/verify] Error:', err?.message, err?.stack);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
