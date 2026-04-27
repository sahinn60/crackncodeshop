import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/components/shop/ProductCard';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, silent?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, silent) => {
        set(state => {
          const existing = state.items.find(i => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i),
              ...(!silent && { isOpen: true }),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }], ...(!silent && { isOpen: true }) };
        });
      },

      removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity < 1) { get().removeItem(id); return; }
        set(state => ({ items: state.items.map(i => i.id === id ? { ...i, quantity } : i) }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
