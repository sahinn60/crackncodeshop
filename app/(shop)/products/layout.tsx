import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse premium digital products — tools, templates, and growth solutions. Instant delivery, lifetime access.',
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    title: 'Products | CrackncodePremium',
    description: 'Digital Solutions at Your Fingertips — Browse our premium collection.',
    url: `${SITE_URL}/products`,
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Products | CrackncodePremium',
    description: 'Digital Solutions at Your Fingertips — Browse our premium collection.',
    images: ['/api/og'],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
