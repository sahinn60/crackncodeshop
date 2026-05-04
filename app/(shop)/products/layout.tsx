import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products — CrackncodePremium | Premium Digital Products',
  description: 'Browse our collection of premium digital products — templates, courses, tools, and more. Instant delivery, lifetime access.',
  alternates: { canonical: 'https://crackncodepremium.com/products' },
  openGraph: {
    title: 'Products — CrackncodePremium',
    description: 'Browse premium digital products with instant delivery.',
    url: 'https://crackncodepremium.com/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
