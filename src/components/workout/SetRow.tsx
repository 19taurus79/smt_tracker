"use client";

import React from "react";
import { Check } from "lucide-react";
import { SetRecord, ExerciseCategory } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const { toggleSetCompletion, updateSet } = useWorkoutStore();
  const { defaultRestSeconds, soundEnabled, hapticsEnabled } = useSettingsStore();

  const handleToggle = () => {
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

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
      actualWeight: val,
    });
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    updateSet(workoutId, supersetId, exerciseId, set.setNumber, {
      actualReps: val,
    });
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
      {/* Mobile-First Layout: Top info row + Bottom action row on small screens, Single flex row on sm+ */}
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
                  {exerciseName}
                </span>
                <span
                  className={cn(
                    "text-[9px] px-1 py-0.2 rounded font-semibold uppercase tracking-wider shrink-0",
                    isMain
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-cyan-500/20 text-cyan-400"
                  )}
                >
                  {isMain ? "Основное" : "Подсобка"}
                </span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>План:</span>
              <strong className={isMain ? "text-emerald-300" : "text-cyan-300"}>
                {set.targetWeight} кг
              </strong>
              <span>×</span>
              <strong className="text-white">{set.targetReps}</strong>
              <span>повт</span>
            </div>
          </div>
        </div>

        {/* Right Action: Actual Inputs + Done Button (Fixed width & alignment on mobile) */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t border-white/5 sm:border-t-0">
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              value={currentWeight}
              onChange={handleWeightChange}
              className="w-13 h-7 sm:h-8 rounded-lg border border-white/10 bg-slate-900 px-1 text-center font-bold text-xs text-white focus:outline-none focus:border-emerald-500"
              title="Фактический вес (кг)"
            />
            <span className="text-[10px] text-slate-500">кг</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={currentReps}
              onChange={handleRepsChange}
              className="w-10 h-7 sm:h-8 rounded-lg border border-white/10 bg-slate-900 px-1 text-center font-bold text-xs text-white focus:outline-none focus:border-emerald-500"
              title="Фактические повторения"
            />
            <span className="text-[10px] text-slate-500">повт</span>
          </div>

          {/* Action Done Button */}
          <Button
            size="sm"
            variant={set.completed ? "default" : "outline"}
            className={cn(
              "h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all ml-auto sm:ml-1",
              set.completed
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            )}
            onClick={handleToggle}
          >
            {set.completed ? (
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 stroke-[3]" />
                <span>Сделан</span>
              </div>
            ) : (
              <span>Зачесть</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
