import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHash, getEpsToken, clearTokenCache, EPS_BASE } from '@/lib/eps';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://crackncodepremium.com';

  // Extract transaction IDs from EPS callback (various casing)
  const merchantTransactionId =
    params.get('merchantTransactionId') ||
    params.get('MerchantTransactionId') ||
    params.get('merchant_transaction_id') ||
    '';

  const epsTransactionId =
    params.get('EPSTransactionId') ||
    params.get('epsTransactionId') ||
    params.get('transactionId') ||
    params.get('TransactionId') ||
    '';

  const status =
    params.get('Status') ||
    params.get('status') ||
    '';

  // If EPS reports failure/cancel directly in callback params
  if (status && status.toLowerCase() !== 'success' && status.toLowerCase() !== 'valid') {
    return NextResponse.redirect(`${origin}/checkout/fail`);
  }

  // Need at least one transaction ID to verify
  if (!merchantTransactionId && !epsTransactionId) {
    return NextResponse.redirect(`${origin}/checkout/fail`);
  }

  try {
    // 1. Find existing PENDING order
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(merchantTransactionId ? [{ epsMerchantTxId: merchantTransactionId }] : []),
          ...(epsTransactionId ? [{ epsTransactionId: epsTransactionId }] : []),
        ],
      },
      include: { items: { select: { productId: true } } },
    });

    // Already completed — redirect to success
    if (existingOrder?.status === 'COMPLETED') {
      return NextResponse.redirect(`${origin}/checkout/success/${existingOrder.id}`);
    }

    // 2. Verify with EPS gateway
    const token = await getEpsToken();
    const hashInput = merchantTransactionId || epsTransactionId;
    const xHash = generateHash(hashInput);

    const queryParam = merchantTransactionId
      ? `merchantTransactionId=${merchantTransactionId}`
      : `EPSTransactionId=${epsTransactionId}`;

    let data: any;
    const epsRes = await fetch(`${EPS_BASE}/EPSEngine/CheckMerchantTransactionStatus?${queryParam}`, {
      headers: { 'x-hash': xHash, Authorization: `Bearer ${token}` },
    });

    if (epsRes.status === 401) {
      clearTokenCache();
      const freshToken = await getEpsToken(true);
      const retryRes = await fetch(`${EPS_BASE}/EPSEngine/CheckMerchantTransactionStatus?${queryParam}`, {
        headers: { 'x-hash': xHash, Authorization: `Bearer ${freshToken}` },
      });
      const retryText = await retryRes.text();
      if (!retryText) return NextResponse.redirect(`${origin}/checkout/fail`);
      try { data = JSON.parse(retryText); } catch { return NextResponse.redirect(`${origin}/checkout/fail`); }
    } else {
      const resText = await epsRes.text();
      if (!resText) return NextResponse.redirect(`${origin}/checkout/fail`);
      try { data = JSON.parse(resText); } catch { return NextResponse.redirect(`${origin}/checkout/fail`); }
    }

    // 3. Check EPS status
    const epsStatus = (data.Status || data.status || '').toLowerCase();
    if (epsStatus !== 'success') {
      // Mark order as cancelled
      if (existingOrder && existingOrder.status === 'PENDING') {
        await prisma.order.update({ where: { id: existingOrder.id }, data: { status: 'CANCELLED' } }).catch(() => {});
      }
      return NextResponse.redirect(`${origin}/checkout/fail`);
    }

    // 4. Payment successful — update order
    const epsTransId = data.EPSTransactionId || data.epsTransactionId || epsTransactionId || '';
    const epsMerchantId = data.MerchantTransactionId || merchantTransactionId || '';

    let orderId: string;

    if (existingOrder) {
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
      // Fallback: create order from EPS data
      const userId = data.ValueA || data.valueA || '';
      const rawProductIds = data.ValueB || data.valueB || '';
      const productIds = rawProductIds ? rawProductIds.split(',').filter(Boolean) : [];

      if (!userId || productIds.length === 0) {
        return NextResponse.redirect(`${origin}/checkout/fail`);
      }

      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const epsAmount = parseFloat(data.TotalAmount || data.totalAmount || data.Amount || '0');
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

    // 5. Redirect to clean success URL
    return NextResponse.redirect(`${origin}/checkout/success/${orderId}`);
  } catch (err: any) {
    console.error('[eps/callback] Error:', err?.message);
    return NextResponse.redirect(`${origin}/checkout/fail`);
  }
}
