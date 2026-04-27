'use client';

import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState } from 'react';
import { Price } from '@/components/ui/Price';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, total, count } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();


  const handleCheckout = () => {
    closeCart();
    router.push(isAuthenticated ? '/checkout' : '/login?next=/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Cart
                {count() > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{count()}</span>
                )}
              </h2>
              <button onClick={closeCart} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <ShoppingBag className="h-16 w-16 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
                  <Button onClick={closeCart} className="mt-6 bg-primary hover:bg-[#E62828] text-white" asChild>
                    <Link href="/products">Browse Products</Link>
                  </Button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <img src={item.imageUrl} alt={item.title} className="h-16 w-16 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.id}`} onClick={closeCart}>
                        <p className="text-sm font-medium text-dark line-clamp-1 hover:text-primary transition-colors">{item.title}</p>
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-dark"><Price amount={item.price * item.quantity} /></span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors ml-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Subtotal</span>
                  <span className="text-xl font-bold text-dark"><Price amount={total()} /></span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-primary hover:bg-[#E62828] text-white font-semibold gap-2 shadow-lg shadow-primary/25"
                >
                  <Zap className="h-4 w-4" /> Checkout — <Price amount={total()} />
                </Button>
                <button onClick={clearCart} className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Clear cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
