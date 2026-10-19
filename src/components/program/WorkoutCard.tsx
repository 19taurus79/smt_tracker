"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Play, ChevronRight, FileText } from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { formatTime } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WorkoutCardProps {
  workout: WorkoutSession;
  onStart?: () => void;
  onOpenReport?: (workout: WorkoutSession) => void;
}

function getShortExerciseName(name: string): string {
  if (name.includes("узким")) return "Жим узким";
  if (name.includes("лежа")) return "Жим лежа";
  if (name.includes("Подтягивания") || name.includes("тяга")) return "Подтягивания";
  if (name.includes("бицепс")) return "Бицепс";
  if (name.includes("Приседания")) return "Присед";
  if (name.includes("Армейский") || name.includes("стоя")) return "Жим стоя";
  return name.split(" ")[0];
}

export function WorkoutCard({ workout, onStart, onOpenReport }: WorkoutCardProps) {
  const { startWorkout, activeWorkoutId } = useWorkoutStore();

  const isCurrentActive = activeWorkoutId === workout.id;
  const isCompleted = workout.status === "completed";

  const handleStart = () => {
    startWorkout(workout.id);
    if (onStart) onStart();
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isCurrentActive
          ? "border-emerald-500/60 bg-emerald-950/20 shadow-emerald-500/10 shadow-lg"
          : isCompleted
          ? "border-white/10 bg-slate-900/50 opacity-90"
          : "border-white/10 bg-slate-900/70 hover:border-white/20"
      }`}
    >
      <CardHeader className="p-3.5 sm:p-5 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white/10 font-black text-xs text-emerald-400">
              #{workout.workoutNumber}
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                {workout.title}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Микроцикл {workout.microcycle} • Неделя {workout.week}
              </p>
            </div>
          </div>

          <Badge
            variant={
              isCompleted
                ? "success"
                : isCurrentActive
                ? "warning"
                : "outline"
            }
            className="text-[10px] sm:text-xs shrink-0"
          >
            {isCompleted
              ? "Завершена"
              : isCurrentActive
              ? "В процессе"
              : "Запланирована"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5 pt-0 space-y-2.5">
        {/* Exercise Preview Chips with smart short names */}
        <div className="flex flex-wrap gap-1 text-[11px]">
          {workout.supersets.map((ss) => (
            <div
              key={ss.id}
              className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/5 px-2 py-0.5 text-slate-300"
            >
              <span className="font-semibold text-white">
                {ss.exercises
                  .map(
                    (e) =>
                      `${getShortExerciseName(e.name)} (${e.sets[0]?.targetWeight} кг)`
                  )
                  .join(" + ")}
              </span>
            </div>
          ))}
        </div>

        {/* Stats Row if Completed */}
        {isCompleted && (workout.tonnageKg !== undefined || workout.completedAt) && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[10px] sm:text-[11px] text-slate-400">
            <div>
              Тоннаж: <strong className="text-emerald-400">{workout.tonnageKg || 0} кг</strong>
            </div>
            <div>
              Время: <strong className="text-cyan-400">{formatTime(workout.durationSeconds || 0)}</strong>
            </div>
            <div>
              Мощность: <strong className="text-amber-400">{workout.powerKgPerMin || 0} кг/м</strong>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1 flex justify-end">
          {isCompleted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenReport?.(workout)}
              className="h-7 sm:h-8 text-xs font-semibold text-slate-300 hover:text-white hover:border-emerald-500/40"
            >
              <FileText className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              <span>Открыть отчет</span>
            </Button>
          ) : isCurrentActive ? (
            <Link href="/workout">
              <Button variant="default" size="sm" className="h-7 sm:h-8 text-xs font-bold animate-pulse">
                <Play className="h-3.5 w-3.5 mr-1 fill-current" />
                <span>Продолжить тренировку</span>
              </Button>
            </Link>
          ) : (
            <Link href="/workout" onClick={handleStart}>
              <Button variant="outline" size="sm" className="h-7 sm:h-8 text-xs font-semibold hover:border-emerald-500/50 hover:text-emerald-400">
                <Play className="h-3.5 w-3.5 mr-1" />
                <span>Начать</span>
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
