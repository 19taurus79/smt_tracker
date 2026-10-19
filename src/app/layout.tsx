import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopHeader } from "@/components/navigation/TopHeader";
import { BottomNav } from "@/components/navigation/BottomNav";
import { RestTimerOverlay } from "@/components/workout/RestTimerOverlay";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import Script from "next/script";

export const metadata: Metadata = {
  title: "СМТ-1 Трекер | Сверхмощный тренинг",
  description:
    "Персональный PWA / Telegram Mini App трекер для программы СМТ-1 (Сверхмощный тренинг), отслеживания тоннажа, мощности и рекомпозиции тела.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "СМТ-1",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark h-full antialiased" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <TopHeader />
        <main className="flex-1 pb-[calc(4.25rem+max(env(safe-area-inset-bottom,0px),var(--tg-safe-area-inset-bottom,0px)))] max-w-5xl w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-4">
          {children}
        </main>
        <RestTimerOverlay />
        <PwaInstallBanner />
        <BottomNav />
      </body>
    </html>
  );
}
