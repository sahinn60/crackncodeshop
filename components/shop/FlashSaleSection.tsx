'use client';

import { useState, useEffect } from 'react';
import { Flame, ShoppingCart, Zap, ArrowRight, Timer } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import { Price } from '@/components/ui/Price';
import { FlashSaleCountdown } from './FlashSaleCountdown';
import Link from 'next/link';

interface FlashProduct {
  id: string; title: string; description: string; price: number; salePrice: number;
  imageUrl: string; rating: number; reviewCount: number; category: string;
}

interface FlashSale {
  id: string; title: string; discountPercentage: number; isDaily: boolean;
  startTime: string; endTime: string; products: FlashProduct[];
}

export function FlashSaleSection() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const { addItem } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    apiClient.get('/flash-sales').then(({ data }) => setSales(data)).catch(() => {});
  }, []);

  if (sales.length === 0) return null;

  return (
    <>
      {sales.map(sale => (
        <section key={sale.id} className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg">

            {/* Premium header banner */}
            <div className="relative bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] px-5 sm:px-8 py-5 sm:py-7 overflow-hidden">
              {/* Subtle accent glow */}
              <div className="absolute top-0 left-1/4 w-64 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-48 h-24 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Animated fire icon */}
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                    <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-2xl font-semibold text-white tracking-tight">{sale.title}</h2>
                      {sale.discountPercentage > 0 && (
                        <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] sm:text-xs font-bold">
                          UP TO {sale.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Timer className="h-3 w-3 text-white/40" />
                      <span className="text-[11px] sm:text-xs text-white/40 font-medium">Ends in</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-5">
                  <FlashSaleCountdown endTime={sale.endTime} isDaily={sale.isDaily} />
                  <Link
                    href="/products"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/80 text-xs font-medium hover:bg-white/15 hover:text-white transition-all"
                  >
                    Shop All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Products grid — white bg */}
            <div className="bg-white p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {sale.products.slice(0, 4).map(product => {
                  const discountPct = Math.round(((product.price - product.salePrice) / product.price) * 100);
                  return (
                    <div key={product.id} className="group rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="aspect-square relative overflow-hidden bg-gray-50">
                        <Link href={`/products/${product.id}`}>
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </Link>
                        {discountPct > 0 && (
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-primary to-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            -{discountPct}%
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 sm:p-3">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="text-xs sm:text-sm font-medium text-dark line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm sm:text-base font-bold text-dark"><Price amount={product.salePrice} /></span>
                          <span className="text-[9px] sm:text-xs text-gray-400 line-through"><Price amount={product.price} /></span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
                          <button
                            onClick={() => addItem({ ...product, oldPrice: product.price, price: product.salePrice })}
                            className="flex items-center justify-center gap-1 h-7 sm:h-8 rounded-lg border border-gray-200 text-gray-600 text-[9px] sm:text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                          >
                            <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Add
                          </button>
                          <button
                            onClick={() => {
                              addItem({ ...product, oldPrice: product.price, price: product.salePrice }, true);
                              router.push('/checkout');
                            }}
                            className="flex items-center justify-center gap-1 h-7 sm:h-8 rounded-lg bg-gradient-to-r from-primary to-red-600 text-white text-[9px] sm:text-xs font-semibold hover:shadow-md hover:shadow-primary/20 transition-all"
                          >
                            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Buy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* More products */}
              {sale.products.length > 4 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {sale.products.slice(4, 10).map(product => {
                      const discountPct = Math.round(((product.price - product.salePrice) / product.price) * 100);
                      return (
                        <Link key={product.id} href={`/products/${product.id}`} className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs font-medium text-dark line-clamp-1 group-hover:text-primary transition-colors">{product.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs font-bold text-dark"><Price amount={product.salePrice} /></span>
                              {discountPct > 0 && (
                                <span className="text-[9px] text-primary font-medium">-{discountPct}%</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
