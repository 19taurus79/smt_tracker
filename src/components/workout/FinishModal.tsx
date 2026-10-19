"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  Zap,
  Clock,
  Dumbbell,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Sliders,
  ChevronRight,
} from "lucide-react";
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
    pauseStopwatch,
    finishWorkout,
  } = useWorkoutStore();
  const { weightIncrementKg, soundEnabled, hapticsEnabled } = useSettingsStore();

  const [notes, setNotes] = useState("");
  // Proposed increments per exercise ID: { [exerciseId]: incrementKg }
  const [exerciseIncrements, setExerciseIncrements] = useState<Record<string, number>>({});
  // Фиксируем время в момент открытия модалки, чтобы мощность не падала во время редактирования
  const [frozenDuration, setFrozenDuration] = useState<number>(0);

  useEffect(() => {
    if (open) {
      pauseStopwatch();
      setFrozenDuration(workoutElapsedSeconds || 1);
    } else {
      setFrozenDuration(0);
    }
  }, [open]);

  const effectiveDuration = frozenDuration > 0 ? frozenDuration : (workoutElapsedSeconds || 1);
  const currentWorkout =
    workouts.find((w) => w.id === activeWorkoutId) ||
    workouts.find((w) => w.status === "in_progress") ||
    workouts.find((w) => w.status === "upcoming") ||
    workouts[0];
  const tonnage = currentWorkout
    ? calculateWorkoutTonnage(currentWorkout.supersets)
    : 0;
  const power = calculateWorkoutPower(tonnage, effectiveDuration);

  // Check if current workout is the last one in the microcycle (e.g. 9, 18, 27, 36)
  const isEndOfMicrocycle = currentWorkout ? currentWorkout.workoutNumber % 9 === 0 : false;

  // Collect unique exercises from the current workout
  const uniqueExercises = React.useMemo(() => {
    if (!currentWorkout) return [];
    const list: Array<{ id: string; name: string; currentWeight: number; allCompleted: boolean }> = [];
    const seen = new Set<string>();

    for (const ss of currentWorkout.supersets) {
      for (const ex of ss.exercises) {
        if (!seen.has(ex.exerciseId)) {
          seen.add(ex.exerciseId);
          const allCompleted = ex.sets.every(
            (s) => s.completed && (s.actualReps ? s.actualReps >= s.targetReps : true)
          );
          const currentWeight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
          list.push({
            id: ex.exerciseId,
            name: ex.name,
            currentWeight,
            allCompleted,
          });
        }
      }
    }
    return list;
  }, [currentWorkout]);

  // Initialize proposals when modal opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, number> = {};
      uniqueExercises.forEach((ex) => {
        // Propose standard increment (+2.5 kg or user setting) if all sets were completed cleanly
        initial[ex.id] = ex.allCompleted ? weightIncrementKg : 0;
      });
      setExerciseIncrements(initial);

      try {
        confetti({
          particleCount: isEndOfMicrocycle ? 120 : 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [open, uniqueExercises, weightIncrementKg, isEndOfMicrocycle]);

  const handleToggleExerciseIncrement = (exerciseId: string, currentInc: number) => {
    setExerciseIncrements((prev) => ({
      ...prev,
      [exerciseId]: currentInc > 0 ? 0 : weightIncrementKg,
    }));
  };

  const handleChangeIncrementValue = (exerciseId: string, value: number) => {
    setExerciseIncrements((prev) => ({
      ...prev,
      [exerciseId]: value,
    }));
  };

  const handleComplete = () => {
    finishWorkout(
      notes,
      exerciseIncrements,
      weightIncrementKg,
      soundEnabled,
      hapticsEnabled,
      effectiveDuration,
      currentWorkout.id
    );
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
            <span>
              {isEndOfMicrocycle
                ? `🎉 Микроцикл ${currentWorkout.microcycle} завершен!`
                : "Тренировка завершена!"}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {isEndOfMicrocycle
            ? `Поздравляем с окончанием 9 тренировок МКЦ-${currentWorkout.microcycle}! Скорректируйте предложенные веса на следующий микроцикл:`
            : "Отличная работа по СМТ-1. Проверьте результаты и выберите прибавки к весам:"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[72vh] overflow-y-auto pr-1">
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
              {formatTime(effectiveDuration)}
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

        {/* Progression Proposal Section (User Controls Which Weights Increase) */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-xs sm:text-sm text-white">
                {isEndOfMicrocycle
                  ? "Предложение прибавки на следующий микроцикл"
                  : "Предложение прибавки к весам"}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Выбор за вами
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Отметьте галочками упражнения, для которых хотите применить прибавку, либо измените шаг
            веса индивидуально:
          </p>

          <div className="space-y-2">
            {uniqueExercises.map((ex) => {
              const currentInc = exerciseIncrements[ex.id] ?? 0;
              const willIncrease = currentInc > 0;
              const nextWeight = ex.currentWeight + currentInc;

              return (
                <div
                  key={ex.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs ${
                    willIncrease
                      ? "bg-slate-900/90 border-emerald-500/40"
                      : "bg-slate-950/60 border-white/5 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={willIncrease}
                        onChange={() => handleToggleExerciseIncrement(ex.id, currentInc)}
                        className="h-4 w-4 rounded border-white/20 bg-slate-950 text-emerald-500 focus:ring-0"
                      />
                      <div className="truncate">
                        <span className="font-bold text-white block truncate">{ex.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {willIncrease ? (
                            <span className="text-emerald-300 font-semibold">
                              {ex.currentWeight} кг → {nextWeight} кг (+{currentInc} кг)
                            </span>
                          ) : (
                            <span>{ex.currentWeight} кг (без изменений)</span>
                          )}
                        </span>
                      </div>
                    </label>

                    {/* Quick increment buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[1.25, 2.5, 5.0].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleChangeIncrementValue(ex.id, step)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                            currentInc === step
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          +{step}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Заметки к тренировке (самочувствие, темп, отдых 30с)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Например: все круги суперсетов закрыты на отлично, отдых выдержан..."
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2 shrink-0">
        <Button
          variant="accent"
          size="lg"
          className="w-full font-bold text-xs sm:text-sm px-3 py-3 flex items-center justify-center gap-2 text-center leading-snug"
          onClick={handleComplete}
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Применить выбранные веса и сохранить</span>
        </Button>
      </div>
    </Dialog>
  );
}
