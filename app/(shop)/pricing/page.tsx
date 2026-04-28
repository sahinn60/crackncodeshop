'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, X, ChevronDown, Zap, Crown, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Price } from '@/components/ui/Price';

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    price: 0,
    period: 'Free forever',
    description: 'Perfect for exploring our platform and trying out free resources.',
    color: 'text-gray-600',
    bg: 'bg-white',
    border: 'border-gray-200',
    badge: null,
    cta: 'Get Started',
    ctaStyle: 'bg-dark text-white hover:bg-gray-800',
    features: [
      { text: 'Access to free products', included: true },
      { text: 'Community support', included: true },
      { text: 'Basic documentation', included: true },
      { text: 'Personal use license', included: true },
      { text: 'Premium products', included: false },
      { text: 'Priority support', included: false },
      { text: 'Commercial license', included: false },
      { text: 'Early access to new releases', included: false },
    ],
  },
  {
    name: 'Pro',
    icon: Crown,
    price: 2999,
    period: '/month',
    description: 'For professionals who need premium assets and commercial licensing.',
    color: 'text-primary',
    bg: 'bg-dark',
    border: 'border-primary/30',
    badge: 'Most Popular',
    cta: 'Go Pro',
    ctaStyle: 'bg-primary text-white hover:bg-[#E62828]',
    features: [
      { text: 'All free products', included: true },
      { text: 'All premium products', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Commercial license', included: true },
      { text: 'Lifetime updates', included: true },
      { text: 'Early access to new releases', included: true },
      { text: 'Dedicated account manager', included: false },
      { text: 'Custom integrations', included: false },
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: 9999,
    period: '/month',
    description: 'For teams and businesses that need everything plus custom solutions.',
    color: 'text-secondary',
    bg: 'bg-white',
    border: 'border-gray-200',
    badge: null,
    cta: 'Contact Sales',
    ctaStyle: 'bg-secondary text-white hover:bg-blue-700',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited team seats', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'On-boarding & training', included: true },
      { text: 'Invoice billing', included: true },
      { text: 'Custom product requests', included: true },
    ],
  },
];

const faqs = [
  { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.' },
  { q: 'What payment methods do you accept?', a: 'We accept bKash, Nagad, bank transfers, and all major mobile banking services in Bangladesh.' },
  { q: 'Is there a refund policy?', a: 'Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.' },
  { q: 'Do I get access to future products?', a: 'Pro and Enterprise subscribers get early access to all new product releases at no extra cost.' },
  { q: 'Can I use products for client work?', a: 'Pro and Enterprise plans include a commercial license that covers unlimited client projects.' },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);

  return (
    <div className="bg-light min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark text-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-dark to-secondary/10" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-white/20">
              Pricing
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Simple, transparent <span className="text-primary">pricing</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg font-normal">
              Choose the plan that fits your needs. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-primary' : 'bg-white/20'}`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-gray-500'}`}>
              Annual <span className="text-primary text-xs font-bold">-20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => {
            const isPro = plan.name === 'Pro';
            const displayPrice = plan.price === 0 ? 0 : annual ? Math.round(plan.price * 0.8) : plan.price;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border ${plan.border} ${isPro ? 'bg-dark text-white ring-2 ring-primary/50 scale-[1.02]' : 'bg-white text-dark'} p-6 sm:p-8 flex flex-col shadow-lg`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl ${isPro ? 'bg-primary/20' : 'bg-gray-100'} flex items-center justify-center`}>
                    <plan.icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>

                <p className={`text-sm mb-6 ${isPro ? 'text-gray-400' : 'text-gray-500'} font-normal`}>{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black">{displayPrice === 0 ? 'Free' : <Price amount={displayPrice} />}</span>
                  {plan.price > 0 && <span className={`text-sm ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>}
                </div>

                <Link href={plan.price === 0 ? '/register' : '/checkout'}>
                  <Button className={`w-full rounded-xl font-bold h-12 ${plan.ctaStyle}`}>
                    {plan.cta}
                  </Button>
                </Link>

                <div className={`mt-8 pt-6 border-t ${isPro ? 'border-white/10' : 'border-gray-100'} space-y-3 flex-1`}>
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      {f.included ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className={`h-4 w-4 ${isPro ? 'text-gray-600' : 'text-gray-300'} flex-shrink-0`} />
                      )}
                      <span className={`text-sm ${f.included ? (isPro ? 'text-gray-200' : 'text-gray-700') : (isPro ? 'text-gray-600' : 'text-gray-400')}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  className="w-full px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-dark text-left text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 ml-2 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-1 text-gray-500 text-sm font-normal">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-dark rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Still not sure?</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8 font-normal">
              Start with our free plan and upgrade when you're ready. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button className="bg-primary hover:bg-[#E62828] text-white rounded-full px-8 font-bold shadow-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="rounded-full px-8 font-bold border-white/20 text-white hover:bg-white/10">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
