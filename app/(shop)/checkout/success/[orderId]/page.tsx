'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle, ShieldCheck, Zap, Loader2, Package, Download,
  ArrowRight, Mail, Calendar, Hash, MessageCircle, ShoppingBag,
  Clock, Star,
} from 'lucide-react';
import { Price } from '@/components/ui/Price';
import { PostPurchaseOffer } from '@/components/shop/UpsellBlock';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCartStore } from '@/store/useCartStore';

interface OrderItem {
  id: string;
  price: number;
  product: { id: string; title: string; imageUrl: string; category: string; price: number };
}

interface OrderData {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  items: OrderItem[];
}

export default function SuccessOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pixelFired = useRef(false);
  const { settings } = useSettingsStore();
  const clearCart = useCartStore(s => s.clearCart);

  useEffect(() => {
    clearCart();
    fetch(`/api/orders/${orderId}/summary`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order not found');
        setOrder(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId, clearCart]);

  // ─── Pixel Tracking (fires once, deduplication via sessionStorage) ───
  useEffect(() => {
    if (!order || pixelFired.current) return;

    const storageKey = `purchase_tracked_${order.id}`;
    if (sessionStorage.getItem(storageKey)) return;

    pixelFired.current = true;
    sessionStorage.setItem(storageKey, '1');

    const contentIds = order.items.map(i => i.product.id);
    const contentNames = order.items.map(i => i.product.title);
    const categories = Array.from(new Set(order.items.map(i => i.product.category)));
    const eventId = `purchase_${order.id}`;

    // ─── Facebook / Meta Pixel ───
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        content_ids: contentIds,
        content_name: contentNames.join(', '),
        content_category: categories.join(', '),
        contents: order.items.map(i => ({
          id: i.product.id,
          quantity: 1,
          item_price: i.price,
        })),
        value: order.total,
        currency: 'BDT',
        num_items: order.items.length,
        content_type: 'product',
        order_id: order.id,
      }, { eventID: eventId });
    }

    // ─── TikTok Pixel ───
    if (typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.track('CompletePayment', {
        content_id: contentIds[0],
        content_type: 'product',
        content_name: contentNames.join(', '),
        quantity: order.items.length,
        value: order.total,
        currency: 'BDT',
      });
    }

    // ─── Google Analytics 4 (gtag) ───
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: 'BDT',
        items: order.items.map(i => ({
          item_id: i.product.id,
          item_name: i.product.title,
          item_category: i.product.category,
          price: i.price,
          quantity: 1,
        })),
      });
    }

    // ─── GTM dataLayer push ───
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: order.id,
          value: order.total,
          currency: 'BDT',
          items: order.items.map(i => ({
            item_id: i.product.id,
            item_name: i.product.title,
            item_category: i.product.category,
            price: i.price,
            quantity: 1,
          })),
        },
      });
    }
  }, [order]);

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
  const orderDate = new Date(order.createdAt).toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-[70vh] px-4 py-8 sm:py-12 max-w-3xl mx-auto">
      {/* ─── Success Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-5"
        >
          <CheckCircle className="h-10 w-10 text-green-500" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-bold text-dark">Payment Successful!</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Thank you for your purchase, <span className="font-medium text-dark">{order.user.name}</span>
        </p>
      </motion.div>

      {/* ─── Main Order Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Order Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex items-start gap-2.5">
            <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Order ID</p>
              <p className="text-xs font-mono font-bold text-dark mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Email</p>
              <p className="text-xs text-dark mt-0.5 truncate max-w-[120px] sm:max-w-none">{order.user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Date</p>
              <p className="text-xs text-dark mt-0.5">{orderDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShoppingBag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">Status</p>
              <p className="text-xs font-semibold text-green-600 mt-0.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Completed
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4 sm:p-6 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items Purchased</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover bg-gray-200 flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark truncate">{item.product.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.product.category}</p>
              </div>
              <span className="text-sm font-bold text-dark flex-shrink-0">
                <Price amount={item.price} />
              </span>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-500">Total Paid</span>
            <span className="text-xl font-black text-dark"><Price amount={order.total} /></span>
          </div>
        </div>

        {/* Access & Trust Section */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gradient-to-b from-green-50/50 to-white">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">Instant Access Granted</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your digital products are now available in your library. You can download them anytime.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-primary text-white gap-2 flex-1 h-11 font-semibold shadow-lg shadow-primary/20" asChild>
              <Link href="/dashboard">
                <Download className="h-4 w-4" /> Download / Access Products
              </Link>
            </Button>
            <Button variant="outline" className="gap-2 flex-1 h-11 font-medium" asChild>
              <Link href="/products">
                <ArrowRight className="h-4 w-4" /> Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Trust Badges ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3 mt-6"
      >
        {[
          { icon: ShieldCheck, label: 'Secure Payment', color: 'text-green-600 bg-green-50' },
          { icon: Clock, label: 'Instant Delivery', color: 'text-blue-600 bg-blue-50' },
          { icon: Star, label: 'Premium Quality', color: 'text-amber-600 bg-amber-50' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gray-100">
            <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 text-center">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* ─── Support CTA ─── */}
      {settings?.whatsappNumber && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark">Need help?</p>
              <p className="text-xs text-gray-400">We're here to assist you</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Chat Support
          </a>
        </motion.div>
      )}

      {/* ─── Post-Purchase Upsell / You May Also Like ─── */}
      {productIds.length > 0 && <PostPurchaseOffer purchasedProductIds={productIds} />}
    </div>
  );
}
