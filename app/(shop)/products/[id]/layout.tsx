import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncode.shop';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${SITE_URL}/api/products/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return { title: 'Product Not Found' };
    const product = await res.json();

    const title = `${product.title} — CrackNcode`;
    const description = product.description?.slice(0, 160) || 'Premium digital product from CrackNcode';
    const url = `${SITE_URL}/products/${product.slug || id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName: 'CrackNcode',
        type: 'website',
        images: product.imageUrl ? [{ url: product.imageUrl, width: 800, height: 600, alt: product.title }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
    };
  } catch {
    return { title: 'Product — CrackNcode' };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
