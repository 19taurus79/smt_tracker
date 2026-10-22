"use client";

import React from "react";
import { Layers, Dumbbell, Zap, Check, ArrowDown, Timer } from "lucide-react";
import { Superset } from "@/types/smt";
import { SetRow } from "./SetRow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
  getLocalizedExerciseName,
  formatSupersetLabel,
  formatSupersetType,
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

  return (
    <Card className="border-white/10 bg-slate-900/70 overflow-hidden shadow-lg">
      <CardHeader className="p-3 sm:p-5 bg-white/[0.02] border-b border-white/5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isSingle
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {isSingle ? (
                <Dumbbell className="h-4 w-4" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                {formatSupersetLabel(superset.label, language)}
              </CardTitle>
              {superset.description && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSupersetType(isSingle, language)}
                </p>
              )}
            </div>
          </div>

          <Badge
            variant={isAllDone ? "success" : isSingle ? "secondary" : "default"}
            className="text-xs font-bold shrink-0"
          >
            {formatSupersetType(isSingle, language)} • {completedSets}/{totalSets}
          </Badge>
        </div>

        {/* For supersets: Banner showing distinct weights & targets */}
        {!isSingle && ex1 && ex2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                  1А
                </span>
                <div>
                  <span className="font-bold text-white text-xs block truncate max-w-[140px] sm:max-w-none">
                    {getLocalizedExerciseName(ex1.name, language, false)}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {t.workout.mainExercise}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-300">
                  {ex1.sets[0]?.targetWeight} {t.common.kg}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  × {ex1.sets[0]?.targetReps} {t.common.reps}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                  1Б
                </span>
                <div>
                  <span className="font-bold text-white text-xs block truncate max-w-[140px] sm:max-w-none">
                    {getLocalizedExerciseName(ex2.name, language, false)}
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    {t.workout.accessoryExercise}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-cyan-300">
                  {ex2.sets[0]?.targetWeight} {t.common.kg}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  × {ex2.sets[0]?.targetReps} {t.common.reps}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-2 sm:p-4 space-y-3">
        {isSingle ? (
          /* Single Exercise: sequential sets */
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
          /* Superset: Whole-Round Execution (A -> B immediately without rest, then 30s rest after round) */
          <div className="space-y-4">
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

              const roundFlowNotice =
                language === "uk"
                  ? `1А → 1Б одразу без відпочинку • потім відпочинок ${defaultRestSeconds}с`
                  : language === "en"
                  ? `1A → 1B immediately • then ${defaultRestSeconds}s rest`
                  : `1А → 1Б сразу без отдыха • затем отдых ${defaultRestSeconds}с`;

              const transitionText =
                language === "uk"
                  ? "Одразу без відпочинку переходимо до 1Б"
                  : language === "en"
                  ? "Switch to 1B immediately without rest"
                  : "Сразу без отдыха переходим к 1Б";

              return (
                <div
                  key={`round-${roundIdx}`}
                  className={cn(
                    "rounded-2xl border p-3.5 space-y-3 transition-all",
                    isRoundDone
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : "bg-slate-950/40 border-white/10 hover:border-white/15"
                  )}
                >
                  {/* Round Header */}
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-white">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span>{roundHeader}</span>
                    </span>
                    <span className="text-[11px] text-amber-400/90 font-semibold flex items-center gap-1">
                      {roundFlowNotice}
                    </span>
                  </div>

                  {/* Exercise 1A in Round */}
                  {set1 && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/70 border border-emerald-500/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                          {roundNum}А
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-white text-xs block truncate">
                            {getLocalizedExerciseName(ex1.name, language, false)}
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            {t.workout.target}: {set1.targetWeight} {t.common.kg} × {set1.targetReps}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
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

                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
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
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5">
                    <ArrowDown className="h-3 w-3 text-cyan-400 animate-bounce" />
                    <span>{transitionText}</span>
                  </div>

                  {/* Exercise 1B in Round */}
                  {set2 && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/70 border border-cyan-500/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/30">
                          {roundNum}Б
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-white text-xs block truncate">
                            {getLocalizedExerciseName(ex2.name, language, false)}
                          </span>
                          <span className="text-[10px] text-cyan-400">
                            {t.workout.target}: {set2.targetWeight} {t.common.kg} × {set2.targetReps}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
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

                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
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
                        "w-full font-bold text-xs min-h-9 py-1.5 px-2 transition-all leading-tight text-center",
                        isRoundDone
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                          : !isActive
                          ? "opacity-35 cursor-not-allowed bg-slate-900 border border-white/10 text-slate-500 pointer-events-none"
                          : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                      )}
                    >
                      {isRoundDone ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {language === "uk"
                              ? `Коло ${roundNum} виконано (натисніть для скасування)`
                              : language === "en"
                              ? `Round ${roundNum} done (click to undo)`
                              : `Круг ${roundNum} выполнен (нажмите для отмены)`}
                          </span>
                        </span>
                      ) : !isActive ? (
                        <span className="flex items-center justify-center gap-1.5 text-slate-500">
                          <span>
                            {language === "uk"
                              ? `Завершити Коло ${roundNum} (натисніть «Почати тренування»)`
                              : language === "en"
                              ? `Finish Round ${roundNum} (press 'Start Workout')`
                              : `Завершить Круг ${roundNum} (нажмите «Начать тренировку»)`}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {language === "uk"
                              ? `Завершити Коло ${roundNum} (1А + 1Б) → Відпочинок ${defaultRestSeconds}с`
                              : language === "en"
                              ? `Finish Round ${roundNum} (1A + 1B) → Rest ${defaultRestSeconds}s`
                              : `Завершить Круг ${roundNum} (1А + 1Б) → Отдых ${defaultRestSeconds}с`}
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
