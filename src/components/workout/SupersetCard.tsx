"use client";

import React, { useState } from "react";
import {
  Layers,
  Dumbbell,
  Zap,
  Check,
  ArrowDown,
  Timer,
  CheckSquare,
  Copy,
  Plus,
  Minus,
  X,
  Sliders,
} from "lucide-react";
import { Superset } from "@/types/smt";
import { SetRow } from "./SetRow";
import { WeightNumpadModal } from "./WeightNumpadModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
  getLocalizedExerciseName,
  formatSupersetLabel,
} from "@/lib/i18n/exercises";
import { triggerHaptic } from "@/lib/tma/telegram";

interface SupersetCardProps {
  workoutId: string;
  superset: Superset;
}

export function SupersetCard({ workoutId, superset }: SupersetCardProps) {
  const {
    activeWorkoutId,
    workouts,
    completeSupersetRound,
    updateSet,
    batchUpdateSets,
    copyFirstSetWeightToAll,
  } = useWorkoutStore();
  const { defaultRestSeconds, soundEnabled, hapticsEnabled } = useSettingsStore();
  const { t, language } = useTranslation();

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedSetKeys, setSelectedSetKeys] = useState<Set<string>>(new Set());
  const [isBatchNumpadOpen, setIsBatchNumpadOpen] = useState(false);

  const currentWorkout = workouts.find((w) => w.id === workoutId);
  const isActive = activeWorkoutId === workoutId && currentWorkout?.status === "in_progress";

  const isSingle = superset.type === "single" || superset.exercises.length === 1;

  const totalSets = superset.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  );
  const completedSets = superset.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  const isAllDone = totalSets > 0 && completedSets === totalSets;

  const ex1 = superset.exercises[0];
  const ex2 = superset.exercises[1];

  // Number of rounds in superset (usually 4)
  const roundCount = Math.max(...superset.exercises.map((e) => e.sets.length));

  // Clean, crisp title formatting that never overflows on mobile
  const supersetNumberMatch = superset.label.match(/\d+/)?.[0] || "1";
  const cardTitleText = isSingle
    ? formatSupersetLabel(superset.label, language)
    : language === "en"
    ? `Superset ${supersetNumberMatch}`
    : `Суперсет ${supersetNumberMatch}`;

  const restSubtitleText = isSingle
    ? `${language === "en" ? "Rest" : "Відпочинок"} ${defaultRestSeconds}с`
    : `${language === "en" ? "Rest" : "Відпочинок"} ${defaultRestSeconds}с ${language === "en" ? "after round" : "після кола"}`;

  const transitionText =
    language === "uk"
      ? "1А ➔ 1Б (одразу без паузи)"
      : language === "en"
      ? "1A ➔ 1B (no rest)"
      : "1А ➔ 1Б (сразу без паузы)";

  const toggleSelectSet = (key: string) => {
    triggerHaptic("selection");
    setSelectedSetKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = () => {
    triggerHaptic("selection");
    const allKeys = new Set<string>();
    for (const ex of superset.exercises) {
      for (const s of ex.sets) {
        allKeys.add(`${ex.exerciseId}:${s.setNumber}`);
      }
    }
    setSelectedSetKeys(allKeys);
  };

  const handleClearSelection = () => {
    triggerHaptic("light");
    setSelectedSetKeys(new Set());
  };

  // Batch delta weight (+0.5, -0.5)
  const handleBatchDeltaWeight = (delta: number) => {
    triggerHaptic("selection");
    const updates: Array<{
      exerciseId: string;
      setNumber: number;
      data: { actualWeight?: number };
    }> = [];

    for (const ex of superset.exercises) {
      for (const s of ex.sets) {
        const key = `${ex.exerciseId}:${s.setNumber}`;
        if (selectedSetKeys.has(key)) {
          const cur = s.actualWeight ?? s.targetWeight;
          const next = Math.max(0, Math.round((cur + delta) * 10) / 10);
          updates.push({
            exerciseId: ex.exerciseId,
            setNumber: s.setNumber,
            data: { actualWeight: next },
          });
        }
      }
    }

    if (updates.length > 0) {
      batchUpdateSets(workoutId, superset.id, updates);
    }
  };

  // Batch completion status
  const handleBatchMarkCompleted = (completed: boolean) => {
    triggerHaptic("medium");
    const updates: Array<{
      exerciseId: string;
      setNumber: number;
      data: { completed: boolean };
    }> = [];

    for (const ex of superset.exercises) {
      for (const s of ex.sets) {
        const key = `${ex.exerciseId}:${s.setNumber}`;
        if (selectedSetKeys.has(key)) {
          updates.push({
            exerciseId: ex.exerciseId,
            setNumber: s.setNumber,
            data: { completed },
          });
        }
      }
    }

    if (updates.length > 0) {
      batchUpdateSets(workoutId, superset.id, updates);
    }
  };

  // Batch Save from Numpad
  const handleBatchSaveNumpad = (newWeight: number) => {
    const updates: Array<{
      exerciseId: string;
      setNumber: number;
      data: { actualWeight?: number };
    }> = [];

    for (const ex of superset.exercises) {
      for (const s of ex.sets) {
        const key = `${ex.exerciseId}:${s.setNumber}`;
        if (selectedSetKeys.has(key)) {
          updates.push({
            exerciseId: ex.exerciseId,
            setNumber: s.setNumber,
            data: { actualWeight: newWeight },
          });
        }
      }
    }

    if (updates.length > 0) {
      batchUpdateSets(workoutId, superset.id, updates);
    }
  };

  // First selected set's weight for Numpad
  let initialNumpadWeight = 0;
  for (const ex of superset.exercises) {
    for (const s of ex.sets) {
      if (selectedSetKeys.has(`${ex.exerciseId}:${s.setNumber}`)) {
        initialNumpadWeight = s.actualWeight ?? s.targetWeight;
        break;
      }
    }
    if (initialNumpadWeight > 0) break;
  }

  return (
    <Card className="border-white/10 bg-slate-900/75 overflow-hidden shadow-lg">
      {/* Header: Title + Subtitle on Left, Batch mode toggle + Sets Counter on Right */}
      <CardHeader className="p-3 sm:p-4 bg-white/[0.02] border-b border-white/5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                isSingle
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              )}
            >
              {isSingle ? (
                <Dumbbell className="h-4 w-4" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base font-black text-white truncate leading-tight">
                {cardTitleText}
              </CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium truncate">
                <Timer className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>{restSubtitleText}</span>
              </p>
            </div>
          </div>

          {/* Header Actions: Batch Mode Toggle + Sets Counter */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isActive && (
              <Button
                size="sm"
                variant={isBatchMode ? "default" : "outline"}
                onClick={() => {
                  triggerHaptic("selection");
                  setIsBatchMode(!isBatchMode);
                  if (isBatchMode) setSelectedSetKeys(new Set());
                }}
                className={cn(
                  "h-7 px-2 text-[11px] font-bold rounded-lg border",
                  isBatchMode
                    ? "bg-cyan-500 text-slate-950 border-cyan-400"
                    : "border-white/10 text-slate-400 hover:text-white"
                )}
                title="Режим пакетного редактирования"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                <span>
                  {isBatchMode
                    ? language === "en" ? "Done" : "Готово"
                    : language === "en" ? "Select" : "Выбрать"}
                </span>
              </Button>
            )}

            {/* Compact Sets Counter Badge (e.g. 2 / 8) */}
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shrink-0 border font-mono",
                isAllDone
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                  : "bg-slate-950/80 text-slate-300 border-white/10"
              )}
            >
              <span className={isAllDone ? "text-emerald-300" : "text-emerald-400 font-bold"}>
                {completedSets}
              </span>
              <span className="text-slate-500">/</span>
              <span>{totalSets}</span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar when Batch Mode is Active */}
        {isBatchMode && (
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5 text-[11px] animate-in fade-in">
            <div className="flex items-center gap-1 text-slate-400">
              <span className="font-semibold text-cyan-300">
                {language === "en" ? "Selected" : "Выбрано"}: {selectedSetKeys.size}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={selectedSetKeys.size === totalSets ? handleClearSelection : handleSelectAll}
                className="text-cyan-400 hover:underline font-bold"
              >
                {selectedSetKeys.size === totalSets
                  ? language === "en" ? "Deselect All" : "Снять все"
                  : language === "en" ? "Select All" : "Выбрать все"}
              </button>
            </div>

            {/* Copy 1st set weight to all */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                for (const ex of superset.exercises) {
                  copyFirstSetWeightToAll(workoutId, superset.id, ex.exerciseId);
                }
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Скопировать вес 1-го подхода на все остальные"
            >
              <Copy className="h-3 w-3 text-cyan-400" />
              <span>{language === "uk" ? "Вага 1-го у всі" : "Вес 1-го во все"}</span>
            </button>
          </div>
        )}

        {/* For supersets: Clean target preview banner for 1A and 1B */}
        {!isSingle && ex1 && ex2 && !isBatchMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-white/5 text-xs">
            {/* 1A Target Box */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/25 border border-emerald-500/25">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-500/30 text-emerald-300 font-black text-[10px]">
                  1А
                </span>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate max-w-[150px] sm:max-w-none">
                    {getLocalizedExerciseName(ex1.name, language, false)}
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-medium">
                    {t.workout.mainExercise}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-black text-emerald-300 font-mono">
                  {ex1.sets[0]?.targetWeight} {t.common.kg}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  × {ex1.sets[0]?.targetReps} {t.common.reps}
                </span>
              </div>
            </div>

            {/* 1B Target Box */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/25 border border-cyan-500/25">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-cyan-500/30 text-cyan-300 font-black text-[10px]">
                  1Б
                </span>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate max-w-[150px] sm:max-w-none">
                    {getLocalizedExerciseName(ex2.name, language, false)}
                  </span>
                  <span className="text-[10px] text-cyan-400 block font-medium">
                    {t.workout.accessoryExercise}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-black text-cyan-300 font-mono">
                  {ex2.sets[0]?.targetWeight} {t.common.kg}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  × {ex2.sets[0]?.targetReps} {t.common.reps}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-2 sm:p-3.5 space-y-2.5">
        {isSingle ? (
          /* Single Exercise: sequential sets with SetRow */
          <div className="space-y-1.5">
            {ex1.sets.map((set) => {
              const setKey = `${ex1.exerciseId}:${set.setNumber}`;
              return (
                <SetRow
                  key={set.id}
                  workoutId={workoutId}
                  supersetId={superset.id}
                  exerciseId={ex1.exerciseId}
                  set={set}
                  isBatchMode={isBatchMode}
                  isSelected={selectedSetKeys.has(setKey)}
                  onToggleSelect={() => toggleSelectSet(setKey)}
                  totalSets={ex1.sets.length}
                />
              );
            })}
          </div>
        ) : (
          /* Superset: Whole-Round Execution with unified SetRow controls */
          <div className="space-y-2.5">
            {Array.from({ length: roundCount }).map((_, roundIdx) => {
              const roundNum = roundIdx + 1;
              const set1 = ex1.sets[roundIdx];
              const set2 = ex2.sets[roundIdx];
              const isRoundDone = !!(set1?.completed && set2?.completed);

              const roundHeader =
                language === "uk"
                  ? `Коло ${roundNum} з ${roundCount}`
                  : language === "en"
                  ? `Round ${roundNum} of ${roundCount}`
                  : `Круг ${roundNum} из ${roundCount}`;

              const set1Key = `${ex1.exerciseId}:${roundNum}`;
              const set2Key = `${ex2.exerciseId}:${roundNum}`;

              return (
                <div
                  key={`round-${roundIdx}`}
                  className={cn(
                    "rounded-xl border p-2 sm:p-2.5 space-y-2 transition-all",
                    isRoundDone
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : "bg-slate-950/40 border-white/10 hover:border-white/15"
                  )}
                >
                  {/* Round Header */}
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="flex items-center gap-1.5 text-white">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>{roundHeader}</span>
                    </span>
                    {isRoundDone ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>{language === "en" ? "Done" : "Виконано"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/90 font-medium">
                        1А ➔ 1Б {language === "en" ? "(no rest)" : "(без паузи)"}
                      </span>
                    )}
                  </div>

                  {/* Exercise 1A in Round via SetRow */}
                  {set1 && (
                    <SetRow
                      workoutId={workoutId}
                      supersetId={superset.id}
                      exerciseId={ex1.exerciseId}
                      set={set1}
                      exerciseName={ex1.name}
                      exerciseCategory="main"
                      roundBadge={`${roundNum}А`}
                      isSupersetRow={true}
                      isBatchMode={isBatchMode}
                      isSelected={selectedSetKeys.has(set1Key)}
                      onToggleSelect={() => toggleSelectSet(set1Key)}
                      totalSets={roundCount}
                    />
                  )}

                  {/* Transition Indicator: No rest between 1A and 1B */}
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-cyan-400/80 py-0.5">
                    <ArrowDown className="h-3 w-3 animate-bounce" />
                    <span>{transitionText}</span>
                  </div>

                  {/* Exercise 1B in Round via SetRow */}
                  {set2 && (
                    <SetRow
                      workoutId={workoutId}
                      supersetId={superset.id}
                      exerciseId={ex2.exerciseId}
                      set={set2}
                      exerciseName={ex2.name}
                      exerciseCategory="accessory"
                      roundBadge={`${roundNum}Б`}
                      isSupersetRow={true}
                      isBatchMode={isBatchMode}
                      isSelected={selectedSetKeys.has(set2Key)}
                      onToggleSelect={() => toggleSelectSet(set2Key)}
                      totalSets={roundCount}
                    />
                  )}

                  {/* Single Unified Round Completion Button */}
                  <div
                    className={!isActive && !isRoundDone ? "cursor-not-allowed" : undefined}
                    title={!isActive && !isRoundDone ? t.workout.cannotCompleteWithoutStart : undefined}
                  >
                    <Button
                      disabled={!isActive}
                      onClick={() =>
                        completeSupersetRound(
                          workoutId,
                          superset.id,
                          roundNum,
                          defaultRestSeconds,
                          soundEnabled,
                          hapticsEnabled
                        )
                      }
                      className={cn(
                        "w-full font-bold text-xs h-9 px-3 transition-all",
                        isRoundDone
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                          : !isActive
                          ? "opacity-40 cursor-not-allowed bg-slate-900 border border-white/10 text-slate-500 pointer-events-none"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25 active:scale-98"
                      )}
                    >
                      {isRoundDone ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          <span>
                            {language === "uk"
                              ? `Коло ${roundNum} зараховано (скасувати)`
                              : language === "en"
                              ? `Round ${roundNum} done (undo)`
                              : `Круг ${roundNum} засчитан (отменить)`}
                          </span>
                        </span>
                      ) : !isActive ? (
                        <span className="text-slate-500">
                          {language === "uk"
                            ? `Коло ${roundNum} (почніть тренування)`
                            : language === "en"
                            ? `Round ${roundNum} (start workout)`
                            : `Круг ${roundNum} (начните тренировку)`}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          <span>
                            {language === "uk"
                              ? `Зарахувати Коло ${roundNum} • Відпочинок ${defaultRestSeconds}с`
                              : language === "en"
                              ? `Complete Round ${roundNum} • Rest ${defaultRestSeconds}s`
                              : `Засчитать Круг ${roundNum} • Отдых ${defaultRestSeconds}с`}
                          </span>
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Batch Action Toolbar */}
        {isBatchMode && selectedSetKeys.size > 0 && (
          <div className="sticky bottom-2 z-20 rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-1.5 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-1 shrink-0">
              <span className="h-6 px-2 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center">
                {selectedSetKeys.size}
              </span>
              <button
                type="button"
                onClick={() => handleBatchDeltaWeight(-0.5)}
                className="h-8 w-8 rounded-lg bg-slate-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300"
                title="-0.5 кг"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleBatchDeltaWeight(0.5)}
                className="h-8 w-8 rounded-lg bg-slate-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300"
                title="+0.5 кг"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBatchNumpadOpen(true)}
                className="h-8 px-2 text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 font-bold"
              >
                <Sliders className="h-3 w-3 mr-1" />
                <span>{language === "en" ? "Set Weight" : "Задать вес"}</span>
              </Button>

              <Button
                size="sm"
                variant="default"
                onClick={() => handleBatchMarkCompleted(true)}
                className="h-8 px-2 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                <Check className="h-3.5 w-3.5 mr-0.5" />
                <span>{language === "en" ? "Check" : "Зачесть"}</span>
              </Button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="h-8 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                title="Снять выбор"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Batch Weight Numpad Modal */}
      <WeightNumpadModal
        open={isBatchNumpadOpen}
        onOpenChange={setIsBatchNumpadOpen}
        initialWeight={initialNumpadWeight}
        exerciseName={`${cardTitleText} (${selectedSetKeys.size} подходов)`}
        setNumber={1}
        totalSets={1}
        onSave={(newWeight) => {
          handleBatchSaveNumpad(newWeight);
          setIsBatchNumpadOpen(false);
        }}
      />
    </Card>
  );
}

