"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Timer,
  CheckCircle,
  Flame,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { formatTime } from "@/lib/utils";
import { SupersetCard } from "@/components/workout/SupersetCard";
import { WarmupModal } from "@/components/workout/WarmupModal";
import { FinishModal } from "@/components/workout/FinishModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function WorkoutPage() {
  const router = useRouter();
  const {
    workouts,
    activeWorkoutId,
    workoutElapsedSeconds,
    isStopwatchRunning,
    startWorkout,
    pauseStopwatch,
    resumeStopwatch,
    tickStopwatch,
    cancelWorkout,
    openWarmupModal,
  } = useWorkoutStore();

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global stopwatch tick
  useEffect(() => {
    if (!isStopwatchRunning) return;

    const interval = setInterval(() => {
      tickStopwatch();
    }, 1000);

    return () => clearInterval(interval);
  }, [isStopwatchRunning, tickStopwatch]);

  if (!mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Find active or upcoming workout
  const currentWorkout =
    workouts.find((w) => w.id === activeWorkoutId) ||
    workouts.find((w) => w.status === "in_progress") ||
    workouts.find((w) => w.status === "upcoming") ||
    workouts[0];

  if (!currentWorkout) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Нет доступных тренировок.</p>
      </div>
    );
  }

  // Calculate overall set progress for this workout
  let totalSets = 0;
  let completedSets = 0;
  for (const ss of currentWorkout.supersets) {
    for (const ex of ss.exercises) {
      totalSets += ex.sets.length;
      completedSets += ex.sets.filter((s) => s.completed).length;
    }
  }

  const isCompleted = currentWorkout.status === "completed";

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sticky Compact Workout Dashboard Header */}
      <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/90 p-2.5 sm:p-4 backdrop-blur-xl shadow-xl sticky top-14 sm:top-16 z-30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Stopwatch pill */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 border border-white/10">
              <Timer className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {formatTime(workoutElapsedSeconds)}
              </span>
            </div>

            {/* Play / Pause Stopwatch */}
            {!isCompleted && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() =>
                  isStopwatchRunning ? pauseStopwatch() : resumeStopwatch()
                }
                title={isStopwatchRunning ? "Пауза секундомера" : "Продолжить"}
              >
                {isStopwatchRunning ? (
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-emerald-400 fill-current" />
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={openWarmupModal}
              className="h-8 px-2.5 text-xs font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              <Flame className="h-3.5 w-3.5 mr-1 text-amber-400" />
              <span>Разминка</span>
            </Button>

            {!isCompleted && activeWorkoutId && (
              <Button
                variant="accent"
                size="sm"
                className="h-8 px-3 text-xs font-bold"
                onClick={() => setIsFinishModalOpen(true)}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                <span>Завершить</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar of sets */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>
              Прогресс подходов:{" "}
              <strong className="text-emerald-400">
                {completedSets} из {totalSets}
              </strong>
            </span>
            <span className="font-mono text-slate-400">
              {Math.round((completedSets / (totalSets || 1)) * 100)}%
            </span>
          </div>
          <Progress value={completedSets} max={totalSets} className="h-1.5" />
        </div>
      </div>

      {/* Workout Info Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-white">
              {currentWorkout.title}
            </h1>
            <Badge
              variant={isCompleted ? "success" : "secondary"}
              className="text-[10px] sm:text-xs"
            >
              {isCompleted ? "Завершена" : "Активна"}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Микроцикл {currentWorkout.microcycle} • Отдых между подходами: 30 секунд
          </p>
        </div>

        {!activeWorkoutId && !isCompleted && (
          <Button
            variant="default"
            size="sm"
            onClick={() => startWorkout(currentWorkout.id)}
            className="text-xs font-bold h-8"
          >
            <Play className="h-3.5 w-3.5 mr-1 fill-current" />
            <span>Начать</span>
          </Button>
        )}
      </div>

      {/* Supersets List */}
      <div className="space-y-3.5">
        {currentWorkout.supersets.map((superset) => (
          <SupersetCard
            key={superset.id}
            workoutId={currentWorkout.id}
            superset={superset}
          />
        ))}
      </div>

      {/* Bottom Completion Action */}
      {!isCompleted && (
        <div className="pt-2 pb-6 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="accent"
            size="lg"
            className="flex-1 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 h-12"
            onClick={() => setIsFinishModalOpen(true)}
          >
            <Trophy className="h-5 w-5 mr-2" />
            <span>Завершить тренировку и рассчитать мощность</span>
          </Button>

          {activeWorkoutId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelWorkout}
              className="text-xs text-slate-400 hover:text-rose-400 h-9"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              <span>Сбросить текущую сессию</span>
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <WarmupModal />
      <FinishModal
        open={isFinishModalOpen}
        onOpenChange={setIsFinishModalOpen}
        onFinished={() => router.push("/analytics")}
      />
    </div>
  );
}
