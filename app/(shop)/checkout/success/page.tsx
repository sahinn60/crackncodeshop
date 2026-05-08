'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('eps-payment-pending');
    clearCart();

    // If there's a merchantTransactionId in URL (old flow or direct EPS redirect),
    // verify via API and redirect to clean URL
    const merchantTransactionId =
      searchParams.get('merchantTransactionId') ||
      searchParams.get('MerchantTransactionId') ||
      null;

    const epsTransactionId =
      searchParams.get('EPSTransactionId') ||
      searchParams.get('epsTransactionId') ||
      searchParams.get('transactionId') ||
      null;

    if (merchantTransactionId || epsTransactionId) {
      // Verify and redirect to clean URL
      fetch('/api/eps/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantTransactionId, epsTransactionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.orderId) {
            router.replace(`/checkout/success/${data.orderId}`);
          } else {
            setShowFallback(true);
          }
        })
        .catch(() => setShowFallback(true));
    } else {
      // No transaction params — show generic success or redirect to dashboard
      setShowFallback(true);
    }
  }, []);

  if (showFallback) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6 max-w-sm">Your order has been processed. Check your dashboard for access to your products.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-primary text-white" asChild>
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
      <p className="text-sm font-medium">Processing your payment...</p>
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
