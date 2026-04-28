import type { Metadata } from "next";
import { Inter, Open_Sans, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SplashScreen } from "@/components/providers/SplashScreen";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const openSans = Open_Sans({
  variable: "--font-opensans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackncode.shop';

export const metadata: Metadata = {
  title: 'CrackNcode — Digital solutions at your fingertips',
  description: 'Digital solutions at your fingertips — simple, fast, and powerful.',
  metadataBase: new URL(SITE_URL),
  icons: { icon: [] },
  openGraph: {
    type: 'website',
    siteName: 'CrackNcode',
    title: 'CrackNcode — Digital solutions at your fingertips',
    description: 'Digital solutions at your fingertips — simple, fast, and powerful.',
    url: SITE_URL,
    images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'CrackNcode' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrackNcode — Digital solutions at your fingertips',
    description: 'Digital solutions at your fingertips — simple, fast, and powerful.',
    images: ['/preview.png'],
  },
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
