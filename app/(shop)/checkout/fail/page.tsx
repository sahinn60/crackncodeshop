'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CheckoutFailPage() {
  useEffect(() => {
    sessionStorage.removeItem('eps-payment-pending');
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Payment Unsuccessful</h2>
        <p className="text-gray-500 mb-6">
          Your payment could not be completed. No charges were made. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="bg-primary text-white" asChild>
            <Link href="/checkout">Try Again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
