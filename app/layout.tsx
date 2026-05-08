import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Script from "next/script";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

async function getSettings() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    return {
      siteName: settings?.siteName || 'CrackncodePremium',
      tagline: settings?.tagline || 'Digital Solutions at Your Fingertips',
      seoDescription: settings?.seoDescription || '',
    };
  } catch {
    return { siteName: 'CrackncodePremium', tagline: 'Digital Solutions at Your Fingertips', seoDescription: '' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, tagline, seoDescription } = await getSettings();
  const description = seoDescription || `${tagline} — Premium tools, templates, and growth systems for modern businesses.`;

  return {
    title: { default: `${siteName} — ${tagline}`, template: `%s | ${siteName}` },
    description,
    metadataBase: new URL(SITE_URL),
    icons: { icon: '/favicon.ico' },
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description: tagline,
      url: SITE_URL,
      locale: 'en_US',
      images: [{ url: '/api/og', width: 1200, height: 630, alt: `${siteName} — ${tagline}`, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: tagline,
      images: ['/api/og'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteName, tagline } = await getSettings();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: siteName,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/api/og` },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: siteName,
        description: tagline,
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?search={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans tracking-tight bg-light text-dark">
        <SettingsProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SettingsProvider>
        <SpeedInsights />
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-5PVB86TC');
        `}</Script>
      </body>
    </html>
  );
}
