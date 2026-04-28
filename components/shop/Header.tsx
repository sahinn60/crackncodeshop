'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ShoppingCart, LayoutDashboard, User, LogOut, Settings, ShieldCheck, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/axios';
import { Price } from '@/components/ui/Price';
import { useCouponStore } from '@/store/useCouponStore';

export function Header() {
  const { settings } = useSettingsStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { openCart, items } = useCartStore();
  const barVisible = useCouponStore(s => s.barVisible);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }, [items]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Desktop search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/products', { params: { search: searchQuery, limit: 5 } });
        setSearchResults(data.products || []);
        setSearchOpen(true);
      } catch { setSearchResults([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleResultClick = (id: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    router.push(`/products/${id}`);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push('/');
  };

  return (
    <>
      <header className={`sticky ${barVisible ? 'top-[42px] max-sm:top-[38px]' : 'top-0'} z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg transition-[top] duration-300`}>
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left — Logo + Nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings?.siteName || 'Logo'} className="h-10 sm:h-12 w-auto max-w-[200px] object-contain" />
              ) : (
                <span className="text-xl sm:text-2xl font-black tracking-tight text-primary">{settings?.siteName || 'Shop'}</span>
              )}
            </Link>
            <nav className="hidden md:flex gap-6 lg:gap-8">
              <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Products</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Pricing</Link>
            </nav>
          </div>

          {/* Center — Search (desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-6 lg:mx-10" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-2.5 text-sm text-dark placeholder:text-gray-400 outline-none shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white focus:shadow-md transition-all"
              />
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => handleResultClick(p.id)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </div>
                      <span className="text-sm font-bold text-dark flex-shrink-0"><Price amount={p.price} /></span>
                    </button>
                  ))}
                  <button onClick={handleSearchSubmit} className="w-full px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 border-t border-gray-100 transition-colors">
                    View all results for "{searchQuery}"
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Right — Cart + Auth (desktop only, mobile uses bottom nav) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={openCart} className="hidden md:flex relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          {user?.role === 'ADMIN' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-0.5">
                              <ShieldCheck className="h-2.5 w-2.5" /> Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="py-1.5">
                        <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-gray-400" /> Dashboard
                        </Link>
                        <Link href="/dashboard?tab=profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <User className="h-4 w-4 text-gray-400" /> Edit Profile
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Settings className="h-4 w-4 text-gray-400" /> Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 py-1.5">
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="rounded-full font-medium">Log in</Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button className="bg-primary hover:bg-[#E62828] rounded-full font-semibold shadow-md text-white">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <CartDrawer />
    </>
  );
}
