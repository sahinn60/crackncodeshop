import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse premium digital products — tools, templates, and growth solutions. Instant delivery, lifetime access.',
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    title: 'Products | Crackncode',
    description: 'Browse premium digital products — tools, templates, and growth solutions.',
    url: `${SITE_URL}/products`,
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Products | Crackncode',
    description: 'Browse premium digital products — tools, templates, and growth solutions.',
    images: ['/api/og'],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
