import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing. Choose the plan that fits your needs — free, pro, or enterprise. No hidden fees.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: 'Pricing | Crackncode',
    description: 'Simple, transparent pricing for premium digital products.',
    url: `${SITE_URL}/pricing`,
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
