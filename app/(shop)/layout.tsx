import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { AnnouncementBar } from '@/components/shop/AnnouncementBar';
import { VisitorTracker } from '@/components/shop/VisitorTracker';
import { MobileBottomNav } from '@/components/shop/MobileBottomNav';
import { WhatsAppButton } from '@/components/shop/WhatsAppButton';
import { AttributionTracker } from '@/components/providers/AttributionTracker';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AttributionTracker />
      <VisitorTracker />
      <AnnouncementBar />
      <Header />
      <main className="flex-1 pb-[60px] md:pb-0">{children}</main>
      <Footer />
      <WhatsAppButton />
      <MobileBottomNav />
    </div>
  );
}
