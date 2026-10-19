"use client";

import React, { useEffect } from "react";
import { Timer, Plus, Minus, X, Volume2, VolumeX } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";

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

  // Интервал обратного отсчета
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
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom-5">
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
                <span>Отдых СМТ</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {restTimerSeconds > 0 ? "Восстановление сил" : "Время следующего подхода!"}
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
              title="-10 секунд"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => adjustRestTimer(+10)}
              title="+10 секунд"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-white"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Звук включен" : "Звук выключен"}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-500" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs"
              onClick={stopRestTimer}
              title="Пропустить отдых"
            >
              <X className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Пропуск</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
