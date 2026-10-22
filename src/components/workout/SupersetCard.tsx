"use client";

import React from "react";
import { Layers, Dumbbell, Zap, Check, ArrowDown, Timer } from "lucide-react";
import { Superset } from "@/types/smt";
import { SetRow } from "./SetRow";
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

interface SupersetCardProps {
  workoutId: string;
  superset: Superset;
}

export function SupersetCard({ workoutId, superset }: SupersetCardProps) {
  const { activeWorkoutId, workouts, completeSupersetRound, updateSet } = useWorkoutStore();
  const { defaultRestSeconds, soundEnabled, hapticsEnabled } = useSettingsStore();
  const { t, language } = useTranslation();

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

  return (
    <Card className="border-white/10 bg-slate-900/75 overflow-hidden shadow-lg">
      {/* Header: Title + Subtitle on Left, Minimal Progress Badge on Right */}
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

        {/* For supersets: Clean target preview banner for 1A and 1B */}
        {!isSingle && ex1 && ex2 && (
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
            {ex1.sets.map((set) => (
              <SetRow
                key={set.id}
                workoutId={workoutId}
                supersetId={superset.id}
                exerciseId={ex1.exerciseId}
                set={set}
              />
            ))}
          </div>
        ) : (
          /* Superset: Whole-Round Execution (A -> B without rest, then rest after round) */
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

              return (
                <div
                  key={`round-${roundIdx}`}
                  className={cn(
                    "rounded-xl border p-2.5 sm:p-3 space-y-2 transition-all",
                    isRoundDone
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : "bg-slate-950/40 border-white/10 hover:border-white/15"
                  )}
                >
                  {/* Round Header */}
                  <div className="flex items-center justify-between text-xs font-bold">
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

                  {/* Exercise 1A in Round */}
                  {set1 && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
                          {roundNum}А
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block truncate">
                            {getLocalizedExerciseName(ex1.name, language, false)}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {set1.targetWeight} {t.common.kg} × {set1.targetReps}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={set1.actualWeight ?? set1.targetWeight}
                            onChange={(e) => {
                              const clean = e.target.value.replace(",", ".").trim();
                              const val = parseFloat(clean);
                              updateSet(workoutId, superset.id, ex1.exerciseId, set1.setNumber, {
                                actualWeight: !isNaN(val) ? val : 0,
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-11 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">{t.common.kg}</span>
                        </div>

                        <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={set1.actualReps ?? set1.targetReps}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateSet(workoutId, superset.id, ex1.exerciseId, set1.setNumber, {
                                actualReps: !isNaN(val) ? val : 0,
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">{t.common.reps}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transition Indicator: No rest between 1A and 1B */}
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-cyan-400/80 py-0.5">
                    <ArrowDown className="h-3 w-3 animate-bounce" />
                    <span>{transitionText}</span>
                  </div>

                  {/* Exercise 1B in Round */}
                  {set2 && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/70 border border-cyan-500/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/30">
                          {roundNum}Б
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block truncate">
                            {getLocalizedExerciseName(ex2.name, language, false)}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {set2.targetWeight} {t.common.kg} × {set2.targetReps}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={set2.actualWeight ?? set2.targetWeight}
                            onChange={(e) => {
                              const clean = e.target.value.replace(",", ".").trim();
                              const val = parseFloat(clean);
                              updateSet(workoutId, superset.id, ex2.exerciseId, set2.setNumber, {
                                actualWeight: !isNaN(val) ? val : 0,
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-11 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">{t.common.kg}</span>
                        </div>

                        <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={set2.actualReps ?? set2.targetReps}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateSet(workoutId, superset.id, ex2.exerciseId, set2.setNumber, {
                                actualReps: !isNaN(val) ? val : 0,
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">{t.common.reps}</span>
                        </div>
                      </div>
                    </div>
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
      </CardContent>
    </Card>
  );
}
