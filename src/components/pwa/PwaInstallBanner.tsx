"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isTelegramWebApp } from "@/lib/tma/telegram";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [inTelegram, setInTelegram] = useState(true);

  useEffect(() => {
    // Never show in Telegram Mini App
    if (isTelegramWebApp()) {
      setInTelegram(true);
      return;
    }
    setInTelegram(false);

    try {
      if (localStorage.getItem("smt_pwa_dismissed") === "true") {
        setDismissed(true);
      }
    } catch {}

    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => reg.update().catch(() => {}))
        .catch(() => {});
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // In Telegram or already installed or dismissed: do NOT render anything
  if (inTelegram || isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("smt_pwa_dismissed", "true");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div className="fixed bottom-[calc(4.5rem+max(env(safe-area-inset-bottom,0px),var(--tg-safe-area-inset-bottom,0px)))] left-4 right-4 z-40 max-w-md mx-auto rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Smartphone className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Запустити в Telegram
              </h4>
              <p className="text-[11px] text-slate-300">
                Використовуйте трекер у Telegram для нативної вібрації та повноекранного режиму
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          {deferredPrompt ? (
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span>Встановити додаток</span>
            </Button>
          ) : isIOS ? (
            <Button
              size="sm"
              onClick={() => setShowIOSGuide(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-8"
            >
              <Share className="h-3.5 w-3.5 mr-1.5" />
              <span>Інструкція для Safari iOS</span>
            </Button>
          ) : null}
        </div>
      </div>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-950 p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                <span>Запуск у Telegram</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Найкращий досвід роботи з трекером — відкрити його прямо в боті <strong>@athletic_smt_bot</strong> у Telegram:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Працює тактильна вібрація Taptic Engine</li>
                <li>Повноекранний режим без рамок Safari</li>
                <li>Захист від випадкового закриття свайпом</li>
                <li>Миттєва синхронізація тренувань</li>
              </ul>
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              onClick={() => {
                setShowIOSGuide(false);
                window.location.href = "https://t.me/athletic_smt_bot";
              }}
            >
              Відкрити бота в Telegram
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
