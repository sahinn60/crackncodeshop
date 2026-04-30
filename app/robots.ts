const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncode.shop';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/', '/checkout/', '/login', '/register', '/staff-login'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
