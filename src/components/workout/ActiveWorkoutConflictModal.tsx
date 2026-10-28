"use client";

import React from "react";
import { AlertTriangle, Play, CheckCircle, RotateCcw } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkoutSession } from "@/types/smt";
import { formatTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatWorkoutTitle } from "@/lib/i18n/exercises";
import { triggerHaptic } from "@/lib/tma/telegram";

interface ActiveWorkoutConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWorkout: WorkoutSession;
  targetWorkout: WorkoutSession;
  onGoToActive: () => void;
  onFinishActive: () => void;
  onResetActiveAndSwitch: () => void;
}

export function ActiveWorkoutConflictModal({
  open,
  onOpenChange,
  activeWorkout,
  targetWorkout,
  onGoToActive,
  onFinishActive,
  onResetActiveAndSwitch,
}: ActiveWorkoutConflictModalProps) {
  const { language } = useTranslation();

  const activeTitle = formatWorkoutTitle(
    activeWorkout.workoutNumber,
    activeWorkout.microcycle,
    activeWorkout.week,
    language
  );

  const targetTitle = formatWorkoutTitle(
    targetWorkout.workoutNumber,
    targetWorkout.microcycle,
    targetWorkout.week,
    language
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-sm p-4">
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-white leading-tight">
            {language === "uk"
              ? "Увага: йде інше тренування!"
              : language === "en"
              ? "Active Workout Conflict"
              : "Внимание: идет другая тренировка!"}
          </h3>
          <p className="text-[11px] text-amber-300 font-medium">
            {language === "uk"
              ? `Запущено ${activeTitle}`
              : `Запущена ${activeTitle}`}
          </p>
        </div>
      </div>

      <div className="py-3 space-y-2 text-xs text-slate-300">
        <p>
          {language === "uk"
            ? `У вас вже активна сесія #${activeWorkout.workoutNumber}. Зараз ви відкрили ${targetTitle}.`
            : language === "en"
            ? `You currently have Session #${activeWorkout.workoutNumber} in progress. You have navigated to ${targetTitle}.`
            : `У вас уже активна сессия #${activeWorkout.workoutNumber}. Сейчас вы открыли ${targetTitle}.`}
        </p>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1 text-[11px]">
          <div className="text-slate-400">
            {language === "uk" ? "Поточний стан активної сесії:" : "Текущее состояние активной сессии:"}
          </div>
          <div className="flex items-center justify-between text-white font-mono font-bold">
            <span>#{activeWorkout.workoutNumber} {activeTitle}</span>
            <span className="text-emerald-400">
              {formatTime(activeWorkout.durationSeconds || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {/* Action 1: Return to active workout */}
        <Button
          variant="accent"
          size="sm"
          className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5"
          onClick={() => {
            triggerHaptic("selection");
            onGoToActive();
          }}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>
            {language === "uk"
              ? `Повернутися до Тренування #${activeWorkout.workoutNumber}`
              : language === "en"
              ? `Return to Workout #${activeWorkout.workoutNumber}`
              : `Вернуться к Тренировке #${activeWorkout.workoutNumber}`}
          </span>
        </Button>

        {/* Action 2: Finish active workout */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-10 border-white/15 text-white hover:bg-white/10 font-bold text-xs flex items-center justify-center gap-1.5"
          onClick={() => {
            triggerHaptic("selection");
            onFinishActive();
          }}
        >
          <CheckCircle className="h-3.5 w-3.5 text-cyan-400" />
          <span>
            {language === "uk"
              ? `Завершити Тренування #${activeWorkout.workoutNumber}`
              : language === "en"
              ? `Finish Workout #${activeWorkout.workoutNumber}`
              : `Завершить Тренировку #${activeWorkout.workoutNumber}`}
          </span>
        </Button>

        {/* Action 3: Reset active workout & switch */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-9 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 font-semibold text-xs flex items-center justify-center gap-1.5"
          onClick={() => {
            triggerHaptic("warning");
            onResetActiveAndSwitch();
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>
            {language === "uk"
              ? `Скинути #${activeWorkout.workoutNumber} та почати #${targetWorkout.workoutNumber}`
              : language === "en"
              ? `Reset #${activeWorkout.workoutNumber} & start #${targetWorkout.workoutNumber}`
              : `Сбросить #${activeWorkout.workoutNumber} и начать #${targetWorkout.workoutNumber}`}
          </span>
        </Button>
      </div>
    </Dialog>
  );
}
