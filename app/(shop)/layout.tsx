import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { AnnouncementBar } from '@/components/shop/AnnouncementBar';
import { VisitorTracker } from '@/components/shop/VisitorTracker';
import { MobileBottomNav } from '@/components/shop/MobileBottomNav';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <VisitorTracker />
      <AnnouncementBar />
      <Header />
      <main className="flex-1 pb-[60px] md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
