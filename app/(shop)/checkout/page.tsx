'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/axios';
import {
  ShoppingBag, ChevronRight, CreditCard, User,
  Lock, Trash2, Plus, Minus, ArrowLeft, ShoppingCart, Tag, X,
} from 'lucide-react';
import { Price } from '@/components/ui/Price';
import { CopyableCode } from '@/components/ui/CopyableCode';
import { CheckoutUpsell } from '@/components/shop/UpsellBlock';

const STEPS = ['Cart', 'Billing', 'Payment'] as const;
type Step = 0 | 1 | 2;

interface BillingForm {
  fullName: string; email: string; phone: string;
}

const inputCls = 'block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1 sm:gap-2">
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all ${
            i < step ? 'bg-green-500 text-white' :
            i === step ? 'bg-primary text-white shadow-lg shadow-primary/30' :
            'bg-gray-100 text-gray-400'
          }`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-dark' : 'text-gray-400'}`}>{label}</span>
          {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 mx-0.5 sm:mx-1" />}
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ coupon, onApplyCoupon, onRemoveCoupon }: {
  coupon: { code: string; discount: string; discountAmount: number } | null;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
}) {
  const { items, total, updateQuantity, removeItem } = useCartStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);

  const subtotal = total();
  const finalTotal = subtotal - (coupon?.discountAmount || 0);

  const handleApply = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponError('');
    try {
      await onApplyCoupon(couponInput.trim());
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
      <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-primary" /> Order Summary
      </h3>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {items.map(item => (
          <div key={item.id} className="flex gap-3 items-center">
            <img src={item.imageUrl} alt={item.title} className="h-12 w-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-dark line-clamp-1">{item.title}</p>
              <p className="text-xs text-gray-400"><Price amount={item.price} /> each</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-5 w-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-5 w-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                <Plus className="h-2.5 w-2.5" />
              </button>
              <button onClick={() => removeItem(item.id)} className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 ml-1">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Code */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {coupon ? (
          <div className="flex items-center justify-between bg-[#F0FDF4] rounded-lg px-4 py-3 border border-[#BBF7D0]">
            <div className="flex items-center gap-2 min-w-0">
              <Tag className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <CopyableCode
                code={coupon.code}
                className="text-xs font-semibold text-green-700 uppercase tracking-wide hover:text-green-900"
                iconSize={11}
              />
              <span className="text-xs text-green-600 flex-shrink-0">({coupon.discount} off)</span>
            </div>
            <button onClick={onRemoveCoupon} className="text-green-400 hover:text-red-500 transition-colors p-1 flex-shrink-0 ml-2">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Have a coupon?</p>
            <div className="flex items-center gap-2.5">
              <input
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
                placeholder="Enter coupon code"
                className="min-w-0 flex-1 h-[38px] rounded-lg border border-gray-200 bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D]/20 focus:bg-white transition-all placeholder:text-gray-400"
              />
              <button
                onClick={handleApply}
                disabled={applying}
                className="h-[38px] px-4 text-sm font-bold bg-[#FF2D2D] text-white rounded-lg hover:bg-[#E62828] transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {applying ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span><span><Price amount={subtotal} /></span>
        </div>
        {coupon && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({coupon.discount})</span><span>-<Price amount={coupon.discountAmount} /></span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tax (0%)</span><span><Price amount={0} /></span>
        </div>
        <div className="flex justify-between text-base font-bold text-dark pt-2 border-t border-gray-100">
          <span>Total</span><span><Price amount={finalTotal} /></span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
        <Lock className="h-3 w-3" /> Secure 256-bit SSL checkout
      </div>
    </div>
  );
}

function RecommendedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const cartItems = useCartStore(s => s.items);
  const addItem = useCartStore(s => s.addItem);
  const cartIds = cartItems.map(i => i.id);

  useEffect(() => {
    apiClient.get('/products', { params: { page: 1, limit: 12 } }).then(({ data }) => {
      setProducts(data.products || []);
    }).catch(() => {});
  }, []);

  const suggestions = products.filter(p => !cartIds.includes(p.id)).slice(0, 4);
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold text-dark mb-4">You might also like</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {suggestions.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
            <Link href={`/products/${p.id}`}>
              <img src={p.imageUrl} alt={p.title} className="w-full h-24 sm:h-28 object-cover bg-gray-100 group-hover:scale-105 transition-transform" />
            </Link>
            <div className="p-3">
              <Link href={`/products/${p.id}`}>
                <p className="text-xs font-semibold text-dark line-clamp-1 hover:text-primary transition-colors">{p.title}</p>
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-dark"><Price amount={p.price} /></span>
                <button
                  onClick={() => addItem(p, true)}
                  className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-colors"
                  title="Add to cart"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<Step>(0);
  const [billing, setBilling] = useState<BillingForm>({ fullName: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: string; discountAmount: number } | null>(null);
  const [showPaymentIncomplete, setShowPaymentIncomplete] = useState(false);

  // Detect if user came back from EPS without completing payment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = sessionStorage.getItem('eps-payment-pending');
    if (pending) {
      sessionStorage.removeItem('eps-payment-pending');
      setShowPaymentIncomplete(true);
      setStep(2);
    }
  }, []);

  const handleApplyCoupon = async (code: string) => {
    try {
      const { data } = await apiClient.post('/coupons/validate', { code, subtotal: total() });
      if (data.error) throw new Error(data.error);
      setAppliedCoupon({ code: data.code, discount: data.discount, discountAmount: data.discountAmount });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Invalid coupon');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <ShoppingBag className="h-16 w-16 text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium text-lg">Your cart is empty</p>
        <Button className="mt-6 bg-primary text-white" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const validateBilling = () => {
    const e: Record<string, string> = {};
    if (!billing.fullName.trim()) e.fullName = 'Full name is required';
    if (!billing.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email is required';
    if (!billing.phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 0) {
      if (!isAuthenticated) { router.push('/login?next=/checkout'); return; }
      setStep(1);
    } else if (step === 1) {
      if (validateBilling()) setStep(2);
    }
  };

  const handleEpsPayment = async () => {
    setIsPlacing(true);
    setOrderError('');
    try {
      const { data } = await apiClient.post('/eps/initiate', {
        productIds: items.map(i => i.id),
        customerName: billing.fullName,
        customerEmail: billing.email,
        customerPhone: billing.phone,
        couponCode: appliedCoupon?.code || undefined,
      });
      sessionStorage.setItem('eps-payment-pending', '1');
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      setOrderError(err.response?.data?.error || 'Failed to initiate payment. Please try again.');
      setIsPlacing(false);
    }
  };

  const billingField = (label: string, key: keyof BillingForm, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-dark mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={billing[key]}
        onChange={e => { setBilling(b => ({ ...b, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
        className={`${inputCls} ${errors[key] ? 'border-red-400 focus:ring-red-200' : ''}`}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {step < 3 && (
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-dark mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        )}

        <StepIndicator step={step} />

        {/* Payment Incomplete Popup */}
        <AnimatePresence>
          {showPaymentIncomplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowPaymentIncomplete(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                  <CreditCard className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-dark mb-2">Payment Not Completed</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your payment was not completed. You can try again — your cart and billing info are still saved.
                </p>
                <Button
                  onClick={() => setShowPaymentIncomplete(false)}
                  className="w-full bg-primary hover:bg-[#E62828] text-white font-semibold h-11"
                >
                  Continue to Payment
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">

          {/* Main Panel */}
          <div className="lg:col-span-2 order-1">
            <AnimatePresence mode="wait">

              {/* STEP 0 — Cart Review */}
              {step === 0 && (
                <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-dark mb-6 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" /> Review Your Cart
                    </h2>
                    <div className="space-y-4">
                      {items.map(item => (
                        <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                          <img src={item.imageUrl} alt={item.title} className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.id}`} className="text-sm font-semibold text-dark hover:text-primary transition-colors line-clamp-1">{item.title}</Link>
                            <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                            <p className="text-sm font-bold text-dark mt-1"><Price amount={item.price * item.quantity} /></p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <button onClick={() => useCartStore.getState().removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-2">
                              <button onClick={() => useCartStore.getState().updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                              <button onClick={() => useCartStore.getState().updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 1 — Billing Info */}
              {step === 1 && (
                <motion.div key="billing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-dark mb-6 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Billing Information
                    </h2>
                    <div className="space-y-4">
                      {billingField('Full Name', 'fullName', 'text', 'John Doe')}
                      {billingField('Email Address', 'email', 'email', 'you@example.com')}
                      {billingField('Phone Number', 'phone', 'tel', '+1 (555) 000-0000')}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Payment */}
              {step === 2 && (
                <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-dark mb-2 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Payment
                    </h2>
                    <p className="text-xs text-gray-400 mb-8 flex items-center gap-1.5">
                      <Lock className="h-3 w-3" /> You will be redirected to EPS secure payment page
                    </p>

                    {/* Checkout Upsell — before payment */}
                    <CheckoutUpsell />

                    {/* EPS branding block */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex flex-col items-center gap-4 mb-6">
                      <img
                        src="/Checkout-Page-Pay_with_EPS.png"
                        alt="Pay with EPS"
                        className="w-full max-w-sm rounded-xl object-contain"
                      />
                      <div className="text-center">
                        <p className="font-semibold text-dark">Easy Payment System</p>
                        <p className="text-xs text-gray-400 mt-1">Powered by EPS Bangladesh — supports bKash, Nagad, Rocket, cards & more</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard', 'DBBL'].map(m => (
                          <span key={m} className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-600 shadow-sm">{m}</span>
                        ))}
                      </div>
                    </div>

                    {/* Order summary recap */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 flex items-center justify-between mb-6">
                      <span className="text-sm text-gray-600">Amount to pay</span>
                      <span className="text-lg font-bold text-dark"><Price amount={total() - (appliedCoupon?.discountAmount || 0)} /></span>
                    </div>

                    {orderError && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                        {orderError}
                      </div>
                    )}

                    <Button
                      onClick={handleEpsPayment}
                      disabled={isPlacing}
                      className="w-full h-12 bg-primary hover:bg-[#E62828] text-white font-semibold gap-2 shadow-lg shadow-primary/25"
                    >
                      {isPlacing ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Redirecting to EPS...
                        </span>
                      ) : (
                        <><Lock className="h-4 w-4" /> Pay <Price amount={total() - (appliedCoupon?.discountAmount || 0)} /> via EPS</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}



            </AnimatePresence>

            {/* Navigation Buttons */}
            {step < 3 && (
              <div className="flex items-center justify-between mt-6">
                {step > 0 ? (
                  <button
                    onClick={() => { setErrors({}); setStep(s => (s - 1) as Step); }}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-dark transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : <div />}

                <Button
                  onClick={goNext}
                  disabled={isPlacing}
                  className="bg-primary hover:bg-[#E62828] text-white px-8 h-12 gap-2 shadow-lg shadow-primary/25"
                >
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                </Button>
              </div>
            )}

            {/* Recommended Products */}
            <div className="hidden lg:block">
              <RecommendedProducts />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          {step < 3 && (
            <div className="lg:col-span-1 order-2">
              <OrderSummary
                coupon={appliedCoupon}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={() => setAppliedCoupon(null)}
              />
            </div>
          )}

          {/* Recommended Products — mobile only, after order summary */}
          <div className="lg:hidden order-3">
            <RecommendedProducts />
          </div>
        </div>
      </div>
    </div>
  );
}
