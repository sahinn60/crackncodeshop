import { NextRequest, NextResponse } from 'next/server';
import { generateHash, EPS_BASE } from '@/lib/eps';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    epsBase: EPS_BASE,
    envCheck: {
      EPS_USERNAME: !!process.env.EPS_USERNAME,
      EPS_PASSWORD: !!process.env.EPS_PASSWORD,
      EPS_MERCHANT_ID: !!process.env.EPS_MERCHANT_ID,
      EPS_STORE_ID: !!process.env.EPS_STORE_ID,
      EPS_HASH_KEY: !!process.env.EPS_HASH_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(NOT SET)',
    },
    tokenTest: null,
    initTest: null,
  };

  // Step 1: Test GetToken
  try {
    const username = process.env.EPS_USERNAME!;
    const xHash = generateHash(username);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const startTime = Date.now();
    const res = await fetch(`${EPS_BASE}/Auth/GetToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hash': xHash },
      body: JSON.stringify({ userName: username, password: process.env.EPS_PASSWORD }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const elapsed = Date.now() - startTime;
    const bodyText = await res.text();

    results.tokenTest = {
      status: res.status,
      elapsed: `${elapsed}ms`,
      bodyLength: bodyText.length,
      bodyPreview: bodyText.slice(0, 500),
      headers: {
        contentType: res.headers.get('content-type'),
        server: res.headers.get('server'),
      },
    };

    // Step 2: If token obtained, test InitializeEPS
    if (bodyText && res.status === 200) {
      try {
        const tokenData = JSON.parse(bodyText);
        if (tokenData.token) {
          const txnId = `DIAG${Date.now()}`;
          const txnHash = generateHash(txnId);

          const initBody = {
            merchantId: process.env.EPS_MERCHANT_ID,
            storeId: process.env.EPS_STORE_ID,
            CustomerOrderId: 'diag-test',
            merchantTransactionId: txnId,
            transactionTypeId: 1,
            financialEntityId: 0,
            transitionStatusId: 0,
            totalAmount: 1,
            successUrl: 'https://crackncodepremium.com/api/eps/callback?merchantTransactionId=' + txnId,
            failUrl: 'https://crackncodepremium.com/checkout/fail',
            cancelUrl: 'https://crackncodepremium.com/checkout/fail',
            customerName: 'Diagnostic Test',
            customerEmail: 'diag@test.com',
            customerAddress: 'N/A',
            CustomerCity: 'N/A',
            CustomerState: 'N/A',
            CustomerPostcode: '0000',
            CustomerCountry: 'BD',
            CustomerPhone: '01700000000',
            ShippingMethod: 'NO',
            NoOfItem: '1',
            ProductName: 'Diagnostic Test',
            ProductProfile: 'digital',
            ProductCategory: 'Software',
            ValueA: 'diag',
            ValueB: 'diag',
          };

          const controller2 = new AbortController();
          const timeout2 = setTimeout(() => controller2.abort(), 15000);
          const startTime2 = Date.now();

          const initRes = await fetch(`${EPS_BASE}/EPSEngine/InitializeEPS`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hash': txnHash,
              Authorization: `Bearer ${tokenData.token}`,
            },
            body: JSON.stringify(initBody),
            signal: controller2.signal,
          }).finally(() => clearTimeout(timeout2));

          const elapsed2 = Date.now() - startTime2;
          const initText = await initRes.text();

          results.initTest = {
            status: initRes.status,
            elapsed: `${elapsed2}ms`,
            bodyLength: initText.length,
            bodyPreview: initText.slice(0, 500),
          };
        }
      } catch (e: any) {
        results.initTest = { error: e.name === 'AbortError' ? 'TIMEOUT (15s)' : e.message };
      }
    }
  } catch (e: any) {
    results.tokenTest = { error: e.name === 'AbortError' ? 'TIMEOUT (15s)' : e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
