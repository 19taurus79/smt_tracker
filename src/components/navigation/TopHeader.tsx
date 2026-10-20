"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, Activity, Timer, HelpCircle } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isTelegramWebApp, initTelegramWebApp } from "@/lib/tma/telegram";
import { HelpModal } from "@/components/help/HelpModal";
import { useTranslation } from "@/lib/i18n";
import { formatWorkoutTitle } from "@/lib/i18n/exercises";

export function TopHeader() {
  const { t, language } = useTranslation();
  const { activeWorkoutId, workoutElapsedSeconds, workouts, isStopwatchRunning } =
    useWorkoutStore();
  const [inTelegram, setInTelegram] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    initTelegramWebApp();
    setInTelegram(isTelegramWebApp());
  }, []);

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/90 backdrop-blur-xl ios-safe-top">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                {t.header.title} <span className="text-emerald-400 font-medium text-xs">{t.header.tracker}</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {activeWorkout && (
              <Link
                href="/workout"
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors animate-pulse"
              >
                <Timer className="h-3.5 w-3.5" />
                <span>{formatTime(workoutElapsedSeconds)}</span>
                <span className="hidden sm:inline">
                  ({formatWorkoutTitle(activeWorkout.workoutNumber, activeWorkout.microcycle, activeWorkout.week, language)})
                </span>
              </Link>
            )}

            {inTelegram && (
              <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] py-0 px-2">
                TMA Ready
              </Badge>
            )}

            <button
              onClick={() => setIsHelpOpen(true)}
              title={t.header.helpTooltip}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-emerald-500/40 transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
