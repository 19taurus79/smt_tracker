"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Pause,
  Timer,
  CheckCircle,
  Flame,
  RotateCcw,
  Trophy,
  FileText,
  Eye,
  ArrowLeft,
  Sun,
  SunDim,
} from "lucide-react";
import Link from "next/link";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { wakeLockManager } from "@/lib/wakeLock/wakeLock";
import { formatTime, cn } from "@/lib/utils";
import { SupersetCard } from "@/components/workout/SupersetCard";
import { WarmupModal } from "@/components/workout/WarmupModal";
import { FinishModal } from "@/components/workout/FinishModal";
import { WorkoutReportModal } from "@/components/program/WorkoutReportModal";
import { ConfirmResetModal } from "@/components/workout/ConfirmResetModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { formatWorkoutTitle } from "@/lib/i18n/exercises";

function WorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");
  const { t, language } = useTranslation();

  const {
    workouts,
    activeWorkoutId,
    viewingWorkoutId,
    workoutElapsedSeconds,
    isStopwatchRunning,
    startWorkout,
    pauseStopwatch,
    resumeStopwatch,
    tickStopwatch,
    openWarmupModal,
    setViewingWorkoutId,
    finishWorkout,
  } = useWorkoutStore();

  const {
    keepScreenAwake,
    setKeepScreenAwake,
    defaultRestSeconds,
    weightIncrementKg,
    soundEnabled,
    hapticsEnabled,
  } = useSettingsStore();

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [wasReportSentToCoach, setWasReportSentToCoach] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize target workout from URL query if present
  useEffect(() => {
    if (queryId && queryId !== viewingWorkoutId) {
      setViewingWorkoutId(queryId);
    }
  }, [queryId, viewingWorkoutId, setViewingWorkoutId]);

  // Global stopwatch tick
  useEffect(() => {
    if (!isStopwatchRunning) return;

    const interval = setInterval(() => {
      tickStopwatch();
    }, 1000);

    return () => clearInterval(interval);
  }, [isStopwatchRunning, tickStopwatch]);

  const targetId = queryId || viewingWorkoutId || activeWorkoutId;
  const currentWorkout =
    workouts.find((w) => w.id === targetId) ||
    workouts.find((w) => w.id === activeWorkoutId) ||
    workouts.find((w) => w.status === "in_progress") ||
    workouts.find((w) => w.status === "upcoming") ||
    workouts[0];

  const isCurrentActive =
    !!currentWorkout &&
    activeWorkoutId === currentWorkout.id &&
    currentWorkout.status === "in_progress";
  const isCompleted = currentWorkout?.status === "completed";
  const isUpcoming = !isCurrentActive && !isCompleted;

  // Manage Screen Wake Lock (unconditional hook)
  useEffect(() => {
    const isRunning = isCurrentActive && isStopwatchRunning && keepScreenAwake;
    if (isRunning) {
      wakeLockManager.acquire();
    } else {
      wakeLockManager.release();
    }

    return () => {
      wakeLockManager.release();
    };
  }, [isCurrentActive, isStopwatchRunning, keepScreenAwake]);

  if (!mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!currentWorkout) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{t.workout.noWorkoutsAvailable}</p>
        <Link href="/program">
          <Button variant="outline" className="mt-4 text-xs">
            {t.workout.goToProgram}
          </Button>
        </Link>
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

  const handleOpenFinishModal = () => {
    // 1. Immediately pause stopwatch & finalize workout in store so it is NEVER left running in background!
    const effectiveDuration = workoutElapsedSeconds || currentWorkout.durationSeconds || 1;
    finishWorkout(
      "",
      undefined,
      weightIncrementKg,
      soundEnabled,
      hapticsEnabled,
      effectiveDuration,
      currentWorkout.id
    );
    // 2. Open finish modal for review, progression, tags, challenge & stories
    setIsFinishModalOpen(true);
  };

  const handleStartThisWorkout = () => {
    // Proactively guide the athlete through joint mobility & ramp-up sets before starting SMT timer
    openWarmupModal();
  };

  const previewNoticeTitle =
    language === "uk"
      ? "Режим попереднього ознайомлення"
      : language === "en"
      ? "Preview & Preparation Mode"
      : "Режим предварительного ознакомления";

  const previewNoticeDesc =
    language === "uk"
      ? "Ознайомтеся зі схемами та робочими вагами. Виконайте розминку та натисніть «Почати», щоб увімкнути секундомір і фіксувати підходи."
      : language === "en"
      ? "Review target weights and structure. Complete warmup, then click 'Start' to begin the stopwatch and log sets."
      : "Ознакомьтесь со схемами и рабочими весами. Выполните разминку и нажмите «Начать», чтобы включить секундомер и активировать фиксацию подходов.";

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sticky Compact Workout Dashboard Header */}
      <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/95 p-2 sm:p-3.5 backdrop-blur-xl shadow-xl sticky top-[calc(var(--tma-top-padding,44px)+0.25rem)] z-30">
        {/* ROW 1: Stopwatch / Controls on left, Primary Action (Finish / Start) on right */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Stopwatch & utilities */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Stopwatch pill */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2 py-1 border border-white/10 shrink-0">
              <Timer
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isCurrentActive && isStopwatchRunning
                    ? "text-emerald-400 animate-pulse"
                    : isCompleted
                    ? "text-cyan-400"
                    : "text-slate-500"
                )}
              />
              <span className="font-mono text-xs sm:text-base font-black text-white">
                {formatTime(
                  isCompleted
                    ? currentWorkout.durationSeconds || 0
                    : isCurrentActive
                    ? workoutElapsedSeconds
                    : 0
                )}
              </span>
            </div>

            {/* Play / Pause Stopwatch (Only during active session) */}
            {isCurrentActive && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg shrink-0"
                onClick={() =>
                  isStopwatchRunning ? pauseStopwatch() : resumeStopwatch()
                }
                title={isStopwatchRunning ? t.workout.pause : t.workout.resume}
              >
                {isStopwatchRunning ? (
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-emerald-400 fill-current" />
                )}
              </Button>
            )}

            {/* Screen Wake Lock Toggle (during active workout) */}
            {isCurrentActive && wakeLockManager.isSupported() && (
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg shrink-0 border-white/10 transition-colors",
                  keepScreenAwake
                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
                onClick={() => setKeepScreenAwake(!keepScreenAwake)}
                title={keepScreenAwake ? t.workout.screenAwakeActive : t.workout.screenAwakeDisabled}
              >
                {keepScreenAwake ? (
                  <Sun className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <SunDim className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>

          {/* Right: Primary Action Button (Finish / Start / Report) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isCurrentActive && (
              <Button
                variant="accent"
                size="sm"
                className="h-8 px-3 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25"
                onClick={handleOpenFinishModal}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1 shrink-0 text-slate-950" />
                <span>{t.workout.finish}</span>
              </Button>
            )}

            {isUpcoming && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openWarmupModal}
                  className="h-8 px-2.5 text-xs font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <Flame className="h-3.5 w-3.5 mr-1 text-amber-400 shrink-0" />
                  <span>{t.workout.warmup}</span>
                </Button>

                <Button
                  variant="accent"
                  size="sm"
                  className="h-8 px-3 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25"
                  onClick={handleStartThisWorkout}
                >
                  <Play className="h-3.5 w-3.5 mr-1 fill-current text-slate-950" />
                  <span>{t.workout.start}</span>
                </Button>
              </div>
            )}

            {isCompleted && (
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setIsReportOpen(true)}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span>{t.dashboard.viewReport}</span>
              </Button>
            )}
          </div>
        </div>

        {/* ROW 2: Progress Bar of sets */}
        <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>
              {t.dashboard.progress}:{" "}
              <strong className="text-emerald-400">
                {completedSets} / {totalSets}
              </strong>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">
              {Math.round((completedSets / (totalSets || 1)) * 100)}%
            </span>
          </div>
          <Progress value={completedSets} max={totalSets} className="h-1.5" />
        </div>
      </div>

      {/* Workout Info Title & Mode Badge */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-black text-white">
              {formatWorkoutTitle(
                currentWorkout.workoutNumber,
                currentWorkout.microcycle,
                currentWorkout.week,
                language
              )}
            </h1>
            <Badge
              variant={
                isCompleted
                  ? "success"
                  : isCurrentActive
                  ? "warning"
                  : "outline"
              }
              className="text-[10px] sm:text-xs"
            >
              {isCompleted
                ? t.program.statusCompleted
                : isCurrentActive
                ? t.program.statusInProgress
                : t.dashboard.viewPlan}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t.common.microcycle} {currentWorkout.microcycle} • {t.common.week} {currentWorkout.week} • {t.story.labels.restBetweenSets}
          </p>
        </div>

        <Link href="/program">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-white h-8 px-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            <span>{t.nav.program}</span>
          </Button>
        </Link>
      </div>

      {/* Informational Banner for Upcoming (Preview) Mode */}
      {isUpcoming && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {previewNoticeTitle}
              </div>
              <div className="text-[11px] text-slate-300">
                {previewNoticeDesc}
              </div>
            </div>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={handleStartThisWorkout}
            className="font-bold text-xs shrink-0 h-9 hidden sm:flex items-center gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{t.workout.start}</span>
          </Button>
        </div>
      )}

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

      {/* Bottom Action Bar depending on state */}
      {isCompleted ? (
        <div className="pt-2 pb-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="default"
            size="lg"
            className="flex-1 font-bold text-xs sm:text-sm px-3 py-3 shadow-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 text-center"
            onClick={() => setIsReportOpen(true)}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>{t.dashboard.viewReport}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="font-semibold text-xs sm:text-sm px-3 py-3 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 text-center"
            onClick={() => setIsResetConfirmOpen(true)}
            title={t.workout.resetConfirmTitle}
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>{t.workout.resetSession}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="sm:flex-1 font-bold text-xs sm:text-sm px-3 py-3 border-white/20 hover:bg-white/10 text-white flex items-center justify-center gap-2 text-center"
            onClick={() => {
              const nextUpcoming = workouts.find((w) => w.status === "upcoming");
              if (nextUpcoming) {
                setViewingWorkoutId(nextUpcoming.id);
                router.push(`/workout?id=${nextUpcoming.id}`);
              } else {
                router.push("/program");
              }
            }}
          >
            <Play className="h-4 w-4 fill-current text-emerald-400 shrink-0" />
            <span>
              {language === "uk" ? "До наступного" : language === "en" ? "To Next Workout" : "К следующей"}
            </span>
          </Button>
        </div>
      ) : isCurrentActive ? (
        <div className="pt-2 pb-2 flex flex-col gap-2.5">
          <Button
            variant="accent"
            size="lg"
            className="w-full font-black text-xs sm:text-sm px-3 py-3 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 text-center leading-snug"
            onClick={handleOpenFinishModal}
          >
            <Trophy className="h-4 w-4 shrink-0" />
            <span>{t.workout.finish}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-xs text-slate-400 hover:text-rose-400 h-9"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span>{t.workout.resetSession}</span>
          </Button>
        </div>
      ) : (
        /* isUpcoming (Preview Mode Bottom Action) */
        <div className="pt-2 pb-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="accent"
            size="lg"
            className="flex-1 font-black text-xs sm:text-sm px-4 py-3.5 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 text-center leading-snug bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950"
            onClick={handleStartThisWorkout}
          >
            <Flame className="h-4 w-4 text-amber-900 fill-current shrink-0" />
            <span>{t.workout.start}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => startWorkout(currentWorkout.id)}
            className="font-bold border-white/10 text-slate-400 hover:text-white px-4 py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            <span>{t.workout.skipToWorkoutDirectly}</span>
          </Button>
        </div>
      )}

      {/* Modals */}
      <WarmupModal />
      <FinishModal
        open={isFinishModalOpen}
        onOpenChange={setIsFinishModalOpen}
        workoutId={currentWorkout.id}
        onFinished={(sent) => {
          setWasReportSentToCoach(Boolean(sent));
          setIsFinishModalOpen(false);
          setIsReportOpen(true);
        }}
      />
      <WorkoutReportModal
        open={isReportOpen}
        onOpenChange={(isOpen) => {
          setIsReportOpen(isOpen);
          if (!isOpen) setWasReportSentToCoach(false);
        }}
        workout={currentWorkout}
        initialSentToCoach={wasReportSentToCoach}
        onRestart={(workoutId) => {
          setIsReportOpen(false);
          startWorkout(workoutId);
        }}
      />
      <ConfirmResetModal
        open={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        workout={currentWorkout}
        onConfirmReset={() => {
          setIsResetConfirmOpen(false);
          router.push(`/workout?id=${currentWorkout.id}`);
        }}
      />
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[70vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <WorkoutContent />
    </Suspense>
  );
}
