'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Zap, Shield, Download, RefreshCw, Headphones, Code2,
  Palette, Globe, Lock, ArrowRight, Star, Users, Package, Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Zap, title: 'Instant Delivery', desc: 'Get immediate access to your digital files right after checkout. No waiting.', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Shield, title: 'Secure Payments', desc: 'All transactions are encrypted and processed through trusted payment gateways.', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: RefreshCw, title: 'Lifetime Updates', desc: 'Every purchase includes free lifetime updates as we improve and add new features.', color: 'text-secondary', bg: 'bg-blue-50' },
  { icon: Code2, title: 'Clean Code', desc: 'Well-structured, documented, and production-ready code following best practices.', color: 'text-violet-500', bg: 'bg-violet-50' },
  { icon: Palette, title: 'Modern Design', desc: 'Pixel-perfect UI crafted with the latest design trends and accessibility standards.', color: 'text-accent', bg: 'bg-orange-50' },
  { icon: Headphones, title: 'Premium Support', desc: 'Get direct help from the creators via email. Typical response under 24 hours.', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: Globe, title: 'Commercial License', desc: 'Use our products in unlimited personal and client projects with the Pro license.', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: Lock, title: 'Secure Downloads', desc: 'Unique download tokens ensure only you can access your purchased files.', color: 'text-amber-500', bg: 'bg-amber-50' },
];

const stats = [
  { value: '500+', label: 'Digital Products', icon: Package },
  { value: '10K+', label: 'Happy Customers', icon: Users },
  { value: '4.9', label: 'Average Rating', icon: Star },
  { value: '24h', label: 'Support Response', icon: Clock },
];

const steps = [
  { step: '01', title: 'Browse & Choose', desc: 'Explore our curated library of premium digital products and find what you need.' },
  { step: '02', title: 'Secure Checkout', desc: 'Complete your purchase through our fast and secure payment system.' },
  { step: '03', title: 'Download & Build', desc: 'Instantly access your files and start building amazing projects right away.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
};

export default function FeaturesPage() {
  return (
    <div className="bg-light min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark text-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/15 via-dark to-primary/10" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-white/20">
              Features
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to <span className="text-primary">build faster</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg font-normal">
              Premium digital products with clean code, modern design, and world-class support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/products">
                <Button className="bg-primary hover:bg-[#E62828] text-white rounded-full px-8 font-bold shadow-lg">
                  Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="rounded-full px-8 font-bold border-white/20 text-white hover:bg-white/10">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 sm:p-6 text-center shadow-lg border border-gray-100"
            >
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-black text-dark">{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark">Why choose Crackncode?</h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto font-normal">
            We obsess over quality so you can focus on shipping.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className={`h-11 w-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-dark mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-dark">How it works</h2>
            <p className="mt-3 text-gray-600">Three simple steps to get started.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mb-5">
                  <span className="text-xl font-black text-primary">{s.step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                )}
                <h3 className="font-bold text-dark text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Banner */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-dark rounded-2xl sm:rounded-3xl p-8 sm:p-14 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Built for developers,<br />designed for everyone
              </h2>
              <p className="text-gray-400 font-normal mb-6 max-w-md">
                Every product is crafted with clean, well-documented code and pixel-perfect design. 
                Whether you're a solo developer or a team, our assets help you ship faster.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">Next.js</span>
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">React</span>
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">Tailwind CSS</span>
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">TypeScript</span>
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">Prisma</span>
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10">Figma</span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { n: '99%', l: 'Satisfaction' },
                  { n: '50+', l: 'Templates' },
                  { n: '24/7', l: 'Access' },
                  { n: '0', l: 'Hidden Fees' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                    <p className="text-2xl font-black text-white">{s.n}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="bg-white py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of developers and designers who trust Crackncode for premium digital assets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button className="bg-primary hover:bg-[#E62828] text-white rounded-full px-8 font-bold shadow-lg">
                Explore Products <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="rounded-full px-8 font-bold">
                See Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
