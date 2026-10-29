"use client";

import React, { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { SetRecord, ExerciseCategory } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";
import { WeightNumpadModal } from "./WeightNumpadModal";
import { triggerHaptic } from "@/lib/tma/telegram";

interface SetRowProps {
  workoutId: string;
  supersetId: string;
  exerciseId: string;
  set: SetRecord;
  exerciseName?: string;
  exerciseCategory?: ExerciseCategory;
  roundBadge?: string;
  isSupersetRow?: boolean;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  totalSets?: number;
}

export function SetRow({
  workoutId,
  supersetId,
  exerciseId,
  set,
  exerciseName,
  exerciseCategory,
  roundBadge,
  isSupersetRow,
  isBatchMode,
  isSelected,
  onToggleSelect,
  totalSets = 4,
}: SetRowProps) {
  const { activeWorkoutId, workouts, toggleSetCompletion, updateSet, batchUpdateSets } = useWorkoutStore();
  const { defaultRestSeconds, soundEnabled, hapticsEnabled } = useSettingsStore();
  const { t, language } = useTranslation();
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);

  const currentWorkout = workouts.find((w) => w.id === workoutId);
  const isActive = activeWorkoutId === workoutId && currentWorkout?.status === "in_progress";

  const handleToggle = () => {
    if (!isActive) return;
    toggleSetCompletion(
      workoutId,
      supersetId,
      exerciseId,
      set.setNumber,
      defaultRestSeconds,
      soundEnabled,
      hapticsEnabled
    );
  };

  const currentWeight = set.actualWeight ?? set.targetWeight;
  const currentReps = set.actualReps ?? set.targetReps;
  const isMain = exerciseCategory === "main";

  const handleStepWeight = (delta: number) => {
    triggerHaptic("selection");
    const nextVal = Math.max(0, Math.round((currentWeight + delta) * 10) / 10);
    updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
      actualWeight: nextVal,
    });
  };

  const handleStepReps = (delta: number) => {
    triggerHaptic("selection");
    const nextVal = Math.max(1, currentReps + delta);
    updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
      actualReps: nextVal,
    });
  };

  const handleSaveNumpadWeight = (newWeight: number, applyToRemaining: boolean) => {
    if (!applyToRemaining) {
      updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
        actualWeight: newWeight,
      });
      return;
    }

    // Apply to current set and all subsequent sets of this exercise
    const ss = currentWorkout?.supersets.find((s) => s.id === supersetId);
    const ex = ss?.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) {
      updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
        actualWeight: newWeight,
      });
      return;
    }

    const updates = ex.sets
      .filter((s) => s.setNumber >= set.setNumber)
      .map((s) => ({
        exerciseId,
        setNumber: s.setNumber,
        data: { actualWeight: newWeight },
      }));

    batchUpdateSets(workoutId, supersetId, updates);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border transition-all text-xs sm:text-sm p-2 sm:p-2.5",
          isSelected
            ? "bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10"
            : set.completed
            ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-200"
            : isSupersetRow
            ? isMain
              ? "bg-slate-950/60 border-emerald-500/20 text-slate-300"
              : "bg-slate-950/60 border-cyan-500/20 text-slate-300"
            : "bg-slate-950/50 border-white/5 text-slate-300 hover:border-white/10"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left Info: Checkbox (in batch mode) + Badge + Name + Target Plan */}
          <div className="flex items-center gap-2 min-w-0">
            {isBatchMode && (
              <button
                type="button"
                onClick={onToggleSelect}
                className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                  isSelected
                    ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm"
                    : "border-white/20 bg-slate-900 hover:border-white/40"
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>
            )}

            <div
              className={cn(
                "flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg font-bold text-[11px] sm:text-xs",
                isSupersetRow
                  ? isMain
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-slate-400"
              )}
            >
              {roundBadge || `#${set.setNumber}`}
            </div>

            <div className="flex-1 min-w-0">
              {isSupersetRow && exerciseName && (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {getLocalizedExerciseName(exerciseName, language, false)}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] px-1 py-0.2 rounded font-semibold uppercase tracking-wider shrink-0",
                      isMain
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    )}
                  >
                    {isMain ? t.workout.mainExercise : t.workout.accessoryExercise}
                  </span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>{t.workout.target}:</span>
                <strong className={isMain ? "text-emerald-300" : "text-cyan-300"}>
                  {set.targetWeight} {t.common.kg}
                </strong>
                <span>×</span>
                <strong className="text-white">{set.targetReps}</strong>
                <span>{t.common.reps}</span>
              </div>
            </div>
          </div>

          {/* Right Action: Weight Stepper + Actual Inputs + Done Button */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t border-white/5 sm:border-t-0">
            {/* Weight Input with Steppers and Numpad Trigger */}
            <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => handleStepWeight(-0.5)}
                className="h-6 w-5 sm:h-7 sm:w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="-0.5 кг"
              >
                <Minus className="h-3 w-3" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsNumpadOpen(true);
                }}
                className="px-1.5 h-6 sm:h-7 flex items-baseline gap-0.5 hover:bg-white/5 rounded transition-colors text-center"
                title={`${t.workout.actual} (${t.common.kg}) - Нажмите для ввода`}
              >
                <span className="font-bold text-xs text-white min-w-[28px]">
                  {currentWeight}
                </span>
                <span className="text-[9px] text-slate-500 font-normal">{t.common.kg}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStepWeight(0.5)}
                className="h-6 w-5 sm:h-7 sm:w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="+0.5 кг"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Reps Input with Steppers */}
            <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => handleStepReps(-1)}
                className="h-6 w-5 sm:h-7 sm:w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="-1 повторение"
              >
                <Minus className="h-3 w-3" />
              </button>

              <div className="flex items-baseline gap-0.5 px-0.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentReps}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
                      actualReps: !isNaN(val) ? val : 0,
                    });
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-5 sm:w-6 h-6 sm:h-7 bg-transparent text-center font-bold text-xs text-white focus:outline-none"
                  title={t.workout.actual}
                />
                <span className="text-[9px] text-slate-500 font-normal">{t.common.reps}</span>
              </div>

              <button
                type="button"
                onClick={() => handleStepReps(1)}
                className="h-6 w-5 sm:h-7 sm:w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="+1 повторение"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Action Done Button */}
            <div
              className={!isActive && !set.completed ? "cursor-not-allowed" : undefined}
              title={!isActive && !set.completed ? t.workout.cannotCompleteWithoutStart : undefined}
            >
              <Button
                size="sm"
                variant={set.completed ? "default" : "outline"}
                disabled={!isActive}
                className={cn(
                  "h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition-all ml-auto sm:ml-1",
                  set.completed
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "border-white/15 hover:border-emerald-500/40 text-slate-300 hover:text-white"
                )}
                onClick={handleToggle}
              >
                <Check className="h-3.5 w-3.5 mr-0.5" />
                <span>{set.completed ? t.workout.setCompleted : t.workout.setNotCompleted}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Numpad Modal */}
      <WeightNumpadModal
        open={isNumpadOpen}
        onOpenChange={setIsNumpadOpen}
        initialWeight={currentWeight}
        exerciseName={exerciseName}
        setNumber={set.setNumber}
        totalSets={totalSets}
        onSave={handleSaveNumpadWeight}
      />
    </>
  );
}

