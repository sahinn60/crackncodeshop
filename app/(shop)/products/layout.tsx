import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products — CrackNcode | Premium Digital Products',
  description: 'Browse our collection of premium digital products — templates, courses, tools, and more. Instant delivery, lifetime access.',
  alternates: { canonical: 'https://crackncode.shop/products' },
  openGraph: {
    title: 'Products — CrackNcode',
    description: 'Browse premium digital products with instant delivery.',
    url: 'https://crackncode.shop/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
