import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopHeader } from "@/components/navigation/TopHeader";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TelegramBackButton } from "@/components/navigation/TelegramBackButton";
import { RestTimerOverlay } from "@/components/workout/RestTimerOverlay";
import { TelegramProvider } from "@/components/tma/TelegramProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "СМТ-1 Трекер | Сверхмощный тренинг",
  description:
    "Персональный Telegram Mini App трекер для программы СМТ-1 (Сверхмощный тренинг), отслеживания тоннажа, мощности и рекомпозиции тела.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020618",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark antialiased bg-[#020618]" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="СМТ-1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#020618" />
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (window.TelegramWebviewProxy || window.Telegram || window.location.hash.includes('tgWebAppData')) {
                  document.documentElement.classList.add('is-telegram');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <TelegramProvider>
          <TelegramBackButton />
          <TopHeader />
          <main className="flex-1 pb-20 sm:pb-24 max-w-5xl w-full mx-auto px-2 sm:px-6 pt-2 sm:pt-4">
            {children}
          </main>
          <RestTimerOverlay />
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
