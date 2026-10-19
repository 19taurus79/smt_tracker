"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("SW registered"))
        .catch((err) => console.log("SW registration error", err));
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // If already installed or user dismissed it
  if (isStandalone || dismissed) return null;

  // If Android/Chrome/Desktop prompt is ready
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
      <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Smartphone className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Установить СМТ-1 на телефон
              </h4>
              <p className="text-[11px] text-slate-300">
                Работает без браузерных рамок, оффлайн и во весь экран
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
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
              <span>Установить приложение</span>
            </Button>
          ) : isIOS ? (
            <Button
              size="sm"
              onClick={() => setShowIOSGuide(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-8"
            >
              <Share className="h-3.5 w-3.5 mr-1.5" />
              <span>Инструкция для iPhone (iOS)</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* iOS Modal Guide */}
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
                <span>Установка на iPhone</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                  1
                </span>
                <span>
                  В браузере Safari нажмите иконку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх внизу экрана).
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                  2
                </span>
                <span>
                  Прокрутите меню вниз и выберите пункт <strong>«На экран "Домой"»</strong> (Add to Home Screen).
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                  3
                </span>
                <span>
                  Нажмите <strong>«Добавить»</strong>. Иконка СМТ-1 появится среди ваших приложений на рабочем столе!
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              onClick={() => setShowIOSGuide(false)}
            >
              Понятно
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
