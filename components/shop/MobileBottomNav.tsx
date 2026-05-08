'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, ShoppingCart, User, Grid3X3, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { items, openCart } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [cartCount, setCartCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }, [items]);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

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
    { icon: ShoppingCart, label: 'Cart', action: () => { setAccountOpen(false); openCart(); }, badge: cartCount },
    ...(isAuthenticated
      ? [{ icon: User, label: 'Account', action: () => setAccountOpen(o => !o) }]
      : [{ icon: User, label: 'Login', href: '/login', active: isActive('/login') }]
    ),
  ];

  return (
    <>
      {/* Account overlay */}
      {isAuthenticated && (
        <>
          <div
            className={`fixed inset-0 z-[85] bg-black/30 md:hidden transition-opacity duration-200 ${accountOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setAccountOpen(false)}
          />
          <div className={`fixed inset-x-0 bottom-[60px] z-[90] bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl md:hidden transition-transform duration-300 ${accountOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" />
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
            </div>
          </div>
        </>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-[95] md:hidden bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-[60px] px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.active || (item.label === 'Account' && accountOpen);

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
                <button key={item.label} onClick={item.action} className="flex-1 flex items-center justify-center py-1">
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href!} className="flex-1 flex items-center justify-center py-1">
                {content}
              </Link>
            );
          })}

          {isAuthenticated && (
            <button onClick={handleLogout} className="flex-1 flex items-center justify-center py-1">
              <div className="flex flex-col items-center gap-0.5">
                <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-primary">Logout</span>
              </div>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
