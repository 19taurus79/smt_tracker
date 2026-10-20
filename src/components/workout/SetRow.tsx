"use client";

import React from "react";
import { Check } from "lucide-react";
import { SetRecord, ExerciseCategory } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";

interface SetRowProps {
  workoutId: string;
  supersetId: string;
  exerciseId: string;
  set: SetRecord;
  exerciseName?: string;
  exerciseCategory?: ExerciseCategory;
  roundBadge?: string;
  isSupersetRow?: boolean;
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
}: SetRowProps) {
  const { activeWorkoutId, workouts, toggleSetCompletion, updateSet } = useWorkoutStore();
  const { defaultRestSeconds, soundEnabled, hapticsEnabled } = useSettingsStore();
  const { t, language } = useTranslation();

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

  return (
    <div
      className={cn(
        "rounded-xl border transition-all text-xs sm:text-sm p-2 sm:p-2.5",
        set.completed
          ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-200"
          : isSupersetRow
          ? isMain
            ? "bg-slate-950/60 border-emerald-500/20 text-slate-300"
            : "bg-slate-950/60 border-cyan-500/20 text-slate-300"
          : "bg-slate-950/50 border-white/5 text-slate-300 hover:border-white/10"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left Info: Badge + Name + Target Plan */}
        <div className="flex items-center gap-2 min-w-0">
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

        {/* Right Action: Actual Inputs + Done Button */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t border-white/5 sm:border-t-0">
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={currentWeight}
              onChange={(e) => {
                const clean = e.target.value.replace(",", ".").trim();
                const val = parseFloat(clean);
                updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
                  actualWeight: !isNaN(val) ? val : 0,
                });
              }}
              onFocus={(e) => e.target.select()}
              className="w-13 h-7 sm:h-8 rounded-lg border border-white/10 bg-slate-900 px-1 text-center font-bold text-xs text-white focus:outline-none focus:border-emerald-500"
              title={`${t.workout.actual} (${t.common.kg})`}
            />
            <span className="text-[10px] text-slate-500">{t.common.kg}</span>
          </div>

          <div className="flex items-center gap-1">
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
              className="w-10 h-7 sm:h-8 rounded-lg border border-white/10 bg-slate-900 px-1 text-center font-bold text-xs text-white focus:outline-none focus:border-emerald-500"
              title={t.workout.actual}
            />
            <span className="text-[10px] text-slate-500">{t.common.reps}</span>
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
                "h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all ml-auto sm:ml-1",
                set.completed
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "border-white/15 hover:border-emerald-500/40 text-slate-300 hover:text-white"
              )}
              onClick={handleToggle}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>{set.completed ? t.workout.setCompleted : t.workout.setNotCompleted}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
