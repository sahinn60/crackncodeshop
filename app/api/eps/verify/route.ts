import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHash, getEpsToken, clearTokenCache, EPS_BASE } from '@/lib/eps';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // Rate limit to prevent brute-force transaction ID guessing
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { success: rlOk } = rateLimit(`eps-verify:${ip}`, 10, 60_000);
  if (!rlOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { merchantTransactionId, epsTransactionId } = await req.json();

  if (!merchantTransactionId && !epsTransactionId)
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });

  try {
    // 1. Duplicate check — if order already exists for this txn, return it
    const txnId = merchantTransactionId || epsTransactionId || '';
    if (txnId) {
      const existing = await prisma.order.findFirst({
        where: {
          OR: [
            { epsMerchantTxId: txnId },
            { epsTransactionId: txnId },
          ],
        },
        include: { items: { select: { productId: true } } },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          orderId: existing.id,
          productIds: existing.items.map(i => i.productId),
          duplicate: true,
        });
      }
    }

    // 2. Get EPS token and verify with EPS
    const token = await getEpsToken();
    const hashInput = merchantTransactionId || epsTransactionId;
    const xHash = generateHash(hashInput);

    const params = merchantTransactionId
      ? `merchantTransactionId=${merchantTransactionId}`
      : `EPSTransactionId=${epsTransactionId}`;

    const epsRes = await fetch(`${EPS_BASE}/EPSEngine/CheckMerchantTransactionStatus?${params}`, {
      headers: { 'x-hash': xHash, Authorization: `Bearer ${token}` },
    });

    let data;
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

    // 3. Validate EPS response — handle different casing
    const epsStatus = data.Status || data.status || '';
    if (epsStatus !== 'Success' && epsStatus !== 'success' && epsStatus !== 'SUCCESS')
      return NextResponse.json({ error: data.ErrorMessage || data.errorMessage || `Payment not successful (${epsStatus})`, status: epsStatus }, { status: 402 });

    // 3b. Verify EPS response hash if provided (anti-tampering)
    if (data.VerificationHash) {
      const expectedHash = generateHash(data.EPSTransactionId || '');
      if (expectedHash !== data.VerificationHash) {
        return NextResponse.json({ error: 'Payment verification hash mismatch' }, { status: 403 });
      }
    }

    // 3c. Verify the userId from EPS matches a real user
    const userId = data.ValueA || data.valueA || '';
    const rawProductIds = data.ValueB || data.valueB || '';
    const productIds = rawProductIds.split(',').filter(Boolean);

    if (!userId || productIds.length === 0)
      return NextResponse.json({ error: 'Missing order metadata' }, { status: 400 });

    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists)
      return NextResponse.json({ error: 'Invalid user in payment data' }, { status: 400 });

    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    // Calculate expected total with flash sale discounts
    const now = new Date();
    const activeSales = await prisma.flashSale.findMany({
      where: { isActive: true },
      include: { items: { select: { productId: true } } },
    });
    const flashPriceMap = new Map<string, number>();
    for (const sale of activeSales) {
      let isLive = false;
      if (sale.isDaily) {
        isLive = true;
      } else if (sale.startTime && sale.endTime) {
        isLive = now >= sale.startTime && now <= sale.endTime;
      }
      if (!isLive || sale.discountPercentage <= 0) continue;
      for (const item of sale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const salePrice = product.price * (1 - sale.discountPercentage / 100);
          const existing = flashPriceMap.get(item.productId);
          if (!existing || salePrice < existing) flashPriceMap.set(item.productId, salePrice);
        }
      }
    }
    const expectedTotal = products.reduce((sum, p) => sum + (flashPriceMap.get(p.id) ?? p.price), 0);

    // Allow small tolerance for coupon discounts — total from EPS should be <= expected
    const epsAmount = parseFloat(data.TotalAmount || data.totalAmount || data.Amount || data.amount || '0');
    if (epsAmount > 0 && epsAmount > expectedTotal * 1.01) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Use EPS amount if available (includes coupon discount), otherwise use calculated total
    const total = epsAmount > 0 ? epsAmount : expectedTotal;

    // 5. Create order
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: 'COMPLETED',
        epsTransactionId: data.EPSTransactionId || data.epsTransactionId || epsTransactionId || '',
        epsMerchantTxId: data.MerchantTransactionId || merchantTransactionId || '',
        items: { create: products.map(p => ({ productId: p.id, price: flashPriceMap.get(p.id) ?? p.price })) },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, orderId: order.id, productIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
