"use client";

import React from "react";
import { Layers, Dumbbell, Zap, Check, ArrowDown, Timer } from "lucide-react";
import { Superset } from "@/types/smt";
import { SetRow } from "./SetRow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { cn } from "@/lib/utils";

interface SupersetCardProps {
  workoutId: string;
  superset: Superset;
}

export function SupersetCard({ workoutId, superset }: SupersetCardProps) {
  const { completeSupersetRound, updateSet } = useWorkoutStore();
  const { defaultRestSeconds, soundEnabled, hapticsEnabled } = useSettingsStore();

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
      <CardHeader className="p-4 sm:p-5 bg-white/[0.02] border-b border-white/5 space-y-3">
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
              <CardTitle className="text-base sm:text-lg">{superset.label}</CardTitle>
              {superset.description && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {superset.description}
                </p>
              )}
            </div>
          </div>

          <Badge
            variant={isAllDone ? "success" : isSingle ? "secondary" : "default"}
            className="text-xs font-bold shrink-0"
          >
            {isSingle ? "Одиночный блок" : "Суперсет"} • {completedSets}/{totalSets}
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
                    {ex1.name}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    Основное (База 40%)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-300">
                  {ex1.sets[0]?.targetWeight} кг
                </span>
                <span className="text-[10px] text-slate-400 block">
                  × {ex1.sets[0]?.targetReps} повт
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
                    {ex2.name}
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    Подсобка (30%)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-cyan-300">
                  {ex2.sets[0]?.targetWeight} кг
                </span>
                <span className="text-[10px] text-slate-400 block">
                  × {ex2.sets[0]?.targetReps} повт
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
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
                      <span>Круг {roundNum} из {roundCount}</span>
                    </span>
                    <span className="text-[11px] text-amber-400/90 font-semibold flex items-center gap-1">
                      1А → 1Б сразу без отдыха • затем отдых 30с
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
                            {ex1.name}
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            План: {set1.targetWeight} кг × {set1.targetReps}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          <input
                            type="number"
                            step="0.5"
                            value={set1.actualWeight ?? set1.targetWeight}
                            onChange={(e) =>
                              updateSet(workoutId, superset.id, ex1.exerciseId, set1.setNumber, {
                                actualWeight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-11 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">кг</span>
                        </div>

                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          <input
                            type="number"
                            value={set1.actualReps ?? set1.targetReps}
                            onChange={(e) =>
                              updateSet(workoutId, superset.id, ex1.exerciseId, set1.setNumber, {
                                actualReps: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">повт</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transition Indicator: No rest between 1A and 1B */}
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5">
                    <ArrowDown className="h-3 w-3 text-cyan-400 animate-bounce" />
                    <span>Сразу без отдыха переходим к 1Б</span>
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
                            {ex2.name}
                          </span>
                          <span className="text-[10px] text-cyan-400">
                            План: {set2.targetWeight} кг × {set2.targetReps}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          <input
                            type="number"
                            step="0.5"
                            value={set2.actualWeight ?? set2.targetWeight}
                            onChange={(e) =>
                              updateSet(workoutId, superset.id, ex2.exerciseId, set2.setNumber, {
                                actualWeight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-11 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">кг</span>
                        </div>

                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          <input
                            type="number"
                            value={set2.actualReps ?? set2.targetReps}
                            onChange={(e) =>
                              updateSet(workoutId, superset.id, ex2.exerciseId, set2.setNumber, {
                                actualReps: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">повт</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single Unified Round Completion Button */}
                  <Button
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
                      "w-full font-bold text-xs h-9 transition-all",
                      isRoundDone
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    )}
                  >
                    {isRoundDone ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        <span>Круг {roundNum} выполнен (нажмите для отмены)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        <span>Завершить Круг {roundNum} (1А + 1Б) → Отдых {defaultRestSeconds}с</span>
                      </span>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
