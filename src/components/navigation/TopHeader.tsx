"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, Timer, HelpCircle, Crown } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isTelegramWebApp, initTelegramWebApp } from "@/lib/tma/telegram";
import { HelpModal } from "@/components/help/HelpModal";
import { useTranslation } from "@/lib/i18n";
import { formatWorkoutTitle } from "@/lib/i18n/exercises";
import { isCoachAccount } from "@/lib/auth/roles";

export function TopHeader() {
  const { t, language } = useTranslation();
  const { activeWorkoutId, workoutElapsedSeconds, workouts } = useWorkoutStore();
  const { userRole, linkedTelegramUser, traineeName } = useSettingsStore();
  const [inTelegram, setInTelegram] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    initTelegramWebApp();
    setInTelegram(isTelegramWebApp());

    if (typeof window !== "undefined") {
      const tgUser = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user;
      const effectiveUser = linkedTelegramUser || tgUser;
      if (effectiveUser && userRole !== "coach" && !isCoachAccount(effectiveUser.username, effectiveUser.id)) {
        const leadKey = `smt_lead_registered_${effectiveUser.id || effectiveUser.username}`;
        const athleteDisplayName = traineeName || effectiveUser.first_name || (effectiveUser as any).firstName || "Атлет";

        // 1. Initial lead registration
        if (!localStorage.getItem(leadKey)) {
          localStorage.setItem(leadKey, "1");
          import("@/lib/tma/sync").then(({ syncTrainee }) => {
            syncTrainee({
              name: athleteDisplayName,
              username: effectiveUser.username || "",
              telegramUserId: effectiveUser.id,
            }).catch(() => {});
          });
        }
      }
    }
  }, [linkedTelegramUser, userRole, traineeName]);

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);

  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-colors select-none tma-header-root">
        {/* 1. TMA Mode: Sits directly in the space between Telegram buttons */}
        <div className="tma-header-tg w-full h-[44px] items-center justify-center pl-[84px] pr-[80px]">
          <div className="flex items-center justify-center gap-2 max-w-full">
            {/* Active Workout Timer (Dynamic Island style - 100% solid opaque background) */}
            {activeWorkout && (
              <Link
                href="/workout"
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-slate-950 border border-emerald-500/50 text-emerald-400 text-[11px] font-bold shadow-[0_2px_12px_rgba(0,0,0,0.8)] hover:bg-slate-900 transition-all animate-pulse shrink-0"
                title="Активне тренування"
              >
                <Timer className="h-3 w-3 text-emerald-400" />
                <span>{formatTime(workoutElapsedSeconds)}</span>
              </Link>
            )}

            {/* Coach Verification Role Badge (100% Solid opaque Dynamic Island) */}
            {userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id) ? (
              <Link
                href="/coach"
                className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-950 border border-amber-400/50 hover:border-amber-400/80 shadow-[0_2px_12px_rgba(0,0,0,0.8)] transition-all active:scale-95 shrink-0"
                title="Кабінет Головного Тренера"
              >
                <Crown className="h-3.5 w-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.7)] group-hover:rotate-6 transition-transform" />
                <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase">
                  ТРЕНЕР
                </span>
              </Link>
            ) : linkedTelegramUser ? (
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-slate-950 border border-emerald-500/40 text-emerald-400 text-[11px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.7)] shrink-0">
                <span className="truncate max-w-[90px]">
                  @{linkedTelegramUser.username || linkedTelegramUser.firstName || "атлет"}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-xs font-extrabold tracking-wider text-slate-300 shrink-0 bg-slate-950 px-2.5 py-0.5 rounded-full border border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                <span className="text-emerald-400">⚡</span> SMT-1
              </div>
            )}
          </div>
        </div>

        {/* 2. Standard Web Browser Mode: Classic website header */}
        <div className="tma-header-web mx-auto h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
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

            {userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id) ? (
              <Link
                href="/coach"
                className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 hover:scale-105 transition-all shadow-sm shadow-amber-500/20"
                title="Кабінет Головного Тренера"
              >
                <Crown className="h-3 w-3 text-amber-400" />
                <span>ТРЕНЕР</span>
              </Link>
            ) : linkedTelegramUser ? (
              <Link
                href="/settings"
                className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
                title="Ваш профіль у Telegram"
              >
                <span>@{linkedTelegramUser.username || linkedTelegramUser.firstName}</span>
              </Link>
            ) : null}

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
