import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

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

export const metadata: Metadata = {
  title: "Digital Product Platform",
  description: "Modern SaaS platform for digital products",
  icons: { icon: [] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans font-light tracking-tight bg-light text-dark">
        <SettingsProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
