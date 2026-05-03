'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Zap, Loader2, Package } from 'lucide-react';
import { Price } from '@/components/ui/Price';
import { PostPurchaseOffer } from '@/components/shop/UpsellBlock';

interface OrderData {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { id: string; price: number; product: { id: string; title: string; imageUrl: string; category: string } }[];
}

export default function SuccessOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${orderId}/summary`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order not found');
        setOrder(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <ShieldCheck className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6 max-w-sm">{error || 'This order does not exist.'}</p>
        <Button className="bg-primary text-white" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const productIds = order.items.map(i => i.product.id);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center max-w-md w-full"
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
        <p className="text-gray-500 mb-1">Thank you for your purchase.</p>
        <p className="text-xs text-gray-400 mb-6 font-mono">Order #{order.id.slice(-10).toUpperCase()}</p>

        {/* Order Items */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 text-left">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{item.product.title}</p>
                <p className="text-xs text-gray-400">{item.product.category}</p>
              </div>
              <span className="text-sm font-semibold text-dark flex-shrink-0"><Price amount={item.price} /></span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <span className="text-sm font-bold text-dark"><Price amount={order.total} /></span>
          </div>
        </div>

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
      {productIds.length > 0 && <PostPurchaseOffer purchasedProductIds={productIds} />}
    </div>
  );
}
