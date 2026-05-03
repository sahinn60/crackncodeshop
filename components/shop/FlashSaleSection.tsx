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
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const { addItem } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    apiClient.get('/flash-sales').then(({ data }) => {
      setSales(data.sales || data);
      if (data.serverTime) setServerTime(data.serverTime);
    }).catch(() => {});
  }, []);

  if (sales.length === 0) return null;

  return (
    <>
      {sales.map(sale => (
        <section key={sale.id} className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.06)]">

            {/* Premium header banner */}
            <div className="relative px-3.5 sm:px-8 py-3 sm:py-7 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(255,80,80,0.08), transparent 60%)' }} />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Row 1: Icon + Title */}
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center flex-shrink-0" style={{ animation: 'fs-icon-pulse 2s ease-in-out infinite', boxShadow: '0 0 15px rgba(255,80,80,0.4)' }}>
                    <Flame className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h2 className="text-base sm:text-2xl font-semibold tracking-tight" style={{ background: 'linear-gradient(to right, #FFFFFF, #FCA5A5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: 'none', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))' }}>{sale.title}</h2>
                      {sale.discountPercentage > 0 && (
                        <span className="inline-flex px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-xs font-bold text-white" style={{ background: 'linear-gradient(to right, #FF3B3B, #FF6A00)', animation: 'fs-badge-pulse 2s ease-in-out infinite' }}>
                          UP TO {sale.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                      <Timer className="h-3 w-3" style={{ color: '#94A3B8' }} />
                      <span className="text-xs sm:text-xs font-medium" style={{ color: '#94A3B8' }}>Ends in</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Timer + Shop All */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5">
                  <FlashSaleCountdown endTime={sale.endTime} isDaily={sale.isDaily} serverTime={serverTime} />
                  <Link
                    href="/products"
                    className="flex sm:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/10 border border-white/10 text-white/80 text-[11px] sm:text-xs font-medium hover:bg-white/15 hover:text-white transition-all"
                  >
                    Shop All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Products grid */}
            <div className="p-4 sm:p-6" style={{ background: 'linear-gradient(to bottom, #F8FAFC, #F1F5F9)' }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {sale.products.slice(0, 4).map((product, idx) => {
                  const discountPct = Math.round(((product.price - product.salePrice) / product.price) * 100);
                  return (
                    <div
                      key={product.id}
                      className="group rounded-xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]"
                      style={{
                        background: '#FFFFFF',
                        borderColor: '#E5E7EB',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                        animation: `fadeInUp 0.4s ease ${idx * 0.1}s both`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-50">
                        <Link href={`/products/${product.id}`}>
                          <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </Link>
                        {discountPct > 0 && (
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-primary to-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            -{discountPct}%
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 sm:p-3">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm sm:text-base font-bold text-gray-900"><Price amount={product.salePrice} /></span>
                          <span className="text-[9px] sm:text-xs text-gray-400 line-through"><Price amount={product.price} /></span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
                          <button
                            onClick={() => addItem({ ...product, oldPrice: product.price, price: product.salePrice })}
                            className="flex items-center justify-center gap-1 h-7 sm:h-8 rounded-lg border text-gray-500 text-[9px] sm:text-xs font-medium hover:text-gray-900 transition-colors"
                            style={{ borderColor: '#E5E7EB', background: '#F9FAFB' }}
                          >
                            <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Add
                          </button>
                          <button
                            onClick={() => {
                              addItem({ ...product, oldPrice: product.price, price: product.salePrice }, true);
                              router.push('/checkout');
                            }}
                            className="flex items-center justify-center gap-1 h-7 sm:h-8 rounded-lg text-white text-[9px] sm:text-xs font-semibold transition-all relative overflow-hidden group/btn"
                            style={{ background: 'linear-gradient(to right, #FF3B3B, #FF6A00)' }}
                          >
                            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 relative z-10" />
                            <span className="relative z-10">Buy</span>
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* More products */}
              {sale.products.length > 4 && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {sale.products.slice(4, 10).map(product => {
                      const discountPct = Math.round(((product.price - product.salePrice) / product.price) * 100);
                      return (
                        <Link key={product.id} href={`/products/${product.id}`} className="group flex items-center gap-2.5 p-2 rounded-lg transition-colors" style={{ background: 'transparent' }} onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs font-medium text-gray-700 line-clamp-1 group-hover:text-primary transition-colors">{product.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs font-bold text-gray-900"><Price amount={product.salePrice} /></span>
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
