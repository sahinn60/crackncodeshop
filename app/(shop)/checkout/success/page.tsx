'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { PostPurchaseOffer } from '@/components/shop/UpsellBlock';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [orderId, setOrderId] = useState('');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    sessionStorage.removeItem('eps-payment-pending');

    // EPS may use different param name casing — check all variations
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

    // Use bare fetch to avoid apiClient auth interceptor issues
    // (user's JWT may have expired during the EPS payment flow)
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
        setOrderId(data.orderId);
        setPurchasedIds(data.productIds || []);
        clearCart();
        setStatus('success');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Payment verification failed.');
        setStatus('error');
      });
  }, []);

  if (status === 'verifying') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Verifying your payment...</p>
      </div>
    );
  }

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
        >
          <CheckCircle className="h-10 w-10 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-dark mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Order #{orderId.slice(-10).toUpperCase()}</p>
        )}
        <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
          <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-dark">Instant Access Granted</p>
            <p className="text-xs text-gray-400 mt-0.5">Your digital products are now available in your library.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="bg-primary text-white gap-2" asChild>
            <Link href="/dashboard"><Zap className="h-4 w-4" /> Go to My Library</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </motion.div>
      {purchasedIds.length > 0 && <PostPurchaseOffer purchasedProductIds={purchasedIds} />}
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
