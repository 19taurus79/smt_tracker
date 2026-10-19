"use client";

import React from "react";
import { Layers, Dumbbell, Zap } from "lucide-react";
import { Superset } from "@/types/smt";
import { SetRow } from "./SetRow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SupersetCardProps {
  workoutId: string;
  superset: Superset;
}

export function SupersetCard({ workoutId, superset }: SupersetCardProps) {
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

        {/* For supersets: Prominent banner showing BOTH distinct weights & targets! */}
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
          /* Superset: paired round-by-round alternating execution */
          <div className="space-y-4">
            {Array.from({ length: roundCount }).map((_, roundIdx) => {
              const set1 = ex1.sets[roundIdx];
              const set2 = ex2.sets[roundIdx];

              return (
                <div
                  key={`round-${roundIdx}`}
                  className="rounded-2xl border border-white/5 bg-slate-950/30 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>Круг {roundIdx + 1} из {roundCount}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      А → Б без отдыха, затем 30с
                    </span>
                  </div>

                  {set1 && (
                    <SetRow
                      workoutId={workoutId}
                      supersetId={superset.id}
                      exerciseId={ex1.exerciseId}
                      set={set1}
                      exerciseName={ex1.name}
                      exerciseCategory="main"
                      roundBadge={`${roundIdx + 1}А`}
                      isSupersetRow={true}
                    />
                  )}

                  {set2 && (
                    <SetRow
                      workoutId={workoutId}
                      supersetId={superset.id}
                      exerciseId={ex2.exerciseId}
                      set={set2}
                      exerciseName={ex2.name}
                      exerciseCategory="accessory"
                      roundBadge={`${roundIdx + 1}Б`}
                      isSupersetRow={true}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
