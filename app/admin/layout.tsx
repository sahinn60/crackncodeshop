'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Settings, LogOut, Store, Menu, X, BarChart2,
  Tag, Bell, ChevronRight, FolderTree, Shield,
  Layers, Link2, Flame, FileText, Eye, Image, MessageSquare,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard',   href: '/admin',             icon: LayoutDashboard, permission: null },
  { name: 'Visitors',    href: '/admin/visitors',     icon: Eye,             permission: 'analytics' },
  { name: 'Products',    href: '/admin/products',     icon: Package,         permission: 'products' },
  { name: 'Categories',  href: '/admin/categories',   icon: FolderTree,      permission: 'categories' },
  { name: 'Bundles',     href: '/admin/bundles',       icon: Layers,          permission: 'bundles' },
  { name: 'Flash Sales', href: '/admin/flash-sales',   icon: Flame,           permission: 'flash-sales' },
  { name: 'Upsells',     href: '/admin/upsells',       icon: Link2,           permission: 'upsells' },
  { name: 'Landing Pages', href: '/admin/landing-pages', icon: FileText,        permission: 'landing-pages' },
  { name: 'Logo Showcase', href: '/admin/logo-showcase',  icon: Image,           permission: 'logo-showcase' },
  { name: 'Orders',      href: '/admin/orders',       icon: ShoppingCart,    permission: 'orders' },
  { name: 'Reviews',     href: '/admin/reviews',      icon: MessageSquare,   permission: 'reviews' },
  { name: 'Users',       href: '/admin/users',        icon: Users,           permission: 'users' },
  { name: 'Analytics',   href: '/admin/analytics',    icon: BarChart2,       permission: 'analytics' },
  { name: 'Coupons',     href: '/admin/coupons',      icon: Tag,             permission: 'coupons' },
  { name: 'Team',        href: '/admin/team',         icon: Shield,          permission: null, adminOnly: true },
  { name: 'Settings',    href: '/admin/settings',     icon: Settings,        permission: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const redirected = useRef(false);

  // Simple hydration check — no flaky listeners
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const interval = setInterval(() => {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Sync cookie on hydration so middleware stays in sync with zustand
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      document.cookie = `auth-token=${localStorage.getItem('auth-token')}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
    }
  }, [hydrated, isAuthenticated]);

  // Auth guard — only runs once after hydration, uses ref for router
  useEffect(() => {
    if (!hydrated || redirected.current) return;
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUB_ADMIN')) {
      redirected.current = true;
      document.cookie = 'auth-token=; path=/; max-age=0';
      routerRef.current.push('/login');
    }
  }, [hydrated, isAuthenticated, user?.role]);

  const handleLogout = useCallback(() => {
    logout();
    routerRef.current.push('/login');
  }, [logout]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!hydrated || !isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUB_ADMIN')) return null;

  const isMainAdmin = user?.role === 'ADMIN';
  const userPerms: string[] = user?.permissions || [];

  const filteredNav = navigation.filter(item => {
    if (isMainAdmin) return true;
    if ((item as any).adminOnly) return false;
    if (!item.permission) return true;
    return userPerms.includes(item.permission);
  });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  const currentPage = filteredNav.find(n => n.href === pathname || (n.href !== '/admin' && pathname.startsWith(n.href)));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={closeSidebar}>
          <div className={`h-8 w-8 rounded-lg ${isMainAdmin ? 'bg-indigo-500' : 'bg-violet-500'} flex items-center justify-center`}>
            <Store className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-medium text-white tracking-tight">{isMainAdmin ? 'Admin' : 'Staff'} Panel</span>
            {!isMainAdmin && <p className="text-[10px] text-gray-500 -mt-0.5">Sub-Admin</p>}
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Main Menu</p>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                {item.name}
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-300" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800 space-y-2 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all"
        >
          <Store className="h-4 w-4 text-gray-500" /> View Store
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800">
          <div className={`h-8 w-8 rounded-full ${isMainAdmin ? 'bg-indigo-500' : 'bg-violet-500'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden tracking-tight">
      <aside className="w-64 bg-gray-900 hidden md:flex flex-col flex-shrink-0 tracking-tight">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeSidebar} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-gray-900 flex flex-col z-10 tracking-tight">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-medium text-gray-900 tracking-tight">{currentPage?.name || 'Admin'}</h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMainAdmin && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-700">Sub-Admin</span>
            )}
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
            </button>
            <div className={`h-8 w-8 rounded-full ${isMainAdmin ? 'bg-indigo-500' : 'bg-violet-500'} flex items-center justify-center text-white text-xs font-bold`}>
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
