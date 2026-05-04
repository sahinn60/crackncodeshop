'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ShieldCheck, Loader2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();

  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    sessionStorage.removeItem('eps-payment-pending');

    const merchantTransactionId =
      searchParams.get('merchantTransactionId') ||
      searchParams.get('MerchantTransactionId') ||
      searchParams.get('merchant_transaction_id') ||
      null;

    const epsTransactionId =
      searchParams.get('EPSTransactionId') ||
      searchParams.get('epsTransactionId') ||
      searchParams.get('eps_transaction_id') ||
      searchParams.get('transactionId') ||
      searchParams.get('TransactionId') ||
      null;

    if (!merchantTransactionId && !epsTransactionId) {
      setStatus('error');
      setErrorMsg('Missing transaction information. Please contact support.');
      return;
    }

    const verifyPayment = (retries = 3) => {
      fetch('/api/eps/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantTransactionId, epsTransactionId }),
      })
        .then(async (res) => {
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { throw new Error('Server returned invalid response'); }
          if (!res.ok) {
            // If rate limited or server error, retry after delay
            if ((res.status === 500 || res.status === 429) && retries > 0) {
              throw { retry: true, message: data.error };
            }
            throw new Error(data.error || `Verification failed (${res.status})`);
          }
          return data;
        })
        .then((data) => {
          clearCart();
          router.replace(`/checkout/success/${data.orderId}`);
        })
        .catch((err) => {
          if (err?.retry && retries > 0) {
            setTimeout(() => verifyPayment(retries - 1), 5000);
            return;
          }
          console.error('[checkout/success] Verify error:', err);
          setErrorMsg(err.message || 'Payment verification failed. Please contact support.');
          setStatus('error');
        });
    };

    verifyPayment();
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
          <ShieldCheck className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Payment Processing</h2>
        <p className="text-gray-500 mb-2 max-w-sm">{errorMsg}</p>
        <p className="text-xs text-gray-400 mb-6 max-w-sm">If you were charged, your order will appear in your dashboard shortly. Please do not pay again.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-primary text-white gap-2" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-gray-500">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium">Verifying your payment...</p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
