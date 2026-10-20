"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkoutSession } from "@/types/smt";
import { formatTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatWorkoutTitle } from "@/lib/i18n/exercises";

interface ConfirmResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  onConfirm?: () => void;
  onConfirmReset?: () => void;
}

export function ConfirmResetModal({
  open,
  onOpenChange,
  workout,
  onConfirm,
  onConfirmReset,
}: ConfirmResetModalProps) {
  const { t, language } = useTranslation();

  if (!workout) return null;

  const isCompleted = workout.status === "completed";
  const localizedTitle = formatWorkoutTitle(
    workout.workoutNumber,
    workout.microcycle,
    workout.week,
    language
  );

  const handleAction = () => {
    if (onConfirmReset) onConfirmReset();
    else if (onConfirm) onConfirm();
    onOpenChange(false);
  };

  const modalTitle =
    language === "uk"
      ? (isCompleted ? `Скинути тренування #${workout.workoutNumber}?` : `Скинути поточну сесію #${workout.workoutNumber}?`)
      : language === "en"
      ? (isCompleted ? `Reset Workout #${workout.workoutNumber}?` : `Reset Session #${workout.workoutNumber}?`)
      : (isCompleted ? `Сбросить тренировку #${workout.workoutNumber}?` : `Сбросить текущую сессию #${workout.workoutNumber}?`);

  const warningDesc =
    language === "uk"
      ? `Усі зафіксовані показники (тоннаж ${workout.tonnageKg || 0} кг, час ${formatTime(workout.durationSeconds || 0)}, потужність ${workout.powerKgPerMin || 0} кг/хв) та відмітки підходів будуть видалені.`
      : language === "en"
      ? `All recorded metrics (tonnage ${workout.tonnageKg || 0} kg, time ${formatTime(workout.durationSeconds || 0)}, power ${workout.powerKgPerMin || 0} kg/min) and logged sets will be erased.`
      : `Все зафиксированные показатели (тоннаж ${workout.tonnageKg || 0} кг, время ${formatTime(workout.durationSeconds || 0)}, мощность ${workout.powerKgPerMin || 0} кг/м) и отметки подходов будут удалены.`;

  const inProgressDesc =
    language === "uk"
      ? "Секундомір буде зупинено і скинуто на 00:00, а всі виконані підходи у цій сесії будуть очищені."
      : language === "en"
      ? "Stopwatch will be stopped and reset to 00:00, and all checked sets in this session will be cleared."
      : "Секундомер будет остановлен и сброшен на 00:00, а все выполненные подходы в этой сессии будут очищены.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{modalTitle}</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {isCompleted ? (
            <span className="space-y-1 block text-slate-300">
              <span className="block">
                <strong className="text-white">"{localizedTitle}"</strong>
              </span>
              <span className="block text-xs text-rose-300/90 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20 my-2">
                {warningDesc}
              </span>
            </span>
          ) : (
            <span className="space-y-1 block text-slate-300">
              <span className="block">
                {inProgressDesc}
              </span>
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          variant="outline"
          size="default"
          onClick={() => onOpenChange(false)}
          className="flex-1 text-xs font-semibold"
        >
          {t.common.cancel}
        </Button>
        <Button
          variant="destructive"
          size="default"
          onClick={handleAction}
          className="flex-1 text-xs font-bold gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t.common.confirm}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
