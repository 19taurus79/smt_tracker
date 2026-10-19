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
  FileText,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { formatTime, cn } from "@/lib/utils";
import { SupersetCard } from "@/components/workout/SupersetCard";
import { WarmupModal } from "@/components/workout/WarmupModal";
import { FinishModal } from "@/components/workout/FinishModal";
import { WorkoutReportModal } from "@/components/program/WorkoutReportModal";
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
    restartWorkout,
    pauseStopwatch,
    resumeStopwatch,
    tickStopwatch,
    cancelWorkout,
    openWarmupModal,
  } = useWorkoutStore();

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleOpenFinishModal = () => {
    pauseStopwatch();
    setIsFinishModalOpen(true);
  };

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
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5">
            {/* Stopwatch pill */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2 sm:px-2.5 py-1 border border-white/10 shrink-0">
              <Timer
                className={cn(
                  "h-3.5 w-3.5 text-emerald-400 shrink-0",
                  !isCompleted && isStopwatchRunning && "animate-pulse"
                )}
              />
              <span className="font-mono text-xs sm:text-base font-black text-white">
                {formatTime(
                  isCompleted
                    ? currentWorkout.durationSeconds || 0
                    : workoutElapsedSeconds
                )}
              </span>
            </div>

            {/* Play / Pause Stopwatch */}
            {!isCompleted && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg shrink-0"
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

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={openWarmupModal}
              className="h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              <Flame className="h-3.5 w-3.5 mr-1 text-amber-400 shrink-0" />
              <span>Разминка</span>
            </Button>

            {!isCompleted && activeWorkoutId && (
              <Button
                variant="accent"
                size="sm"
                className="h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold"
                onClick={handleOpenFinishModal}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1 shrink-0" />
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

      {/* Bottom Completion Action / Completed State Actions */}
      {isCompleted ? (
        <div className="pt-2 pb-6 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="default"
            size="lg"
            className="flex-1 font-bold text-xs sm:text-sm px-3 py-3 shadow-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 text-center"
            onClick={() => setIsReportOpen(true)}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>Открыть отчет о тренировке</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 font-bold text-xs sm:text-sm px-3 py-3 border-white/20 hover:bg-white/10 text-white flex items-center justify-center gap-2 text-center"
            onClick={() => {
              const nextUpcoming = workouts.find((w) => w.status === "upcoming");
              if (nextUpcoming) {
                startWorkout(nextUpcoming.id);
              } else {
                router.push("/program");
              }
            }}
          >
            <Play className="h-4 w-4 fill-current text-emerald-400 shrink-0" />
            <span>К следующей тренировке</span>
          </Button>
        </div>
      ) : (
        <div className="pt-2 pb-6 flex flex-col gap-2.5">
          <Button
            variant="accent"
            size="lg"
            className="w-full font-black text-xs sm:text-sm px-3 py-3 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 text-center leading-snug"
            onClick={handleOpenFinishModal}
          >
            <Trophy className="h-4 w-4 shrink-0" />
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
        onFinished={() => router.push("/program")}
      />
      <WorkoutReportModal
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        workout={currentWorkout}
        onRestart={(workoutId) => {
          restartWorkout(workoutId);
        }}
      />
    </div>
  );
}
