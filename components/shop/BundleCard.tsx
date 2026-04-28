'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Zap, Package } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Price } from '@/components/ui/Price';
import { DailyCountdown } from '@/components/shop/DailyCountdown';

interface BundleProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  category: string;
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  discount: number;
  isDailyTimer?: boolean;
  endTime?: string | null;
  products: BundleProduct[];
  originalPrice: number;
  bundlePrice: number;
}

export function BundleCard({ bundle }: { bundle: Bundle }) {
  const { addItem } = useCartStore();
  const router = useRouter();

  const handleAddAll = () => {
    bundle.products.forEach(p => addItem({ ...p, oldPrice: p.price, price: p.price * (1 - bundle.discount / 100) }));
  };

  const handleBuyNow = () => {
    bundle.products.forEach((p) =>
      addItem({ ...p, oldPrice: p.price, price: p.price * (1 - bundle.discount / 100) }, true)
    );
    router.push('/checkout');
  };

  return (
    <div className="group flex flex-col rounded-xl sm:rounded-2xl border border-purple-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden h-full relative">
      <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-purple-50 to-purple-100">
        {bundle.imageUrl ? (
          <Link href={`/bundles/${bundle.slug}`} className="block w-full h-full">
            <img src={bundle.imageUrl} alt={bundle.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
          </Link>
        ) : (
          <Link href={`/bundles/${bundle.slug}`} className="w-full h-full flex items-center justify-center">
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 max-w-[85%]">
              {bundle.products.slice(0, 4).map(p => (
                <img key={p.id} src={p.imageUrl} alt={p.title} className="h-12 w-12 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl object-cover border-2 border-white shadow-md" />
              ))}
              {bundle.products.length > 4 && (
                <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl bg-purple-200 border-2 border-white shadow-md flex items-center justify-center text-purple-700 font-bold text-[10px] sm:text-sm">
                  +{bundle.products.length - 4}
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 pointer-events-none flex flex-col gap-1">
          <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-purple-600 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Bundle
          </span>
          <span className="inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-gray-600 shadow-sm backdrop-blur-sm">
            {bundle.products.length} items
          </span>
        </div>

        {bundle.discount > 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 pointer-events-none">
            <span className="inline-flex items-center rounded-md sm:rounded-lg bg-green-500 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-extrabold text-white shadow-md">
              -{bundle.discount}%
            </span>
          </div>
        )}

        {bundle.isDailyTimer && (
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 pointer-events-none">
            <DailyCountdown endTime={bundle.endTime} variant="card" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <Link href={`/bundles/${bundle.slug}`}>
          <h3 className="text-xs sm:text-sm font-normal text-slate-600 group-hover:text-purple-700 transition-colors line-clamp-1 leading-snug mb-1">{bundle.name}</h3>
        </Link>

        {/* Pricing */}
        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100 flex items-center gap-1.5">
          <span className="text-sm sm:text-base font-semibold text-dark"><Price amount={bundle.bundlePrice} /></span>
          {bundle.discount > 0 && (
            <span className="text-[9px] sm:text-xs text-gray-400 line-through"><Price amount={bundle.originalPrice} /></span>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
          <Button size="sm" variant="outline" onClick={handleAddAll} className="w-full gap-1 border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg transition-colors font-medium text-[9px] sm:text-xs h-7 sm:h-8">
            <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Add
          </Button>
          <Button size="sm" onClick={handleBuyNow} className="w-full gap-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm font-semibold text-[9px] sm:text-xs h-7 sm:h-8">
            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Buy
          </Button>
        </div>
      </div>
    </div>
  );
}
