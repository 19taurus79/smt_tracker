"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Play, ChevronRight, FileText, Eye } from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { formatTime } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  getLocalizedExerciseName,
  formatWorkoutTitle,
} from "@/lib/i18n/exercises";

import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { calculateAthleticScore, getTierColor, getTierLabel } from "@/lib/scoring/athleticScore";

interface WorkoutCardProps {
  workout: WorkoutSession;
  onStart?: () => void;
  onOpenReport?: (workout: WorkoutSession) => void;
}

export function WorkoutCard({ workout, onStart, onOpenReport }: WorkoutCardProps) {
  const { setViewingWorkoutId, activeWorkoutId } = useWorkoutStore();
  const { gender, userAge } = useSettingsStore();
  const { measurements } = useBodyStore();
  const { t, language } = useTranslation();

  const isCurrentActive = activeWorkoutId === workout.id;
  const isCompleted = workout.status === "completed";

  const scoreResult = isCompleted
    ? calculateAthleticScore({
        tonnageKg: workout.tonnageKg || 0,
        durationSeconds: workout.durationSeconds || 45 * 60,
        bodyWeightKg: measurements[0]?.weightKg || 80,
        gender,
        age: userAge,
        workout,
      })
    : null;
  const tierColor = scoreResult ? getTierColor(scoreResult.tierKey) : null;
  const tierLabel = scoreResult ? getTierLabel(scoreResult.tierKey, t) : null;

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
                {formatWorkoutTitle(
                  workout.workoutNumber,
                  workout.microcycle,
                  workout.week,
                  language
                )}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                {t.common.microcycle} {workout.microcycle} • {t.common.week} {workout.week}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isCompleted && scoreResult && tierColor && (
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${tierColor.border} ${tierColor.bg} ${tierColor.text} shadow-sm`}
                title={`${t.scoring.athleticScoreLabel}: ${scoreResult.score}/100 (${tierLabel})`}
              >
                ⚡ {scoreResult.score}
              </span>
            )}
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
                ? t.program.statusCompleted
                : isCurrentActive
                ? t.program.statusInProgress
                : t.program.statusUpcoming}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5 pt-0 space-y-2.5">
        {/* Exercise Preview Chips with smart localized short names */}
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
                      `${getLocalizedExerciseName(e.name, language, true)} (${e.sets[0]?.targetWeight} ${t.common.kg})`
                  )
                  .join(" + ")}
              </span>
            </div>
          ))}
        </div>

        {/* Stats Row if Completed */}
        {isCompleted && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
            <span>
              {t.common.tonnage}: <strong className="text-white">{workout.tonnageKg ?? 0} {t.common.kg}</strong>
            </span>
            <span>
              {t.common.density}: <strong className="text-white">{workout.powerKgPerMin ?? 0} {t.common.kg}/{t.common.min}</strong>
            </span>
            <span>
              {t.common.time}: <strong className="text-white">{formatTime(workout.durationSeconds ?? 0)}</strong>
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1 flex gap-2">
          {isCompleted ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold border-white/10 hover:border-emerald-500/40"
              onClick={() => onOpenReport?.(workout)}
            >
              <FileText className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              <span>{t.dashboard.viewReport}</span>
            </Button>
          ) : isCurrentActive ? (
            <Link
              href={`/workout?id=${workout.id}`}
              onClick={() => setViewingWorkoutId(workout.id)}
              className="w-full"
            >
              <Button
                variant="accent"
                size="sm"
                className="w-full text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                <Play className="h-3.5 w-3.5 mr-1 fill-current" />
                <span>{t.workout.resume}</span>
              </Button>
            </Link>
          ) : (
            <Link
              href={`/workout?id=${workout.id}`}
              onClick={() => setViewingWorkoutId(workout.id)}
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold border-white/10 hover:border-emerald-500/40"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                <span>{t.program.viewWorkout}</span>
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
