"use client";

import React, { useEffect } from "react";
import { Timer, Plus, Minus, X, Volume2, VolumeX } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
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

  const { soundEnabled, setSoundEnabled } = useSettingsStore();
  const { t } = useTranslation();

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

  return (
    <div className="fixed bottom-[calc(4.5rem+max(env(safe-area-inset-bottom,0px),var(--tg-safe-area-inset-bottom,0px)))] left-4 right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom-5">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl">
        {/* Progress Background bar */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/15 transition-all duration-1000 ease-linear pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative flex items-center justify-between gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xl border border-emerald-500/40">
              {restTimerSeconds}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Timer className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                <span>{t.workout.restTitle}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {restTimerSeconds > 0 ? t.workout.restSubtitle : t.workout.restNextSetReady}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => adjustRestTimer(-10)}
              title="-10 сек"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => adjustRestTimer(+10)}
              title="+10 сек"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-white"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? t.settings.soundEffects : t.common.cancel}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-500" />
              )}
            </Button>

            <Button
              variant="accent"
              size="sm"
              className="h-8 px-2.5 text-xs font-bold shadow-md shadow-emerald-500/20"
              onClick={stopRestTimer}
            >
              <span>{t.workout.skipRest}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
