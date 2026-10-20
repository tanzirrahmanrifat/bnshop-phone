import type React from "react";
import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategories, getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL()),
    title: { default: `${s.shop_name} — ${s.tagline}`, template: `%s | ${s.shop_name}` },
    description: s.hero_text,
    openGraph: { siteName: s.shop_name, type: "website", locale: "en_BN" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#0b1b33", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <body className="min-h-screen pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
          Skip to content
        </a>
        <Header settings={settings} categories={categories} />
        <div id="main">{children}</div>
        <Footer settings={settings} categories={categories} />
      </body>
    </html>
  );
}
