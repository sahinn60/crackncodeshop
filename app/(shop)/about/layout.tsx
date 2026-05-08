import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Instant delivery, lifetime updates, clean code, modern design, and premium support. See why developers choose Crackncode.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'Features | Crackncode',
    description: 'Instant delivery, lifetime updates, clean code, modern design, and premium support.',
    url: `${SITE_URL}/about`,
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
