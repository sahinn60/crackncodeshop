import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncodepremium.com';

export const metadata: Metadata = {
  title: {
    default: 'CrackncodePremium — Premium Digital Products & Solutions',
    template: '%s | CrackncodePremium',
  },
  description: 'Premium digital products at your fingertips — templates, courses, tools, and more. Instant delivery, secure checkout, lifetime access.',
  metadataBase: new URL(SITE_URL),
  icons: { icon: [] },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: 'CrackncodePremium',
    title: 'CrackncodePremium — Premium Digital Products & Solutions',
    description: 'Premium digital products at your fingertips — templates, courses, tools, and more.',
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'CrackncodePremium' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrackncodePremium — Premium Digital Products & Solutions',
    description: 'Premium digital products at your fingertips.',
    images: ['/preview.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
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
