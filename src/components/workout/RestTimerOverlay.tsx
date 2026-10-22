"use client";

import React, { useEffect } from "react";
import { Timer, SkipForward } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function RestTimerOverlay() {
  const {
    isRestTimerActive,
    restTimerSeconds,
    restTimerMaxSeconds,
    tickRestTimer,
    adjustRestTimer,
    stopRestTimer,
  } = useWorkoutStore();

  const { t, language } = useTranslation();

  // Countdown timer tick
  useEffect(() => {
    if (!isRestTimerActive) return;

    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestTimerActive, tickRestTimer]);

  if (!isRestTimerActive) return null;

  const progressPercent =
    restTimerMaxSeconds > 0
      ? Math.max(0, Math.min(100, (restTimerSeconds / restTimerMaxSeconds) * 100))
      : 0;

  const minusLabel = language === "en" ? "-10s" : "-10с";
  const plusLabel = language === "en" ? "+10s" : "+10с";
  const skipLabel =
    language === "en"
      ? "Skip"
      : language === "ru"
      ? "Пропустить"
      : "Пропустити";

  return (
    <div className="fixed bottom-[calc(4.5rem+max(env(safe-area-inset-bottom,0px),var(--tg-safe-area-inset-bottom,0px)))] left-2 right-2 sm:left-4 sm:right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom-5">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/98 p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-xl">
        {/* Progress Background bar */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/15 transition-all duration-1000 ease-linear pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative flex items-center justify-between gap-2">
          {/* Timer Display */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg sm:text-xl border border-emerald-500/40">
              {restTimerSeconds}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 truncate">
                <Timer className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
                <span className="truncate">{t.workout.restTitle}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden xs:block">
                {restTimerSeconds > 0 ? t.workout.restSubtitle : t.workout.restNextSetReady}
              </p>
            </div>
          </div>

          {/* Quick Controls: -10s, +10s, and Skip */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 rounded-lg font-mono text-[11px] font-bold border-white/10 bg-slate-950/60 text-slate-200 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              onClick={() => adjustRestTimer(-10)}
              title={minusLabel}
            >
              <span>{minusLabel}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 rounded-lg font-mono text-[11px] font-bold border-white/10 bg-slate-950/60 text-slate-200 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              onClick={() => adjustRestTimer(+10)}
              title={plusLabel}
            >
              <span>{plusLabel}</span>
            </Button>

            <Button
              variant="accent"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shrink-0 shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
              onClick={stopRestTimer}
            >
              <SkipForward className="h-3.5 w-3.5 mr-1 fill-current text-slate-950 shrink-0" />
              <span>{skipLabel}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
