"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkoutSession } from "@/types/smt";
import { formatTime } from "@/lib/utils";

interface ConfirmResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  onConfirm: () => void;
}

export function ConfirmResetModal({
  open,
  onOpenChange,
  workout,
  onConfirm,
}: ConfirmResetModalProps) {
  if (!workout) return null;

  const isCompleted = workout.status === "completed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              {isCompleted
                ? `Сбросить тренировку #${workout.workoutNumber}?`
                : `Сбросить текущую сессию #${workout.workoutNumber}?`}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {isCompleted ? (
            <span className="space-y-1 block text-slate-300">
              <span className="block">
                Вы собираетесь сбросить результаты завершенной тренировки{" "}
                <strong className="text-white">"{workout.title}"</strong>.
              </span>
              <span className="block text-xs text-rose-300/90 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20 my-2">
                Все зафиксированные показатели (тоннаж {workout.tonnageKg || 0} кг,
                время {formatTime(workout.durationSeconds || 0)}, мощность{" "}
                {workout.powerKgPerMin || 0} кг/м) и отметки подходов будут удалены,
                а тренировка вернется в статус «Запланирована».
              </span>
            </span>
          ) : (
            <span className="space-y-1 block text-slate-300">
              <span className="block">
                Секундомер будет остановлен и сброшен на 00:00, а все выполненные
                подходы в этой сессии будут очищены.
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
          Отмена
        </Button>
        <Button
          variant="destructive"
          size="default"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          className="flex-1 text-xs font-bold gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Да, сбросить</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
