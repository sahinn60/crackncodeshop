import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateHash, getEpsToken, clearTokenCache, EPS_BASE } from '@/lib/eps';

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { productIds, customerName, customerEmail, customerPhone, couponCode } = await req.json();

  if (!Array.isArray(productIds) || productIds.length === 0)
    return NextResponse.json({ error: 'productIds required' }, { status: 400 });

  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length === 0)
    return NextResponse.json({ error: 'No valid products found' }, { status: 404 });

  let total = products.reduce((sum, p) => sum + p.price, 0);

  // Apply coupon discount
  if (couponCode) {
    const now = new Date();
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    if (coupon && coupon.isActive && coupon.startDate <= now && (!coupon.endDate || coupon.endDate >= now)) {
      const disc = coupon.discount.trim();
      let discountAmount = 0;
      if (disc.endsWith('%')) {
        const pct = parseFloat(disc);
        if (!isNaN(pct)) discountAmount = Math.round((total * pct) / 100);
      } else {
        const flat = parseFloat(disc);
        if (!isNaN(flat)) discountAmount = flat;
      }
      total = Math.max(0, total - Math.min(discountAmount, total));
    }
  }
  const merchantTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const customerOrderId = `ORD${Date.now()}`;

  // Use the request origin so EPS redirects back to the correct domain
  // (works for both localhost and production)
  const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const token = await getEpsToken();
    const xHash = generateHash(merchantTransactionId);

    const body = {
      merchantId: process.env.EPS_MERCHANT_ID,
      storeId: process.env.EPS_STORE_ID,
      CustomerOrderId: customerOrderId,
      merchantTransactionId,
      transactionTypeId: 1,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: Math.round(total),
      successUrl: `${origin}/checkout/success?merchantTransactionId=${merchantTransactionId}`,
      failUrl: `${origin}/checkout/fail`,
      cancelUrl: `${origin}/checkout/fail`,
      customerName,
      customerEmail,
      customerAddress: 'N/A',
      CustomerCity: 'N/A',
      CustomerState: 'N/A',
      CustomerPostcode: '0000',
      CustomerCountry: 'BD',
      CustomerPhone: customerPhone,
      ShippingMethod: 'NO',
      NoOfItem: String(products.length),
      ProductName: products.map(p => p.title).join(', '),
      ProductProfile: 'digital',
      ProductCategory: 'Software',
      ValueA: user!.id,
      ValueB: productIds.join(','),
      ProductList: products.map(p => ({
        ProductName: p.title,
        NoOfItem: '1',
        ProductProfile: 'digital',
        ProductCategory: p.category,
        ProductPrice: String(p.price),
      })),
    };

    const epsRes = await fetch(`${EPS_BASE}/EPSEngine/InitializeEPS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hash': xHash,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // If unauthorized, clear cached token and retry once with a fresh token
    if (epsRes.status === 401) {
      clearTokenCache();
      const freshToken = await getEpsToken(true);
      const retryRes = await fetch(`${EPS_BASE}/EPSEngine/InitializeEPS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hash': xHash,
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify(body),
      });
      const retryData = await retryRes.json();
      if (!retryData.RedirectURL)
        return NextResponse.json({ error: retryData.ErrorMessage || 'EPS initialization failed' }, { status: 502 });
      return NextResponse.json({ redirectUrl: retryData.RedirectURL, transactionId: retryData.TransactionId });
    }

    const epsData = await epsRes.json();

    if (!epsData.RedirectURL)
      return NextResponse.json({ error: epsData.ErrorMessage || 'EPS initialization failed' }, { status: 502 });

    return NextResponse.json({ redirectUrl: epsData.RedirectURL, transactionId: epsData.TransactionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment initiation failed' }, { status: 500 });
  }
}
