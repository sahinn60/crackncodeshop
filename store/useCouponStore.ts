import { create } from 'zustand';

export interface Coupon {
  id: string;
  title: string;
  code: string;
  discount: string;
  message: string;
  priority: number;
  endDate: string | null;
  emoji: string;
  barColor: string;
  textColor: string;
  showTimer: boolean;
  speedDesktop: number;
  speedMobile: number;
}

interface CouponState {
  coupons: Coupon[];
  fetched: boolean;
  barVisible: boolean;
  fetchCoupons: () => Promise<void>;
  setBarVisible: (v: boolean) => void;
}

export const useCouponStore = create<CouponState>((set, get) => ({
  coupons: [],
  fetched: false,
  barVisible: false,
  fetchCoupons: async () => {
    if (get().fetched) return;
    try {
      const res = await fetch('/api/coupons');
      if (!res.ok) return;
      const data = await res.json();
      set({ coupons: Array.isArray(data) ? data : [], fetched: true });
    } catch {}
  },
  setBarVisible: (v) => set({ barVisible: v }),
}));
