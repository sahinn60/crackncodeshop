'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, ShoppingCart, User, Grid3X3, X, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/axios';
import { Price } from '@/components/ui/Price';
import { AnimatePresence, motion } from 'framer-motion';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { items, openCart } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }, [items]);

  // Close panels on route change
  useEffect(() => {
    setSearchOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/products', { params: { search: searchQuery, limit: 5 } });
        setSearchResults(data.products || []);
      } catch { setSearchResults([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleResultClick = (id: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/products/${id}`);
  };

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const navItems = [
    { icon: Home, label: 'Home', href: '/', active: isActive('/') },
    { icon: Grid3X3, label: 'Products', href: '/products', active: pathname.startsWith('/products') },
    { icon: Search, label: 'Search', action: () => { setAccountOpen(false); setSearchOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 150); } },
    { icon: ShoppingCart, label: 'Cart', action: () => { setSearchOpen(false); setAccountOpen(false); openCart(); }, badge: cartCount },
    { icon: User, label: 'Account', action: () => { setSearchOpen(false); setAccountOpen(o => !o); } },
  ];

  return (
    <>
      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-[60px] z-[90] bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col md:hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <form onSubmit={e => { e.preventDefault(); handleSearchSubmit(); }} className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                  />
                </form>
                <button onClick={() => setSearchOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => handleResultClick(p.id)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </div>
                      <span className="text-sm font-bold text-dark flex-shrink-0"><Price amount={p.price} /></span>
                    </button>
                  ))}
                  <button onClick={handleSearchSubmit} className="w-full px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                    View all results →
                  </button>
                </div>
              ) : searchQuery.trim() ? (
                <p className="text-center text-sm text-gray-400 py-8">No results found</p>
              ) : (
                <p className="text-center text-sm text-gray-400 py-8">Start typing to search...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account overlay */}
      <AnimatePresence>
        {accountOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-[60px] z-[90] bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl md:hidden"
          >
            <div className="p-4">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-3 mb-2">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    <LayoutDashboard className="h-4 w-4 text-gray-400" /> Dashboard
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <Settings className="h-4 w-4 text-gray-400" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 p-2">
                  <Link href="/login" onClick={() => setAccountOpen(false)} className="flex-1 text-center py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setAccountOpen(false)} className="flex-1 text-center py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-[#E62828] transition-colors">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {(searchOpen || accountOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSearchOpen(false); setAccountOpen(false); }}
            className="fixed inset-0 z-[85] bg-black/30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-[95] md:hidden bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around h-[60px] px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.active || (item.label === 'Search' && searchOpen) || (item.label === 'Account' && accountOpen);

            const content = (
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>
            );

            if (item.action) {
              return (
                <button key={item.label} onClick={item.action} className="flex-1 flex items-center justify-center py-1 active:scale-95 transition-transform">
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href!} className="flex-1 flex items-center justify-center py-1 active:scale-95 transition-transform">
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
