'use client';

import { ProductCard } from '@/components/shop/ProductCard';
import { BundleCard, Bundle } from '@/components/shop/BundleCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef, lazy, Suspense, memo } from 'react';
import { apiClient } from '@/lib/axios';
import type { Product } from '@/components/shop/ProductCard';
import { useSettingsStore } from '@/store/useSettingsStore';
import { CategorySidebar } from '@/components/shop/CategorySidebar';

const PromoBanner = lazy(() => import('@/components/shop/PromoBanner').then(m => ({ default: m.PromoBanner })));
const FlashSaleSection = lazy(() => import('@/components/shop/FlashSaleSection').then(m => ({ default: m.FlashSaleSection })));
const LogoShowcase = lazy(() => import('@/components/shop/LogoShowcase').then(m => ({ default: m.LogoShowcase })));
const TestimonialSlider = lazy(() => import('@/components/shop/TestimonialSlider').then(m => ({ default: m.TestimonialSlider })));

// CSS-based fade-in on scroll (no framer-motion overhead)
function FadeSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1, rootMargin: '100px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      }}
    >
      {children}
    </div>
  );
}

const ROTATING_WORDS = ['Build', 'Launch', 'Grow', 'Scale', 'Sell'];

const HeroTitle = memo(function HeroTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % ROTATING_WORDS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <h2 className="hero-title">
      <span className="hero-side-text">Everything You Need to</span>
      <span className="hero-word-wrapper">
        <AnimatePresence mode="wait">
          <motion.span
            key={ROTATING_WORDS[index]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="hero-word-slider"
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="hero-side-text">Faster</span>
    </h2>
  );
});

const faqs = [
  { question: "Do you offer refunds?", answer: "We offer refunds under specific conditions. If you do not receive your product after successful payment, please contact us within 48 hours. For other issues, refund requests will be reviewed based on our policy. Approved refunds may take 2–3 business days to process." },
  { question: "Can I use these products for client projects?", answer: "Yes, most of our products can be used for personal and client projects. However, resale, redistribution, or sharing the original files is strictly prohibited." },
  { question: "How long will I have access to my product?", answer: "Access duration depends on the specific product. Some products may offer limited-time access, while others may include extended or lifetime access. Please check the product details before purchase." },
  { question: "How do I download my product?", answer: "After successful payment, you will receive access to your product through your account or a secure download link. For security reasons, download access may be limited by time or number of attempts." },
  { question: "Do you provide technical support?", answer: "Yes, we provide support for product-related issues. If you face any problems, feel free to contact us and our team will assist you as soon as possible." },
  { question: "What happens if my download link expires?", answer: "If your download link expires, you can contact our support team with your order details. We will review your request and assist you accordingly." },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trending, setTrending] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; imageUrl?: string; children: { id: string; name: string; slug: string }[] }[]>([]);
  const { settings, fetchSettings } = useSettingsStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const banners = settings?.bannerImages && settings.bannerImages.length > 0
    ? settings.bannerImages
    : settings?.heroBannerUrl
      ? [{ url: settings.heroBannerUrl, link: '/products', alt: 'Banner' }]
      : [];

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, banners.length]);

  // Single consolidated data fetch
  useEffect(() => {
    fetchSettings();
    Promise.allSettled([
      apiClient.get('/categories'),
      apiClient.get('/products', { params: { page: 1, limit: 4 } }),
      apiClient.get('/products/top-selling'),
      apiClient.get('/bundles'),
    ]).then(([catRes, prodRes, topRes, bundleRes]) => {
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (prodRes.status === 'fulfilled') setTrending(prodRes.value.data.products?.slice(0, 4) || []);
      if (topRes.status === 'fulfilled') setTopSellers(topRes.value.data || []);
      if (bundleRes.status === 'fulfilled') setBundles(bundleRes.value.data || []);
    });
  }, [fetchSettings]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="flex flex-col pb-10 sm:pb-20 bg-light text-dark">

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-8 mt-1 sm:mt-4">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
          <div className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-20">
              <CategorySidebar
                categories={categories}
                selectedCategory=""
                isBundleMode={false}
                onSelectCategory={(name) => { window.location.href = name === 'All' ? '/products' : `/products?category=${encodeURIComponent(name)}`; }}
                onSelectBundle={() => { window.location.href = '/products?category=bundles'; }}
              />
            </div>
          </div>

          {/* Banner Slider */}
          <div className="flex-1 relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 shadow-sm sm:min-h-[320px] lg:min-h-[360px]">
            {banners.length > 0 ? (
              <>
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="sm:absolute sm:inset-0"
                  >
                    {banners[currentSlide].link ? (
                      <Link href={banners[currentSlide].link} className="block w-full h-full">
                        <img
                          src={banners[currentSlide].url}
                          alt={banners[currentSlide].alt}
                          className="w-full h-auto sm:h-full object-contain sm:object-cover"
                          {...(currentSlide === 0 ? { fetchPriority: 'high' as any, loading: 'eager' } : { loading: 'lazy', decoding: 'async' })}
                        />
                      </Link>
                    ) : (
                      <img
                        src={banners[currentSlide].url}
                        alt={banners[currentSlide].alt}
                        className="w-full h-auto sm:h-full object-contain sm:object-cover"
                        {...(currentSlide === 0 ? { fetchPriority: 'high' as any, loading: 'eager' } : { loading: 'lazy', decoding: 'async' })}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {banners.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button onClick={nextSlide} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                      <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                      {banners.map((_, i) => (
                        <button key={i} onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No banners configured</div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Categories */}
      {categories.length > 0 && (
        <section className="lg:hidden container mx-auto px-4 sm:px-6 mt-0.5 mb-1.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-6 sm:px-6 py-1">
            <Link href="/products" className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 sm:w-20">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-dark flex items-center justify-center">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-600 font-medium text-center leading-tight line-clamp-1">All</span>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 sm:w-20 group">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-medium text-gray-300">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-600 font-medium text-center leading-tight line-clamp-1">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Suspense><FlashSaleSection /></Suspense>
      <Suspense><PromoBanner /></Suspense>
      <Suspense><LogoShowcase /></Suspense>

      {/* Trending */}
      {trending.length > 0 && (
        <FadeSection className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-12 gap-2">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Trending Resources</h2>
              <p className="mt-1 sm:mt-4 text-sm sm:text-lg text-gray-600">Trending now — grab these popular products before they&apos;re gone.</p>
            </div>
            <Link href="/products" className="flex items-center text-sm font-medium text-primary hover:text-[#E62828] group">
              View entire library <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {trending.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </FadeSection>
      )}

      {/* Top Sellers */}
      {topSellers.length > 0 && (
        <FadeSection className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-12 gap-2">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Top Selling Products</h2>
              <p className="mt-1 sm:mt-4 text-sm sm:text-lg text-gray-600">These are the products everyone is buying right now.</p>
            </div>
            <Link href="/products" className="flex items-center text-sm font-medium text-primary hover:text-[#E62828] group">
              View all top sellers <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {topSellers.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </FadeSection>
      )}

      {/* Bundles */}
      {bundles.length > 0 && (
        <FadeSection className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-12 gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Bundle Deals</h2>
                <p className="mt-1 text-sm sm:text-lg text-gray-600">Save more with our curated product bundles.</p>
              </div>
            </div>
            <Link href="/products?category=bundles" className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 group">
              View all bundles <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {bundles.slice(0, 4).map(bundle => <BundleCard key={bundle.id} bundle={bundle} />)}
          </div>
        </FadeSection>
      )}

      {/* Feature Banner */}
      <FadeSection className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 sm:pt-12 sm:pb-4">
        <div className="relative overflow-hidden rounded-xl bg-dark px-4 py-8 sm:px-12 sm:py-12 shadow-2xl lg:px-16">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dark to-dark" />
          <div className="relative mx-auto max-w-3xl text-center">
            <HeroTitle />
            <p className="mx-auto mt-2 sm:mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-gray-400 text-center px-3 sm:px-0">
              Premium digital products built with clean code, modern design, and reliable performance.
            </p>
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5">
              <Link href="/products" className="w-full sm:w-auto flex justify-center">
                <Button className="bg-primary hover:bg-[#E62828] text-white rounded-full px-6 sm:px-7 py-2.5 font-semibold text-sm shadow-lg shadow-primary/25 w-[85%] sm:w-auto max-w-[280px]">
                  Browse Products <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-5 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 text-white text-left">
              {[
                { title: 'Instant Delivery', desc: 'Get instant access to your digital files right after secure checkout.' },
                { title: 'Lifetime Updates', desc: 'Receive ongoing updates and improvements at no extra cost.' },
                { title: 'Premium Support', desc: 'Get fast, reliable support whenever you need help.' },
              ].map((card) => (
                <div key={card.title} className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-medium text-base sm:text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 font-normal">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      <Suspense><TestimonialSlider /></Suspense>

      {/* FAQ — pure CSS, no framer-motion */}
      <section className="py-8 sm:py-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-dark text-left text-sm sm:text-base">{faq.question}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              <div className={`grid transition-all duration-300 ${openFaq === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="px-4 sm:px-6 pb-4 pt-2 text-gray-600 text-sm">{faq.answer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
