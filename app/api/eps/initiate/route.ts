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

  // Calculate flash sale prices
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

  let total = products.reduce((sum, p) => sum + (flashPriceMap.get(p.id) ?? p.price), 0);

  // Apply coupon discount
  if (couponCode) {
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

      // Record coupon usage
      await prisma.couponUsage.upsert({
        where: { couponId_userId: { couponId: coupon.id, userId: user!.id } },
        create: { couponId: coupon.id, userId: user!.id },
        update: {},
      }).catch(() => {});
    }
  }

  const merchantTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // ✅ CREATE PENDING ORDER BEFORE PAYMENT
  // This ensures we NEVER lose a successful payment
  const order = await prisma.order.create({
    data: {
      userId: user!.id,
      total: Math.round(total),
      status: 'PENDING',
      epsMerchantTxId: merchantTransactionId,
      epsTransactionId: '',
      items: {
        create: products.map(p => ({
          productId: p.id,
          price: flashPriceMap.get(p.id) ?? p.price,
        })),
      },
    },
  });

  const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const token = await getEpsToken();
    const xHash = generateHash(merchantTransactionId);

    const body = {
      merchantId: process.env.EPS_MERCHANT_ID,
      storeId: process.env.EPS_STORE_ID,
      CustomerOrderId: order.id,
      merchantTransactionId,
      transactionTypeId: 1,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: Math.round(total),
      successUrl: `${origin}/api/eps/callback?merchantTransactionId=${merchantTransactionId}`,
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

    let epsData: any;

    const epsRes = await fetch(`${EPS_BASE}/EPSEngine/InitializeEPS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hash': xHash,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

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
      epsData = await retryRes.json();
    } else {
      epsData = await epsRes.json();
    }

    if (!epsData.RedirectURL) {
      // Mark order as CANCELLED if EPS fails to initialize
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
      return NextResponse.json({ error: epsData.ErrorMessage || 'EPS initialization failed' }, { status: 502 });
    }

    // Store EPS transaction ID on the order
    if (epsData.TransactionId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { epsTransactionId: String(epsData.TransactionId) },
      });
    }

    return NextResponse.json({
      redirectUrl: epsData.RedirectURL,
      transactionId: epsData.TransactionId,
      orderId: order.id,
    });
  } catch (err: any) {
    // Mark order as CANCELLED on error
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } }).catch(() => {});
    return NextResponse.json({ error: err.message || 'Payment initiation failed' }, { status: 500 });
  }
}
