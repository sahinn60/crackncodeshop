'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

function FailContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  useEffect(() => {
    sessionStorage.removeItem('eps-payment-pending');
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6"
        >
          <XCircle className="h-10 w-10 text-red-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-dark mb-2">Payment Unsuccessful</h2>
        <p className="text-gray-500 mb-6">
          {reason === 'cancel' ? 'You cancelled the payment.' : 'Your payment could not be processed. Please try again.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="bg-primary text-white" asChild>
            <Link href="/checkout">Try Again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return <Suspense><FailContent /></Suspense>;
}
