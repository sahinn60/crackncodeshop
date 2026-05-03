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

    fetch('/api/eps/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantTransactionId, epsTransactionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        return data;
      })
      .then((data) => {
        clearCart();
        // Redirect to clean URL with only the order ID
        router.replace(`/checkout/success/${data.orderId}`);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Payment verification failed.');
        setStatus('error');
      });
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <ShieldCheck className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Payment Failed</h2>
        <p className="text-gray-500 mb-6 max-w-sm">{errorMsg}</p>
        <Button className="bg-primary text-white" asChild>
          <Link href="/checkout">Try Again</Link>
        </Button>
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
