'use client';

import { ProductCard } from '@/components/shop/ProductCard';
import { BundleCard, Bundle } from '@/components/shop/BundleCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Star, Users, Zap, Shield, ChevronLeft, ChevronRight as ChevronRightIcon, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { apiClient } from '@/lib/axios';
import type { Product } from '@/components/shop/ProductCard';
import { useSettingsStore } from '@/store/useSettingsStore';
import { CategorySidebar } from '@/components/shop/CategorySidebar';

const PromoBanner = lazy(() => import('@/components/shop/PromoBanner').then(m => ({ default: m.PromoBanner })));
const FlashSaleSection = lazy(() => import('@/components/shop/FlashSaleSection').then(m => ({ default: m.FlashSaleSection })));
const LogoShowcase = lazy(() => import('@/components/shop/LogoShowcase').then(m => ({ default: m.LogoShowcase })));
const TestimonialSlider = lazy(() => import('@/components/shop/TestimonialSlider').then(m => ({ default: m.TestimonialSlider })));

function SlideIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-40px)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedCount({ target, duration = 2000 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !triggered.current) {
        triggered.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(eased * target);
          el.textContent = value.toLocaleString() + (progress >= 1 ? '+' : '');
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.style.transition = 'transform 0.3s ease, text-shadow 0.3s ease';
            el.style.transform = 'scale(1.05)';
            el.style.textShadow = '0 0 12px rgba(255,45,45,0.3)';
            setTimeout(() => {
              el.style.transform = 'scale(1)';
              el.style.textShadow = 'none';
            }, 400);
          }
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className="inline-block tabular-nums text-white/80 font-bold">0</span>;
}


const ROTATING_WORDS = ['Build', 'Launch', 'Grow', 'Scale', 'Sell'];

function HeroTitle() {
  const [index, setIndex] = useState(0);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex(i => (i + 1) % ROTATING_WORDS.length);
      leftRef.current?.classList.add('hero-nudge-left');
      rightRef.current?.classList.add('hero-nudge-right');
      setTimeout(() => {
        leftRef.current?.classList.remove('hero-nudge-left');
        rightRef.current?.classList.remove('hero-nudge-right');
      }, 350);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <h2 className="hero-title">
      <span ref={leftRef} className="hero-side-text">Everything You Need to</span>
      <span className="hero-word-wrapper">
        <AnimatePresence mode="wait">
          <motion.span
            key={ROTATING_WORDS[index]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="hero-word-slider"
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span ref={rightRef} className="hero-side-text">Faster</span>
    </h2>
  );
}

const faqs = [
  { question: "Do you offer refunds?", answer: "We offer refunds under specific conditions. If you do not receive your product after successful payment, please contact us within 48 hours. For other issues, refund requests will be reviewed based on our policy. Approved refunds may take 2–3 business days to process." },
  { question: "Can I use these products for client projects?", answer: "Yes, most of our products can be used for personal and client projects. However, resale, redistribution, or sharing the original files is strictly prohibited." },
  { question: "How long will I have access to my product?", answer: "Access duration depends on the specific product. Some products may offer limited-time access, while others may include extended or lifetime access. Please check the product details before purchase." },
  { question: "How do I download my product?", answer: "After successful payment, you will receive access to your product through your account or a secure download link. For security reasons, download access may be limited by time or number of attempts." },
  { question: "Do you provide technical support?", answer: "Yes, we provide support for product-related issues. If you face any problems, feel free to contact us and our team will assist you as soon as possible." },
  { question: "What happens if my download link expires?", answer: "If your download link expires, you can contact our support team with your order details. We will review your request and assist you accordingly." },
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
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, banners.length]);

  useEffect(() => {
    fetchSettings();
    apiClient.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, [fetchSettings]);

  useEffect(() => {
    apiClient.get('/products', { params: { page: 1, limit: 4 } }).then(({ data }) => {
      setTrending(data.products.slice(0, 4));
    }).catch(() => {});
    apiClient.get('/products/top-selling').then(({ data }) => {
      setTopSellers(data);
    }).catch(() => {});
    apiClient.get('/bundles').then(({ data }) => {
      setBundles(data);
    }).catch(() => {});
  }, []);

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
          {/* Categories Sidebar — desktop */}
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

          {/* Hero Banner Slider */}
          <div className="flex-1 relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 shadow-sm min-h-[200px] sm:min-h-[320px] lg:min-h-[360px]">
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
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    {banners[currentSlide].link ? (
                      <Link href={banners[currentSlide].link} className="block w-full h-full">
                        <img
                          src={banners[currentSlide].url}
                          alt={banners[currentSlide].alt}
                          className="w-full h-full object-cover"
                          {...(currentSlide === 0 ? { fetchPriority: 'high' as any, loading: 'eager' } : { loading: 'lazy', decoding: 'async' })}
                        />
                      </Link>
                    ) : (
                      <img
                        src={banners[currentSlide].url}
                        alt={banners[currentSlide].alt}
                        className="w-full h-full object-cover"
                        {...(currentSlide === 0 ? { fetchPriority: 'high' as any, loading: 'eager' } : { loading: 'lazy', decoding: 'async' })}
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
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No banners configured
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories — mobile horizontal scroll */}
      {categories.length > 0 && (
        <section className="lg:hidden container mx-auto px-4 sm:px-6 mt-0.5 mb-1.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-6 sm:px-6 py-1">
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
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
      <Suspense><FlashSaleSection /></Suspense>

      {/* Promo Coupon Banner */}
      <Suspense><PromoBanner /></Suspense>

      {/* Trusted By — Dynamic Logo Showcase */}
      <Suspense><LogoShowcase /></Suspense>

      {/* Trending Resources */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-12 gap-2">
          <div className="max-w-2xl">
            <SlideIn><h2 className="text-xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Trending Resources</h2></SlideIn>
            <SlideIn delay={0.15}><p className="mt-1 sm:mt-4 text-sm sm:text-lg text-gray-600">Trending now — grab these popular products before they&apos;re gone.</p></SlideIn>
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
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5"
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
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-12 gap-2">
            <div className="max-w-2xl">
              <SlideIn><h2 className="text-xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Top Selling Products</h2></SlideIn>
              <SlideIn delay={0.15}><p className="mt-1 sm:mt-4 text-sm sm:text-lg text-gray-600">These are the products everyone is buying right now — don&apos;t miss out.</p></SlideIn>
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
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5"
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
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-12 gap-2">
            <div className="max-w-2xl flex items-center gap-3">
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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5"
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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 sm:pt-12 sm:pb-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-xl bg-dark px-4 py-8 sm:px-12 sm:py-12 shadow-2xl lg:px-16"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dark to-dark"></div>
          <div className="relative mx-auto max-w-3xl text-center">
            <HeroTitle />
            <p className="mx-auto mt-2 sm:mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-gray-400 text-center px-3 sm:px-0">
              Premium digital products built with clean code, modern design, and reliable performance.
            </p>
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5">
              <Link href="/products" className="w-full sm:w-auto flex justify-center">
                <Button className="bg-primary hover:bg-[#E62828] text-white rounded-full px-6 sm:px-7 py-2.5 font-semibold text-sm shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-primary/40 hover:scale-[1.03] w-[85%] sm:w-auto max-w-[280px]">
                  Browse Products <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features-grid" className="w-full sm:w-auto flex justify-center">
                <Button className="bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-full px-6 sm:px-7 py-2.5 font-semibold text-sm transition-all duration-200 w-[85%] sm:w-auto max-w-[280px]">
                  Learn More
                </Button>
              </a>
            </div>
            <div id="features-grid" className="mt-5 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 text-white text-left">
              {[
                { icon: Zap, color: 'text-primary', title: 'Instant Delivery', desc: 'Get instant access to your digital files right after secure checkout.' },
                { icon: Shield, color: 'text-secondary', title: 'Lifetime Updates', desc: 'Receive ongoing updates and improvements at no extra cost.' },
                { icon: Users, color: 'text-accent', title: 'Premium Support', desc: 'Get fast, reliable support whenever you need help.' },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
                  whileHover={{ scale: 1.03 }}
                  className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-white/5"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <card.icon className={`${card.color} h-7 w-7 sm:h-8 sm:w-8 mb-3 sm:mb-4`} />
                  <h3 className="font-medium text-base sm:text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 font-normal">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <Suspense><TestimonialSlider /></Suspense>

      {/* FAQ */}
      <section className="py-8 sm:py-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
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
                  className="px-4 sm:px-6 pb-4 pt-2 text-gray-600 text-sm"
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
