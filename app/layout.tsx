import type { Metadata } from "next";
import { Inter, Open_Sans, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SplashScreen } from "@/components/providers/SplashScreen";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const openSans = Open_Sans({
  variable: "--font-opensans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncode.shop';

export const metadata: Metadata = {
  title: {
    default: 'CrackNcode — Premium Digital Products & Solutions',
    template: '%s | CrackNcode',
  },
  description: 'Premium digital products at your fingertips — templates, courses, tools, and more. Instant delivery, secure checkout, lifetime access.',
  metadataBase: new URL(SITE_URL),
  icons: { icon: [] },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: 'CrackNcode',
    title: 'CrackNcode — Premium Digital Products & Solutions',
    description: 'Premium digital products at your fingertips — templates, courses, tools, and more.',
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'CrackNcode' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrackNcode — Premium Digital Products & Solutions',
    description: 'Premium digital products at your fingertips.',
    images: ['/preview.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  },
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${openSans.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans tracking-tight bg-light text-dark">
        <SettingsProvider>
          <AuthProvider>
            <SplashScreen>
              {children}
            </SplashScreen>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
