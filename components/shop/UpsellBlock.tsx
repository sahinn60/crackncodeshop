'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Package, Check, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { apiClient } from '@/lib/axios';
import { Price } from '@/components/ui/Price';

interface Product {
  id: string; title: string; description: string; price: number;
  imageUrl: string; rating: number; reviewCount: number; category: string;
  postPurchaseDiscount?: number;
}

interface BundleData {
  id: string; name: string; slug: string; description: string; imageUrl: string;
  discount: number; products: Product[]; originalPrice: number; bundlePrice: number;
}

// ─── You May Also Like ───
export function YouMayAlsoLike({ productId }: { productId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    apiClient.get(`/products/${productId}/related`).then(({ data }) => {
      setProducts(data.youMayAlsoLike || []);
    }).catch(() => {});
  }, [productId]);

  if (!products.length) return null;

  return (
    <section className="mt-12 sm:mt-20 pt-8 sm:pt-12 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark">You May Also Like</h2>
          <p className="text-sm text-gray-400">Based on this product</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.slice(0, 4).map(p => (
          <UpsellCard key={p.id} product={p} onAdd={() => addItem(p, true)} />
        ))}
      </div>
    </section>
  );
}

// ─── Frequently Bought Together ───
export function FrequentlyBoughtTogether({ productId, currentProduct }: { productId: string; currentProduct: Product }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    apiClient.get(`/products/${productId}/related`).then(({ data }) => {
      const items = (data.frequentlyBought || []).slice(0, 3);
      setProducts(items);
      setSelected(new Set(items.map((p: Product) => p.id)));
    }).catch(() => {});
  }, [productId]);

  if (!products.length) return null;

  const allItems = [currentProduct, ...products];
  const selectedItems = allItems.filter(p => p.id === currentProduct.id || selected.has(p.id));
  const totalPrice = selectedItems.reduce((s, p) => s + p.price, 0);

  const handleAddAll = () => {
    selectedItems.forEach(p => addItem(p, true));
    useCartStore.getState().openCart();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="mt-12 sm:mt-16 pt-8 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Package className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark">Frequently Bought Together</h2>
          <p className="text-sm text-gray-400">Customers who bought this also bought</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {allItems.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 sm:gap-4">
              {i > 0 && <span className="text-2xl text-gray-300 font-light">+</span>}
              <div
                className={`relative cursor-pointer rounded-xl border-2 p-2 transition-all ${
                  p.id === currentProduct.id || selected.has(p.id)
                    ? 'border-primary bg-primary/5' : 'border-gray-200 opacity-50'
                }`}
                onClick={() => p.id !== currentProduct.id && toggleSelect(p.id)}
              >
                <img src={p.imageUrl} alt={p.title} className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover" />
                {(p.id === currentProduct.id || selected.has(p.id)) && (
                  <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <p className="text-xs font-medium text-dark mt-1.5 line-clamp-1 max-w-[80px]">{p.title}</p>
                <p className="text-xs font-bold text-primary"><Price amount={p.price} /></p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Total for {selectedItems.length} items</p>
            <p className="text-2xl font-black text-dark"><Price amount={totalPrice} /></p>
          </div>
          <Button onClick={handleAddAll} className="bg-primary hover:bg-[#E62828] text-white font-bold gap-2 px-6 h-11 shadow-lg shadow-primary/25">
            <ShoppingCart className="h-4 w-4" /> Add All to Cart
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Bundle Upgrade ───
export function BundleUpgrade({ productId }: { productId: string }) {
  const [bundles, setBundles] = useState<BundleData[]>([]);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    apiClient.get(`/products/${productId}/related`).then(({ data }) => {
      setBundles(data.bundles || []);
    }).catch(() => {});
  }, [productId]);

  if (!bundles.length) return null;

  const handleAddBundle = (bundle: BundleData) => {
    bundle.products.forEach(p => addItem(p, true));
    useCartStore.getState().openCart();
  };

  return (
    <section className="mt-12 sm:mt-16 pt-8 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark">Upgrade to a Bundle</h2>
          <p className="text-sm text-gray-400">Get more value with a bundle deal</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bundles.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Save {b.discount}%
            </div>
            <h3 className="text-lg font-bold text-dark pr-20">{b.name}</h3>
            {b.description && <p className="text-sm text-gray-500 mt-1">{b.description}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              {b.products.map(p => (
                <img key={p.id} src={p.imageUrl} alt={p.title} className="h-12 w-12 rounded-lg object-cover border-2 border-white shadow-sm" />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-gray-400 line-through"><Price amount={b.originalPrice} /></span>
              <span className="text-xl font-black text-dark"><Price amount={b.bundlePrice} /></span>
            </div>
            <Button onClick={() => handleAddBundle(b)} className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 h-11 shadow-lg">
              <Zap className="h-4 w-4" /> Get Bundle Deal
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Checkout Upsell (single product suggestion before payment) ───
export function CheckoutUpsell() {
  const [offer, setOffer] = useState<Product | null>(null);
  const [added, setAdded] = useState(false);
  const cartItems = useCartStore(s => s.items);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    const cartIds = cartItems.map(i => i.id);
    if (!cartIds.length || added) return;

    let cancelled = false;
    apiClient.get(`/products/${cartIds[0]}/related`).then(({ data }) => {
      if (cancelled) return;
      const candidates = [
        ...(data.frequentlyBought || []),
        ...(data.youMayAlsoLike || []),
      ].filter((p: Product) => !cartIds.includes(p.id));
      if (candidates.length) setOffer(candidates[0]);
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!offer || added) return null;

  const handleAdd = () => {
    addItem(offer, true);
    setAdded(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 sm:p-5 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-bold text-amber-800">Add this for extra value!</span>
      </div>
      <div className="flex gap-3 items-center">
        <img src={offer.imageUrl} alt={offer.title} className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border border-amber-200" />
        <div className="flex-1 min-w-0">
          <Link href={`/products/${offer.id}`} className="text-sm font-semibold text-dark hover:text-primary line-clamp-1">{offer.title}</Link>
          <p className="text-xs text-gray-500 mt-0.5">{offer.category}</p>
          <p className="text-sm font-bold text-dark mt-1"><Price amount={offer.price} /></p>
        </div>
        <Button onClick={handleAdd} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 flex-shrink-0 shadow-md">
          <ShoppingCart className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Post-Purchase Upsell ───
export function PostPurchaseOffer({ purchasedProductIds, onPurchase }: { purchasedProductIds: string[]; onPurchase?: (productId: string) => void }) {
  const [offers, setOffers] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<BundleData[]>([]);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    if (!purchasedProductIds.length) return;
    apiClient.post('/upsells/post-purchase', { productIds: purchasedProductIds }).then(({ data }) => {
      setOffers(data.offers || []);
      setBundles(data.bundles || []);
    }).catch(() => {});
  }, [purchasedProductIds]);

  if (!offers.length && !bundles.length) return null;

  const handleQuickBuy = (product: Product) => {
    addItem(product, true);
    onPurchase?.(product.id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="mt-8 w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-primary/5 via-white to-purple-50 rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Exclusive Offer
          </span>
          <h3 className="text-xl font-bold text-dark">Complete Your Collection</h3>
          <p className="text-sm text-gray-500 mt-1">Special discounts just for you — limited time!</p>
        </div>

        {/* Product offers */}
        {offers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {offers.slice(0, 2).map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 items-center hover:shadow-md transition-shadow">
                <img src={p.imageUrl} alt={p.title} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark line-clamp-1">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.postPurchaseDiscount ? (
                      <>
                        <span className="text-xs text-gray-400 line-through"><Price amount={p.price} /></span>
                        <span className="text-sm font-bold text-green-600"><Price amount={p.price * (1 - (p.postPurchaseDiscount || 0) / 100)} /></span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-dark"><Price amount={p.price} /></span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleQuickBuy(p)}
                  className="h-9 w-9 rounded-full bg-primary hover:bg-[#E62828] text-white flex items-center justify-center flex-shrink-0 transition-colors shadow-md">
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bundle offers */}
        {bundles.length > 0 && bundles.slice(0, 1).map(b => (
          <div key={b.id} className="bg-white rounded-xl border-2 border-purple-200 p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-dark">{b.name}</h4>
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Save {b.discount}%</span>
            </div>
            <div className="flex gap-2 mb-3">
              {b.products.slice(0, 4).map(p => (
                <img key={p.id} src={p.imageUrl} alt={p.title} className="h-10 w-10 rounded-lg object-cover" />
              ))}
              {b.products.length > 4 && <span className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{b.products.length - 4}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-400 line-through mr-2"><Price amount={b.originalPrice} /></span>
                <span className="text-lg font-black text-dark"><Price amount={b.bundlePrice} /></span>
              </div>
              <Button onClick={() => b.products.forEach(p => addItem(p, true))}
                size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Get Bundle
              </Button>
            </div>
          </div>
        ))}

        <Link href="/products" className="flex items-center justify-center gap-1 text-sm text-primary hover:text-[#E62828] font-medium mt-5 transition-colors">
          Browse more products <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Reusable small upsell card ───
function UpsellCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/products/${product.id}`}>
        <img src={product.imageUrl} alt={product.title} className="w-full h-28 sm:h-36 object-cover bg-gray-100 group-hover:scale-105 transition-transform" />
      </Link>
      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.id}`}>
          <p className="text-sm font-semibold text-dark line-clamp-1 hover:text-primary transition-colors">{product.title}</p>
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-sm font-bold text-dark"><Price amount={product.price} /></span>
          <button onClick={onAdd}
            className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-colors"
            title="Add to cart">
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
