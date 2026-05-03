'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import {
  Download, Package, User, Save, X, CheckCircle,
  ShoppingBag, CreditCard, CalendarDays, ExternalLink,
  LogOut, ChevronRight, Clock, TrendingUp, Star, MessageSquare, Send, Edit3, Lock, Eye, EyeOff,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { Suspense } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Price } from '@/components/ui/Price';

interface OrderItem { id: string; product: { id: string; title: string; imageUrl: string; category: string }; price: number; downloadCount: number }
interface Order { id: string; total: number; status: string; createdAt: string; items: OrderItem[] }

type Tab = 'library' | 'orders' | 'reviews' | 'profile';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REFUNDED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-dark mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dlError, setDlError] = useState('');

  const handleDownload = async (orderItemId: string) => {
    setDownloading(orderItemId);
    setDlError('');
    try {
      const { data } = await apiClient.post('/download/generate', { orderItemId });
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = '';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setDlError(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
      <button onClick={() => setExpanded(e => !e)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
        {/* Product thumbnails stack */}
        <div className="flex -space-x-2 flex-shrink-0">
          {order.items.slice(0, 3).map((item, i) => (
            <img key={i} src={item.product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border-2 border-white shadow-sm" />
          ))}
          {order.items.length > 3 && (
            <div className="h-10 w-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
              +{order.items.length - 3}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-dark truncate">
            {order.items.map(i => i.product.title).join(', ')}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs font-semibold text-dark"><Price amount={order.total} /></span>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border flex-shrink-0 ${STATUS_STYLES[order.status] || STATUS_STYLES.PENDING}`}>
          {order.status}
        </span>
        <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 border-t border-gray-50">
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                    <img src={item.product.imageUrl} alt={item.product.title} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.id}`} className="text-sm font-medium text-dark hover:text-primary transition-colors line-clamp-1">
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-gray-400">{item.product.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-dark flex-shrink-0"><Price amount={item.price} /></span>
                    {order.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloading === item.id}
                        onClick={(e) => { e.stopPropagation(); handleDownload(item.id); }}
                        className="h-8 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white flex-shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" /> {downloading === item.id ? '...' : 'Download'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Order #{order.id.slice(-8)}</span>
                <span className="text-sm font-bold text-dark">Total: <Price amount={order.total} /></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';

function DashboardContent() {
  const { isAuthenticated, user, updateProfile, logout } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [grantedProducts, setGrantedProducts] = useState<{ id: string; title: string; imageUrl: string; category: string; price: number; hasFile: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [libDownloading, setLibDownloading] = useState<string | null>(null);
  const [libDlError, setLibDlError] = useState('');
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // Profile form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (searchParams.get('tab') === 'profile') setActiveTab('profile');
    if (searchParams.get('tab') === 'orders') setActiveTab('orders');
    if (searchParams.get('tab') === 'reviews') setActiveTab('reviews');
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    apiClient.get('/orders').then(({ data }) => {
      setOrders(data.orders || data);
      setGrantedProducts(data.grantedProducts || []);
    }).finally(() => setIsLoading(false));
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (activeTab === 'reviews' && myReviews.length === 0 && isAuthenticated) {
      setReviewsLoading(true);
      apiClient.get('/user/reviews').then(({ data }) => setMyReviews(data)).finally(() => setReviewsLoading(false));
    }
  }, [activeTab, isAuthenticated, myReviews.length]);

  useEffect(() => {
    if (user) { setName(user.name || ''); setBio(user.bio || ''); setAvatarUrl(user.avatarUrl || ''); }
  }, [user]);

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'COMPLETED');
    const totalSpent = completed.reduce((s, o) => s + o.total, 0);
    const totalProducts = completed.reduce((s, o) => s + o.items.length, 0);
    return { totalOrders: orders.length, totalSpent, totalProducts };
  }, [orders]);

  if (!isAuthenticated) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setSaveError('Name must be at least 2 characters'); return; }
    setIsSaving(true); setSaveError('');
    const ok = await updateProfile({ name, bio, avatarUrl });
    setIsSaving(false);
    if (ok) { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    else setSaveError('Failed to save profile. Please try again.');
  };

  const handleLogout = () => { logout(); router.push('/'); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const { data } = await apiClient.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(data.message);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const memberSince = user ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  const completedProducts = [
    ...orders.filter(o => o.status === 'COMPLETED').flatMap(o => o.items),
    ...grantedProducts.map(p => ({ id: '', product: { id: p.id, title: p.title, imageUrl: p.imageUrl, category: p.category }, price: p.price, downloadCount: 0, _granted: true })),
  ];

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'library', label: 'My Library', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'reviews', label: 'Reviews', icon: MessageSquare },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  const inputCls = 'block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-5 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-2xl object-cover border-2 border-gray-100 shadow-md" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-dark">Welcome back, {user?.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
              {user?.bio && <p className="text-sm text-gray-500 mt-1 max-w-md">"{user.bio}"</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
              <Button variant="outline" size="sm" onClick={() => setActiveTab('profile')} className="gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" /> Edit Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs text-gray-400 hover:text-red-500">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <StatCard icon={ShoppingBag} label="Total Orders" value={String(stats.totalOrders)} color="bg-primary/10 text-primary" />
            <StatCard icon={CreditCard} label="Total Spent" value={<Price amount={stats.totalSpent} />} color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={Package} label="Products Owned" value={String(stats.totalProducts)} color="bg-blue-50 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-5 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm w-full sm:w-fit mb-6 sm:mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-initial justify-center sm:justify-start ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-500 hover:text-dark hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Library Tab */}
          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : completedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-dark">No products yet</p>
                  <p className="text-sm text-gray-400 mt-1 mb-6">Your purchased products will appear here</p>
                  <Button asChild className="bg-primary hover:bg-[#E62828] text-white gap-2">
                    <Link href="/products"><ShoppingBag className="h-4 w-4" /> Browse Products</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {completedProducts.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group">
                      <div className="aspect-[16/9] overflow-hidden relative bg-gray-100">
                        <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur-sm">
                            {item.product.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <Link href={`/products/${item.product.id}`} className="font-semibold text-dark hover:text-primary transition-colors text-sm line-clamp-1">
                          {item.product.title}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1">Purchased for <Price amount={item.price} /></p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            disabled={libDownloading === (item.id || item.product.id)}
                            onClick={() => {
                              const key = item.id || item.product.id;
                              setLibDownloading(key);
                              setLibDlError('');
                              const payload = (item as any)._granted
                                ? { productId: item.product.id }
                                : { orderItemId: item.id };
                              apiClient.post('/download/generate', payload)
                                .then(({ data }) => {
                                  const a = document.createElement('a');
                                  a.href = data.downloadUrl;
                                  a.download = '';
                                  a.style.display = 'none';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                })
                                .catch((err: any) => setLibDlError(err.response?.data?.error || 'Download failed'))
                                .finally(() => setLibDownloading(null));
                            }}
                            className="flex-1 h-9 text-xs gap-1.5 bg-primary hover:bg-[#E62828] text-white font-semibold"
                          >
                            <Download className="h-3.5 w-3.5" /> {libDownloading === (item.id || item.product.id) ? '...' : 'Download'}
                          </Button>
                          <Button size="sm" variant="outline" asChild className="h-9 text-xs gap-1.5">
                            <Link href={`/products/${item.product.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-dark">No orders yet</p>
                  <p className="text-sm text-gray-400 mt-1 mb-6">Start shopping to see your orders here</p>
                  <Button asChild className="bg-primary hover:bg-[#E62828] text-white gap-2">
                    <Link href="/products"><ShoppingBag className="h-4 w-4" /> Browse Products</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              )}
            </motion.div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : myReviews.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-dark">No reviews yet</p>
                  <p className="text-sm text-gray-400 mt-1">Purchase a product and share your experience</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.map(r => {
                    const statusStyle = r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200'
                      : r.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';
                    const statusLabel = r.status === 'approved' ? 'Published' : r.status === 'rejected' ? 'Needs changes' : 'Under Review';
                    const canEdit = r.status === 'pending' || r.status === 'rejected';
                    const isEditing = editingReview === r.id;

                    return (
                      <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors">
                        <div className="flex items-start gap-4">
                          <img src={r.product.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link href={`/products/${r.product.id}`} className="text-sm font-semibold text-dark hover:text-primary transition-colors">
                                  {r.product.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= (isEditing ? editRating : r.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} ${isEditing ? 'cursor-pointer' : ''}`} onClick={() => isEditing && setEditRating(i)} />)}
                                  </div>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusStyle}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="mt-3">
                                <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={2}
                                  className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" disabled={editSaving || !editRating || !editComment.trim()}
                                    onClick={async () => {
                                      setEditSaving(true);
                                      try {
                                        const { data } = await apiClient.put(`/products/${r.productId}/reviews`, { rating: editRating, comment: editComment });
                                        setMyReviews(prev => prev.map(rv => rv.id === r.id ? { ...rv, ...data.review } : rv));
                                        setEditingReview(null);
                                      } catch {} finally { setEditSaving(false); }
                                    }}
                                    className="h-8 text-xs gap-1 bg-primary hover:bg-[#E62828] text-white font-semibold">
                                    <Send className="h-3 w-3" /> {editSaving ? '...' : 'Resubmit'}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingReview(null)} className="h-8 text-xs">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-start justify-between gap-2">
                                <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                                {canEdit && (
                                  <button onClick={() => { setEditingReview(r.id); setEditRating(r.rating); setEditComment(r.comment); }}
                                    className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0 mt-0.5">
                                    <Edit3 className="h-3 w-3" /> Edit
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
                  <div className="text-center">
                    <div className="relative inline-block">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-2xl object-cover border-2 border-gray-100 shadow-md mx-auto" />
                      ) : (
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-3xl font-bold shadow-md mx-auto">
                          {initials}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-dark mt-4">{user?.name}</h3>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                    {user?.bio && <p className="text-sm text-gray-500 mt-2 italic">"{user.bio}"</p>}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Member since</span>
                      <span className="font-medium text-dark">{memberSince}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5" /> Orders</span>
                      <span className="font-medium text-dark">{stats.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Total spent</span>
                      <span className="font-medium text-dark"><Price amount={stats.totalSpent} /></span>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="font-semibold text-dark flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" /> Edit Profile
                      </h3>
                    </div>

                    <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                      {/* Avatar Upload */}
                      <ImageUpload
                        value={avatarUrl}
                        onChange={url => setAvatarUrl(url)}
                        label="Profile Photo"
                        folder="crackncode/avatars"
                        previewClass="h-24 w-24 rounded-2xl"
                      />

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input type="email" value={user?.email || ''} disabled className={`${inputCls} !bg-gray-50 !text-gray-400 cursor-not-allowed`} />
                        <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                        <textarea
                          rows={3}
                          placeholder="Tell us a little about yourself..."
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      {/* Feedback */}
                      {saveError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <X className="h-4 w-4 flex-shrink-0" /> {saveError}
                        </div>
                      )}
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" /> Profile updated successfully!
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-[#E62828] text-white px-8 gap-2 h-11 font-semibold shadow-lg shadow-primary/20">
                          {isSaving ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            <><Save className="h-4 w-4" /> Save Changes</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Change Password — hidden for staff */}
                  {user?.role !== 'SUB_ADMIN' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="font-semibold text-dark flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" /> Change Password
                      </h3>
                    </div>
                    <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                        <div className="relative">
                          <input type={showPw ? 'text' : 'password'} required value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                            placeholder="Enter current password" className={`${inputCls} pr-11`} />
                          <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                        <input type={showPw ? 'text' : 'password'} required value={newPw} onChange={e => setNewPw(e.target.value)}
                          placeholder="At least 6 characters" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                        <input type={showPw ? 'text' : 'password'} required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                          placeholder="Re-enter new password" className={inputCls} />
                      </div>
                      {pwError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <X className="h-4 w-4 flex-shrink-0" /> {pwError}
                        </div>
                      )}
                      {pwSuccess && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" /> {pwSuccess}
                        </div>
                      )}
                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={pwSaving} className="bg-primary hover:bg-[#E62828] text-white px-8 gap-2 h-11 font-semibold shadow-lg shadow-primary/20">
                          {pwSaving ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Changing...
                            </span>
                          ) : (
                            <><Lock className="h-4 w-4" /> Change Password</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
