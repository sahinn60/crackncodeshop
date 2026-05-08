import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Instant delivery, lifetime updates, clean code, modern design, and premium support. See why professionals choose CrackncodePremium.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'Features | CrackncodePremium',
    description: 'Digital Solutions at Your Fingertips — See why professionals choose us.',
    url: `${SITE_URL}/about`,
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features | CrackncodePremium',
    description: 'Digital Solutions at Your Fingertips — See why professionals choose us.',
    images: ['/api/og'],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
