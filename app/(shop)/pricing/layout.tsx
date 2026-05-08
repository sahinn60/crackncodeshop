import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for premium digital solutions. Choose the plan that fits your needs.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: 'Pricing | CrackncodePremium',
    description: 'Digital Solutions at Your Fingertips — Simple, transparent pricing.',
    url: `${SITE_URL}/pricing`,
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | CrackncodePremium',
    description: 'Digital Solutions at Your Fingertips — Simple, transparent pricing.',
    images: ['/api/og'],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
