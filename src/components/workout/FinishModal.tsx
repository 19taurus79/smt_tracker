"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Zap, Clock, Dumbbell, TrendingUp, CheckCircle } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { formatTime } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { calculateWorkoutTonnage, calculateWorkoutPower } from "@/lib/smt/calculator";

interface FinishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
}

export function FinishModal({ open, onOpenChange, onFinished }: FinishModalProps) {
  const {
    activeWorkoutId,
    workouts,
    workoutElapsedSeconds,
    finishWorkout,
  } = useWorkoutStore();
  const { weightIncrementKg, soundEnabled, hapticsEnabled } = useSettingsStore();

  const [notes, setNotes] = useState("");

  const currentWorkout = workouts.find((w) => w.id === activeWorkoutId);
  const tonnage = currentWorkout
    ? calculateWorkoutTonnage(currentWorkout.supersets)
    : 0;
  const power = calculateWorkoutPower(tonnage, workoutElapsedSeconds);

  useEffect(() => {
    if (open) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [open]);

  const handleComplete = () => {
    finishWorkout(notes, weightIncrementKg, soundEnabled, hapticsEnabled);
    onOpenChange(false);
    onFinished();
  };

  if (!currentWorkout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <span>Тренировка завершена!</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          Отличная работа по методике СМТ-1. Проверьте и зафиксируйте результаты.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Dumbbell className="h-5 w-5 text-emerald-400 mb-1" />
            <span className="text-[11px] text-slate-400 font-medium">Тоннаж</span>
            <span className="text-base font-black text-white">{tonnage} кг</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Clock className="h-5 w-5 text-cyan-400 mb-1" />
            <span className="text-[11px] text-slate-400 font-medium">Время</span>
            <span className="text-base font-black text-white">
              {formatTime(workoutElapsedSeconds)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="h-5 w-5 text-amber-400 mb-1" />
            <span className="text-[11px] text-slate-400 font-medium">Мощность</span>
            <span className="text-base font-black text-white">
              {power} <span className="text-[10px] text-slate-400 font-normal">кг/м</span>
            </span>
          </div>
        </div>

        {/* Auto Progression Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-emerald-300">
              Авто-прибавка весов (+{weightIncrementKg} кг)
            </div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              Все успешно закрытые подходы принесут прибавку +{weightIncrementKg} кг к следующим
              тренировкам этого микроцикла СМТ-1.
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Заметки к тренировке (самочувствие, памп, отдых)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Например: отдых 30 сек выдержан, в жиме запас 1-2 повторения..."
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-2">
        <Button
          variant="accent"
          size="lg"
          className="w-full font-bold"
          onClick={handleComplete}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Зафиксировать и сохранить</span>
        </Button>
      </div>
    </Dialog>
  );
}
