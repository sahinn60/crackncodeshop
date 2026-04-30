'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Star, Check, ArrowLeft, ShieldCheck, Calendar, Tag, ShoppingCart,
  Zap, MessageSquare, TrendingUp, Award, User, Send, Volume2, BadgeCheck, Clock, CheckCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard, Product } from '@/components/shop/ProductCard';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { Price } from '@/components/ui/Price';
import { YouMayAlsoLike, FrequentlyBoughtTogether, BundleUpgrade } from '@/components/shop/UpsellBlock';

interface Review {
  id: string;
  rating: number;
  comment: string;
  status?: string;
  guestName?: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string };
  isVerifiedPurchase?: boolean;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/)([^&?\s]+)/);
  return m?.[1] || null;
}

function ProductVideo({ url }: { url: string }) {
  const videoId = extractVideoId(url);
  const [muted, setMuted] = useState(false);
  const [tried, setTried] = useState(false);

  if (!videoId) return null;

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&rel=0&modestbranding=1`;

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6">
      <div className="relative w-full pt-[56.25%] rounded-2xl overflow-hidden bg-black shadow-xl border border-gray-200">
        <iframe
          key={`${muted}`}
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            if (!tried && !muted) {
              setTried(true);
              setTimeout(() => setMuted(true), 500);
            }
          }}
        />
        {muted && (
          <button
            onClick={() => setMuted(false)}
            className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" /> Tap for sound
          </button>
        )}
      </div>
    </div>
  );
}

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${cls} transition-colors ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:text-amber-400' : ''}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const displayName = review.guestName || review.user.name;
  return (
    <div className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
          {!review.guestName && review.user.avatarUrl ? (
            <img src={review.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-dark text-sm">{displayName}</p>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          <StarRating value={review.rating} size="sm" />
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 bg-white border border-green-200 shadow-xl rounded-2xl px-5 py-4 flex items-start gap-3 max-w-sm"
        >
          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark">Your review has been submitted</p>
            <p className="text-xs text-gray-400 mt-0.5">We'll publish it shortly</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, user: authUser } = useAuthStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [trending, setTrending] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: prod }, { data: revs }, { data: all }] = await Promise.all([
          apiClient.get(`/products/${id}`),
          apiClient.get(`/products/${id}/reviews`),
          apiClient.get('/products', { params: { limit: 50 } }),
        ]);
        setProduct(prod);
        setReviews(revs.reviews || revs);
        if (revs.userReview) setUserReview(revs.userReview);

        const others = all.products.filter((p: Product) => p.id !== id);
        // Trending = newest products
        setTrending(others.slice(0, 4));
        // Bestsellers = highest rated
        const sorted = [...others].sort((a: any, b: any) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        setBestsellers(sorted.slice(0, 4));
      } catch {
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleBuyNow = () => {
    addItem(product, true);
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push(`/login?next=/products/${id}`); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const { data } = await apiClient.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      setUserReview(data.review);
      setReviewRating(0);
      setReviewComment('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const alreadyReviewed = !!userReview || reviews.some(r => r.user.id === authUser?.id);
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return null;

  const features: string[] = Array.isArray(product.features) ? product.features : [];
  const productUrl = `https://crackncode.shop/products/${product.slug || id}`;

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.imageUrl,
    url: productUrl,
    brand: { '@type': 'Brand', name: 'CrackNcode' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BDT',
      availability: 'https://schema.org/InStock',
      url: productUrl,
    },
    ...(product.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || reviews.length || 1,
      },
    }),
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
        <Link href="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-5 sm:mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to products
        </Link>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-x-12 xl:gap-x-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:max-w-lg lg:self-start">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-100 shadow-xl border border-gray-200">
              <img src={product.imageUrl} alt={product.title} className="w-full h-auto object-contain" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{product.lastUpdated || 'Recently'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-600">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-medium">{product.format || 'Digital Download'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-6 lg:mt-0">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4 tracking-wide uppercase">
              {product.category}
            </span>
            {product.isBundle && (
              <span className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white mb-4 ml-2 tracking-wide uppercase">
                📦 Bundle Deal
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark lg:text-4xl">{product.title}</h1>

            <div className="mt-4 flex items-center gap-3">
              <StarRating value={Math.round(product.rating)} />
              <span className="text-sm font-medium text-gray-600">{product.rating}</span>
              <span className="text-sm text-gray-400">({product.reviewCount} reviews)</span>
            </div>

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-dark"><Price amount={product.price} /></p>
              {product.oldPrice && product.oldPrice > product.price && (
                <p className="text-xl text-gray-400 line-through font-medium"><Price amount={product.oldPrice} /></p>
              )}
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="inline-flex items-center rounded-lg bg-primary px-2.5 py-1 text-xs font-extrabold text-white">
                  -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                </span>
              )}
            </div>

            <p className="mt-6 text-base text-gray-600 leading-relaxed">{product.description}</p>

            {features.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-dark uppercase tracking-wider mb-3">What's included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={() => addItem(product)} className="flex-1 h-12 gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white font-semibold" variant="outline">
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </Button>
              <Button onClick={handleBuyNow} className="flex-1 h-12 gap-2 bg-primary hover:bg-[#E62828] text-white font-bold shadow-lg shadow-primary/25">
                <Zap className="h-5 w-5" /> Buy Now
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="font-medium">Secure checkout · Instant delivery</span>
            </div>
          </motion.div>
        </div>

        {/* Video Section */}
        {product.youtubeUrl && (
          <div className="mt-12 sm:mt-16 py-8 sm:py-10">
            <ProductVideo url={product.youtubeUrl} />
          </div>
        )}

        {/* Tabs: Description / Reviews */}
        <div className="mt-8 sm:mt-12 border-t border-gray-200 pt-8 sm:pt-12">
          <div className="flex border-b border-gray-200 mb-6 sm:mb-8 gap-1 overflow-x-auto">
            {[
              { key: 'description', label: 'Description', icon: Tag },
              { key: 'reviews', label: `Reviews (${product.reviewCount || reviews.length})`, icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.key}
                className={`flex items-center gap-2 pb-3 px-3 sm:px-5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
                  {product.longDescription ? (
                    <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.longDescription}
                    </div>
                  ) : (
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  )}

                  {features.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h3 className="font-bold text-dark mb-4">Features & Highlights</h3>
                      <ul className="space-y-2">
                        {features.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2.5 text-gray-600">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Format', value: product.format || 'Digital' },
                      { label: 'Category', value: product.category },
                      { label: 'Last Updated', value: product.lastUpdated || 'Recently' },
                      { label: 'Downloads', value: `Up to ${product.downloadLimit || 5}` },
                    ].map(item => (
                      <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-semibold text-dark mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="rev" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
                  {/* Rating Summary */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
                    <div className="text-center mb-6">
                      <p className="text-5xl font-black text-dark">{product.rating}</p>
                      <StarRating value={Math.round(product.rating)} />
                      <p className="text-sm text-gray-400 mt-1">{reviews.length} reviews</p>
                    </div>
                    <div className="space-y-2">
                      {ratingDistribution.map(r => (
                        <div key={r.star} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-gray-500 font-medium">{r.star}</span>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-gray-400 text-xs">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews List + Form */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Submit Review */}
                    {isAuthenticated && !alreadyReviewed && (
                      <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" /> Write a Review
                        </h3>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">Your Rating</label>
                          <StarRating value={reviewRating} onChange={setReviewRating} />
                        </div>
                        <textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          placeholder="Share your experience with this product..."
                          rows={3}
                          className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-3"
                        />
                        {reviewError && <p className="text-sm text-red-500 mb-3">{reviewError}</p>}
                        <Button type="submit" disabled={reviewSubmitting || !reviewRating || !reviewComment.trim()} className="bg-primary hover:bg-[#E62828] text-white gap-2 font-semibold">
                          <Send className="h-4 w-4" /> {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </form>
                    )}

                    {!isAuthenticated && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                        <p className="text-gray-500 text-sm">
                          <Link href={`/login?next=/products/${id}`} className="text-primary font-semibold hover:underline">Sign in</Link> to leave a review
                        </p>
                      </div>
                    )}

                    {userReview && userReview.status === 'pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 font-medium text-center flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" /> Your review is under review — we'll publish it shortly
                      </div>
                    )}

                    {userReview && userReview.status === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-medium text-center">
                        Your review needs changes. Please edit and resubmit.
                      </div>
                    )}

                    {alreadyReviewed && !userReview && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700 font-medium text-center">
                        ✓ Your review has been published
                      </div>
                    )}

                    {/* Reviews */}
                    {reviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                        <p className="font-medium">No reviews yet</p>
                        <p className="text-sm mt-1">Be the first to share your experience!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                        <p className="text-xs text-gray-400 text-center pt-2">✦ New reviews are being added shortly</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Frequently Bought Together */}
        <FrequentlyBoughtTogether productId={id} currentProduct={product} />

        {/* Bundle Upgrade */}
        <BundleUpgrade productId={id} />

        {/* You May Also Like (replaces old trending/bestsellers with smart recommendations) */}
        <YouMayAlsoLike productId={id} />

        {/* Trending Products (fallback) */}
        {trending.length > 0 && (
          <div className="mt-12 sm:mt-20 pt-8 sm:pt-12 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-dark">Trending Now</h2>
                <p className="text-sm text-gray-400">Most popular products right now</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {trending.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Bestsellers */}
        {bestsellers.length > 0 && (
          <div className="mt-12 sm:mt-20 pt-8 sm:pt-12 border-t border-gray-200 pb-8 sm:pb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-dark">Bestsellers</h2>
                <p className="text-sm text-gray-400">Top rated by our customers</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <SuccessToast show={showToast} />
    </div>
  );
}
