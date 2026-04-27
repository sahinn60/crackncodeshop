'use client';

import { ProductCard } from '@/components/shop/ProductCard';
import { BundleCard, Bundle } from '@/components/shop/BundleCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Star, Users, Zap, Shield, ChevronLeft, ChevronRight as ChevronRightIcon, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/axios';
import type { Product } from '@/components/shop/ProductCard';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PromoBanner } from '@/components/shop/PromoBanner';
import { FlashSaleSection } from '@/components/shop/FlashSaleSection';

const testimonials = [
  { id: 1, content: "This UI kit saved me at least 3 weeks of development time. The components are accessible and beautifully designed.", author: "Sarah Jenkins", role: "Frontend Developer", avatar: "https://i.pravatar.cc/150?u=sarah" },
  { id: 2, content: "The best Next.js starter template I've ever used. The code is clean, and the integration with Stripe is flawless.", author: "David Chen", role: "Startup Founder", avatar: "https://i.pravatar.cc/150?u=david" },
  { id: 3, content: "Incredible value for the price. I use these templates for all my client projects now.", author: "Marcus West", role: "Freelance Designer", avatar: "https://i.pravatar.cc/150?u=marcus" },
];

const faqs = [
  { question: "Do you offer refunds?", answer: "Yes, we offer a 14-day money-back guarantee if you are not satisfied with the product. No questions asked." },
  { question: "Can I use these assets for client projects?", answer: "Absolutely. The commercial license allows you to use our assets in unlimited client projects." },
  { question: "How long do I get updates?", answer: "All purchases include lifetime access to updates for that specific product version." },
  { question: "Do you provide technical support?", answer: "Yes, we provide email support for all premium products. Our typical response time is under 24 hours." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } }
};

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [trending, setTrending] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; imageUrl?: string; children: { id: string; name: string; slug: string }[] }[]>([]);
  const { settings, fetchSettings } = useSettingsStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const [catOpen, setCatOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const defaultBanners = [
    { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80', link: '/products', alt: 'Premium UI Kits' },
    { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80', link: '/products', alt: 'Dashboard Templates' },
    { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80', link: '/products', alt: 'Developer Tools' },
  ];

  const banners = settings?.bannerImages && settings.bannerImages.length >= 3
    ? settings.bannerImages
    : settings?.heroBannerUrl
      ? [{ url: settings.heroBannerUrl, link: '/products', alt: 'Banner' }, ...defaultBanners.slice(1)]
      : defaultBanners;

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    fetchSettings();
    apiClient.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, [fetchSettings]);

  useEffect(() => {
    apiClient.get('/products', { params: { page: 1, limit: 4 } }).then(({ data }) => {
      console.log('[Homepage] Trending products:', data.products?.length, data.products);
      setTrending(data.products.slice(0, 4));
    }).catch((err) => console.error('[Homepage] Failed to fetch trending:', err));
    apiClient.get('/products/top-selling').then(({ data }) => {
      console.log('[Homepage] Top sellers:', data?.length, data);
      setTopSellers(data);
    }).catch((err) => console.error('[Homepage] Failed to fetch top-selling:', err));
    apiClient.get('/bundles').then(({ data }) => {
      console.log('[Homepage] Bundles from admin:', data?.length, data);
      setBundles(data);
    }).catch((err) => console.error('[Homepage] Failed to fetch bundles:', err));
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="flex flex-col pb-10 sm:pb-20 bg-light text-dark font-light">
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 mt-2 sm:mt-4">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
          {/* Categories Mega Menu — desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            {/* Toggle button */}
            <button
              onClick={() => setCatOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-dark text-white rounded-t-lg text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                Browse Categories
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Collapsible category list */}
            <AnimatePresence>
              {catOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden bg-white border border-t-0 border-gray-100 rounded-b-lg shadow-lg"
                >
                  <div className="py-1">
                    <Link
                      href="/products"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      <Package className="h-4 w-4 text-gray-400" />
                      All Products
                    </Link>

                    {categories.map(cat => (
                      <div key={cat.id} className="relative group/cat">
                        <div className="flex items-center">
                          <Link
                            href={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setCatOpen(false)}
                            className="flex-1 flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt="" className="h-5 w-5 rounded object-cover flex-shrink-0" />
                            ) : (
                              <span className="h-5 w-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-400 flex-shrink-0">{cat.name.charAt(0)}</span>
                            )}
                            {cat.name}
                          </Link>
                          {cat.children.length > 0 && (
                            <button
                              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                              className="px-3 py-2.5 text-gray-400 hover:text-primary transition-colors"
                            >
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedCat === cat.id ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Subcategories — expand/collapse */}
                        <AnimatePresence>
                          {expandedCat === cat.id && cat.children.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-gray-50/50"
                            >
                              {cat.children.map(sub => (
                                <Link
                                  key={sub.id}
                                  href={`/products?category=${encodeURIComponent(sub.name)}`}
                                  onClick={() => setCatOpen(false)}
                                  className="flex items-center gap-2 pl-12 pr-4 py-2 text-xs text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                                >
                                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                                  {sub.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Mega menu flyout on hover — shows subcategories to the right */}
                        {cat.children.length > 0 && (
                          <div className="absolute left-full top-0 ml-0 w-56 bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-200 z-50 py-2">
                            <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{cat.name}</p>
                            {cat.children.map(sub => (
                              <Link
                                key={sub.id}
                                href={`/products?category=${encodeURIComponent(sub.name)}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors"
                              >
                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hero Banner Slider */}
          <div className="flex-1 relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 shadow-sm min-h-[240px] sm:min-h-[320px] lg:min-h-[360px]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {banners[currentSlide].link ? (
                  <Link href={banners[currentSlide].link} className="block w-full h-full">
                    <img
                      src={banners[currentSlide].url}
                      alt={banners[currentSlide].alt}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ) : (
                  <img
                    src={banners[currentSlide].url}
                    alt={banners[currentSlide].alt}
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next arrows */}
            {banners.length > 1 && (
              <>
                <button onClick={prevSlide} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button onClick={nextSlide} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Categories — mobile horizontal scroll */}
      {categories.length > 0 && (
        <section className="lg:hidden container mx-auto px-4 sm:px-6 mt-1 mb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 py-1">
            <Link
              href="/products"
              className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 sm:w-20"
            >
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-dark flex items-center justify-center">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-600 font-medium text-center leading-tight line-clamp-1">All</span>
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 sm:w-20 group"
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg sm:text-xl font-medium text-gray-300">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-600 font-medium text-center leading-tight line-clamp-1 group-hover:text-primary transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      <FlashSaleSection />

      {/* Promo Coupon Banner */}
      <PromoBanner />

      {/* Trusted By Section (Marquee) */}
      <section className="py-6 sm:py-10 border-y border-gray-200 bg-dark overflow-hidden my-4 sm:my-8">
        <div className="container mx-auto px-4 mb-5 sm:mb-8">
          <p className="text-center text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-widest">Trusted by innovative teams worldwide</p>
        </div>
        <div className="relative w-full flex overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-dark to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-dark to-transparent z-10 pointer-events-none"></div>
          <div className="flex animate-marquee whitespace-nowrap items-center justify-around w-[200%]">
            {[...Array(2)].map((_, idx) => (
              <div key={idx} className="flex gap-10 sm:gap-20 px-5 sm:px-10 items-center min-w-full justify-around">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-5 sm:h-8 w-auto object-contain brightness-0 invert" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM" className="h-5 sm:h-8 w-auto object-contain brightness-0 invert" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-5 sm:h-8 w-auto object-contain brightness-0 invert" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="h-4 sm:h-6 w-auto object-contain brightness-0 invert" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Apple_logo_black.svg" alt="Apple" className="h-5 sm:h-8 w-auto object-contain brightness-0 invert" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="h-5 sm:h-8 w-auto object-contain brightness-0 invert" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Resources */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-3">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Trending Resources</h2>
            <p className="mt-2 sm:mt-4 text-base sm:text-lg text-gray-500 font-light">Hand-picked premium assets to supercharge your next big project.</p>
          </div>
          <Link href="/products" className="flex items-center text-sm font-medium text-primary hover:text-[#E62828] group">
            View entire library <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {trending.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            {trending.slice(0, 4).map((product) => (
              <motion.div key={product.id} variants={itemVariants} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            No products yet. <Link href="/admin/products" className="text-primary hover:underline">Add some from the admin panel.</Link>
          </div>
        )}
      </section>

      {/* Top Selling Products */}
      {topSellers.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-3">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Top Selling Products</h2>
              <p className="mt-2 sm:mt-4 text-base sm:text-lg text-gray-500 font-light">Our most popular products loved by thousands of creators.</p>
            </div>
            <Link href="/products" className="flex items-center text-sm font-medium text-primary hover:text-[#E62828] group">
              View all top sellers <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            {topSellers.slice(0, 4).map((product) => (
              <motion.div key={product.id} variants={itemVariants} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Bundle Deals */}
      {bundles.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-3">
            <div className="max-w-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Bundle Deals</h2>
                <p className="mt-1 text-base sm:text-lg text-gray-500 font-light">Save more with our curated product bundles.</p>
              </div>
            </div>
            <Link href="/products?category=bundles" className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 group">
              View all bundles <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            {bundles.slice(0, 4).map((bundle) => (
              <motion.div key={bundle.id} variants={itemVariants} className="h-full">
                <BundleCard bundle={bundle} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Feature Banner */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-lg sm:rounded-xl bg-dark px-5 py-12 sm:px-12 sm:py-20 shadow-2xl lg:px-16"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dark to-dark"></div>
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white lg:text-4xl">Why developers choose us</h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-300 font-light">
              We focus on code quality, developer experience, and modern aesthetics. Save hundreds of hours of design and development time.
            </p>
            <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-white text-left">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Zap className="text-primary h-7 w-7 sm:h-8 sm:w-8 mb-3 sm:mb-4"/>
                <h3 className="font-medium text-base sm:text-lg mb-2">Instant Delivery</h3>
                <p className="text-sm text-gray-400 font-light">Get access to your digital files immediately after secure checkout.</p>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Shield className="text-secondary h-7 w-7 sm:h-8 sm:w-8 mb-3 sm:mb-4"/>
                <h3 className="font-medium text-base sm:text-lg mb-2">Lifetime Updates</h3>
                <p className="text-sm text-gray-400 font-light">Download the latest versions and improvements at no extra cost.</p>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Users className="text-accent h-7 w-7 sm:h-8 sm:w-8 mb-3 sm:mb-4"/>
                <h3 className="font-medium text-base sm:text-lg mb-2">Premium Support</h3>
                <p className="text-sm text-gray-400 font-light">Direct access to the creators for technical help and guidance.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-dark">Loved by creators</h2>
            <p className="mt-3 sm:mt-4 text-gray-500 text-base sm:text-lg font-light">Don't just take our word for it.</p>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 max-w-6xl mx-auto"
          >
            {testimonials.map((t) => (
              <motion.div key={t.id} variants={itemVariants} className="bg-light p-6 sm:p-8 rounded-lg border border-gray-100 relative hover:shadow-lg transition-shadow">
                <Star className="absolute top-6 right-6 sm:top-8 sm:right-8 h-5 w-5 fill-accent text-accent opacity-20" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
                </div>
                <p className="text-gray-600 italic mb-6 font-light text-sm sm:text-base">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.avatar} alt={t.author} className="h-10 w-10 rounded-full bg-gray-200" />
                  <div>
                    <h4 className="font-medium text-dark text-sm">{t.author}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <button
                className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-dark text-left text-sm sm:text-base">{faq.question}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 sm:px-6 pb-4 pt-2 text-gray-500 text-sm font-light"
                >
                  {faq.answer}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
