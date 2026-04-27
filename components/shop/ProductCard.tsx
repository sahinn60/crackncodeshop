'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Star, ShoppingCart, Heart, Eye, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/useCartStore';
import { Price } from '@/components/ui/Price';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  category: string;
  isBundle?: boolean;
  isTopSelling?: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { addItem } = useCartStore();
  const router = useRouter();

  const handleBuyNow = () => {
    addItem(product, true);
    setIsQuickViewOpen(false);
    router.push('/checkout');
  };

  const discountPct = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <>
      <div className="group flex flex-col rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden h-full relative">
        <div className="aspect-square overflow-hidden relative bg-gray-100">
          <Link href={`/products/${product.id}`} className="block w-full h-full">
            <img src={product.imageUrl} alt={product.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
          </Link>

          {/* Top-left badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 pointer-events-none flex flex-col gap-1">
            <span className="inline-flex items-center rounded-full bg-white/95 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm">
              {product.category}
            </span>
            {product.isBundle && (
              <span className="inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Bundle
              </span>
            )}
          </div>

          {/* Discount badge */}
          {discountPct > 0 && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 pointer-events-none z-[1]">
              <span className="inline-flex items-center rounded-md sm:rounded-lg bg-primary px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-extrabold text-white shadow-md">
                -{discountPct}%
              </span>
            </div>
          )}

          {/* Hover action icons */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10">
            <button className="bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-full text-gray-500 hover:text-primary hover:bg-white shadow-md border border-gray-100 transition-all hover:scale-110 active:scale-95" title="Wishlist" onClick={(e) => e.preventDefault()}>
              <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button className="bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-full text-gray-500 hover:text-primary hover:bg-white shadow-md border border-gray-100 transition-all hover:scale-110 active:scale-95" title="Quick View" onClick={(e) => { e.preventDefault(); setIsQuickViewOpen(true); }}>
              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-4">
          {/* Rating */}
          <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-[10px] sm:text-xs font-semibold text-gray-700">{product.rating}</span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.id}`}>
            <h3 className="text-xs sm:text-sm font-medium text-dark group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
          </Link>

          {/* Price */}
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100 flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-bold text-dark"><Price amount={product.price} /></span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-[9px] sm:text-xs text-gray-400 line-through"><Price amount={product.oldPrice} /></span>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
            <Button size="sm" variant="outline" onClick={() => addItem(product)} className="w-full gap-1 border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors font-medium text-[9px] sm:text-xs h-7 sm:h-8">
              <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Add
            </Button>
            <Button size="sm" onClick={handleBuyNow} className="w-full gap-1 bg-primary hover:bg-[#E62828] text-white rounded-lg shadow-sm font-semibold text-[9px] sm:text-xs h-7 sm:h-8">
              <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Buy
            </Button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQuickViewOpen(false)} className="absolute inset-0 bg-dark/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[85vh] sm:max-h-[90vh] mx-2">
              <button onClick={() => setIsQuickViewOpen(false)} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-dark hover:bg-gray-100 z-20 transition-colors shadow-sm">
                <X className="h-5 w-5" />
              </button>
              <div className="w-full md:w-1/2 bg-gray-100 relative h-64 md:h-auto">
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">{product.category}</span>
                </div>
              </div>
              <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 flex flex-col overflow-y-auto">
                <div className="flex items-center gap-1 mb-4">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
                  <span className="text-gray-300 mx-2">•</span>
                  <span className="text-sm text-gray-500 font-medium">{product.reviewCount} Reviews</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark mb-4">{product.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-8 flex-1">{product.description}</p>
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-dark"><Price amount={product.price} /></span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="text-lg text-gray-400 line-through"><Price amount={product.oldPrice} /></span>
                      )}
                    </div>
                    <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">In Stock</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => { addItem(product); setIsQuickViewOpen(false); }} className="w-full gap-2 border-gray-200 text-dark hover:bg-gray-50 h-12 text-base font-semibold">
                      <ShoppingCart className="h-5 w-5" /> Add to Cart
                    </Button>
                    <Button onClick={handleBuyNow} className="w-full gap-2 bg-primary hover:bg-[#E62828] text-white h-12 text-base font-semibold shadow-lg shadow-primary/20">
                      <Zap className="h-5 w-5" /> Buy Now
                    </Button>
                  </div>
                  <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-8 border-t border-gray-100 pt-4 sm:pt-6">
                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors font-medium">
                      <Heart className="h-4 w-4" /> Wishlist
                    </button>
                    <Link href={`/products/${product.id}`} className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                      Full Details <Eye className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
