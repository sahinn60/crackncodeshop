'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronDown, Check, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { DailyCountdown } from '@/components/shop/DailyCountdown';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';

interface Section {
  id: string;
  type: string;
  isActive: boolean;
  content: any;
  settings: { animationType: string; delay: number; duration: number };
}

interface LandingPageData {
  id: string;
  title: string;
  slug: string;
  sections: Section[];
  product: any | null;
}

const anim = (type: string, delay: number) => {
  const variants: Record<string, any> = {
    fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    slide: { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } },
    zoom: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  };
  return {
    variants: variants[type] || variants.fade,
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true },
    transition: { duration: 0.6, delay },
  };
};

export default function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<LandingPageData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/landing-pages/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500">This landing page doesn't exist or isn't published yet.</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const active = data.sections.filter(s => s.isActive);

  return (
    <div className="flex flex-col">
      {active.map(section => (
        <SectionRenderer key={section.id} section={section} product={data.product} />
      ))}
    </div>
  );
}

function SectionRenderer({ section, product }: { section: Section; product: any }) {
  const { type, content: c, settings } = section;
  const a = anim(settings.animationType, settings.delay);

  switch (type) {
    case 'hero': return <HeroSection c={c} a={a} product={product} />;
    case 'video': return <VideoSection c={c} a={a} />;
    case 'features': return <FeaturesSection c={c} a={a} />;
    case 'reviews': return <ReviewsSection c={c} a={a} />;
    case 'pricing': return <PricingSection c={c} a={a} product={product} />;
    case 'faq': return <FaqSection c={c} a={a} />;
    case 'cta': return <CtaSection c={c} a={a} />;
    default: return null;
  }
}

function HeroSection({ c, a, product }: { c: any; a: any; product: any }) {
  const images = c.images || [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setCurrent(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {images.length > 0 && (
        <div className="absolute inset-0">
          <img src={images[current]} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        </div>
      )}
      <motion.div {...a} className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
            {c.headline}
          </h1>
          {c.subheadline && (
            <p className="text-lg sm:text-xl text-gray-300 mb-8 font-normal">{c.subheadline}</p>
          )}
          {c.buttonText && (
            <Button className="bg-primary text-white hover:bg-[#E62828] px-8 py-3 text-base font-bold rounded-full shadow-lg" asChild>
              <Link href={c.buttonLink || '/checkout'}>{c.buttonText}</Link>
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function VideoSection({ c, a }: { c: any; a: any }) {
  if (!c.youtubeUrl) return null;
  const videoId = c.youtubeUrl.match(/(?:youtu\.be\/|v=|\/embed\/)([^&?\s]+)/)?.[1];
  if (!videoId) return null;

  return (
    <section className="py-12 sm:py-20 bg-white">
      <motion.div {...a} className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </motion.div>
    </section>
  );
}

function FeaturesSection({ c, a }: { c: any; a: any }) {
  const items = c.items || [];
  if (!items.length) return null;

  return (
    <section className="py-12 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...a} className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{c.title}</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {items.map((item: any, i: number) => (
            <motion.div key={i} {...anim('slide', 0.1 * i)} className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-3xl sm:text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm font-normal">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection({ c, a }: { c: any; a: any }) {
  const items = c.items || [];
  if (!items.length) return null;

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...a} className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{c.title}</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item: any, i: number) => (
            <motion.div key={i} {...anim('fade', 0.1 * i)} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className={`h-4 w-4 ${j < (item.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-gray-600 text-sm italic mb-4 font-normal">"{item.text}"</p>
              {item.name && <p className="text-sm font-semibold text-gray-900">{item.name}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ c, a, product }: { c: any; a: any; product: any }) {
  const addItem = useCartStore(s => s.addItem);
  const price = Number(c.price) || 0;
  const oldPrice = Number(c.oldPrice) || 0;
  const features = c.features || [];

  console.log('PricingSection content:', c);

  const handleBuy = () => {
    if (product) {
      addItem({
        id: product.id,
        title: product.title,
        description: '',
        price: product.price,
        oldPrice: product.oldPrice,
        imageUrl: product.imageUrl || '',
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        category: product.category || '',
      });
    }
  };

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...a} className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{c.title}</h2>
          </div>
          <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-gray-900">
                  <Price amount={price} />
                </span>
                {oldPrice > 0 && oldPrice !== price && (
                  <span className="text-xl text-gray-400 line-through font-medium">
                    <Price amount={oldPrice} />
                  </span>
                )}
              </div>
            </div>

            {c.countdown?.enabled && (
              <div className="flex justify-center mb-6">
                <DailyCountdown endTime={c.countdown.isDaily ? null : c.countdown.endTime} variant="card" />
              </div>
            )}

            {features.length > 0 && (
              <ul className="space-y-3 mb-8">
                {features.filter((f: string) => f.trim()).map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <Button
              onClick={handleBuy}
              className="w-full bg-primary text-white hover:bg-[#E62828] font-bold py-3 text-base rounded-xl shadow-lg gap-2"
            >
              <ShoppingCart className="h-5 w-5" /> Buy Now
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FaqSection({ c, a }: { c: any; a: any }) {
  const items = c.items || [];
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <motion.div {...a} className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{c.title}</h2>
        </motion.div>
        <div className="space-y-3">
          {items.map((item: any, i: number) => (
            <motion.div key={i} {...anim('slide', 0.05 * i)} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-5 py-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900 text-left text-sm sm:text-base">{item.question}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-gray-500 text-sm font-normal">{item.answer}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ c, a }: { c: any; a: any }) {
  return (
    <section className="py-12 sm:py-20">
      <motion.div {...a} className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-14 sm:px-12 sm:py-20 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">{c.headline}</h2>
            {c.subheadline && <p className="text-gray-300 text-lg mb-8 font-normal">{c.subheadline}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {c.buttonText && (
                <Button className="bg-primary text-white hover:bg-[#E62828] px-8 py-3 font-bold rounded-full shadow-lg" asChild>
                  <Link href={c.buttonLink || '/checkout'}>{c.buttonText}</Link>
                </Button>
              )}
              {c.secondaryButtonText && (
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 font-bold rounded-full" asChild>
                  <Link href={c.secondaryButtonLink || '/'}>{c.secondaryButtonText}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
