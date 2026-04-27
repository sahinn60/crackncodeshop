'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Package, ShoppingCart, Zap, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/shop/ProductCard';
import { apiClient } from '@/lib/axios';
import { useCartStore } from '@/store/useCartStore';
import { Price } from '@/components/ui/Price';
import { DailyCountdown } from '@/components/shop/DailyCountdown';
import type { Bundle } from '@/components/shop/BundleCard';

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addItem } = useCartStore();

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/bundles/${slug}`)
      .then(({ data }) => setBundle(data))
      .catch(() => router.push('/products?category=bundles'))
      .finally(() => setIsLoading(false));
  }, [slug, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!bundle) return null;

  const handleAddAll = () => {
    bundle.products.forEach(p =>
      addItem({ ...p, oldPrice: p.price, price: p.price * (1 - bundle.discount / 100) })
    );
  };

  const handleBuyNow = () => {
    bundle.products.forEach(p =>
      addItem({ ...p, oldPrice: p.price, price: p.price * (1 - bundle.discount / 100) }, true)
    );
    router.push('/checkout');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
        <Link href="/products?category=bundles" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-5 sm:mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to bundles
        </Link>

        {/* Bundle Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-purple-100 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 sm:px-10 py-8 sm:py-12 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-200">Bundle Deal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-3">{bundle.name}</h1>
            {bundle.description && <p className="text-purple-200 text-base sm:text-lg max-w-2xl">{bundle.description}</p>}

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
              <div>
                <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Bundle Price</p>
                <p className="text-3xl sm:text-4xl font-black"><Price amount={bundle.bundlePrice} /></p>
              </div>
              {bundle.discount > 0 && (
                <>
                  <div>
                    <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Original</p>
                    <p className="text-xl text-purple-300 line-through"><Price amount={bundle.originalPrice} /></p>
                  </div>
                  <span className="bg-green-400 text-green-900 text-sm font-extrabold px-4 py-2 rounded-full">
                    Save {bundle.discount}%
                  </span>
                </>
              )}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-md">
              <Button onClick={handleAddAll} className="flex-1 h-12 gap-2 bg-white text-purple-700 hover:bg-purple-50 font-bold shadow-lg">
                <ShoppingCart className="h-5 w-5" /> Add All to Cart
              </Button>
              <Button onClick={handleBuyNow} className="flex-1 h-12 gap-2 bg-purple-900 hover:bg-purple-950 text-white font-bold shadow-lg">
                <Zap className="h-5 w-5" /> Buy Bundle Now
              </Button>
            </div>

            {bundle.isDailyTimer && (
              <div className="mt-6">
                <DailyCountdown endTime={bundle.endTime} variant="hero" />
              </div>
            )}
          </div>

          {/* What's Included */}
          <div className="px-6 sm:px-10 py-8 sm:py-10">
            <h2 className="text-lg sm:text-xl font-bold text-dark mb-2 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" /> What&apos;s Included ({bundle.products.length} products)
            </h2>
            <p className="text-sm text-gray-500 mb-6">All products below are included in this bundle at a discounted price.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {bundle.products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
