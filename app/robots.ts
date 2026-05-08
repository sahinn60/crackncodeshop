import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og'],
        disallow: ['/admin/', '/api/', '/dashboard/', '/checkout/', '/login', '/register', '/staff-login', '/forgot-password', '/reset-password'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/api/og'],
        disallow: ['/admin/', '/dashboard/', '/checkout/', '/login', '/register', '/staff-login'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
