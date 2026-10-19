"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  Play,
  Trophy,
  Dumbbell,
  Ruler,
  TrendingUp,
  Calendar,
  Sparkles,
  Zap,
  Eye,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { formatTime, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WarmupModal } from "@/components/workout/WarmupModal";
import { InitialSetupModal } from "@/components/program/InitialSetupModal";
import { BodyLogModal } from "@/components/body/BodyLogModal";
import { WorkoutReportModal } from "@/components/program/WorkoutReportModal";
import { WorkoutSession } from "@/types/smt";

function getShortExerciseName(name: string): string {
  if (name.includes("узким")) return "Жим узким";
  if (name.includes("лежа")) return "Жим лежа";
  if (name.includes("Подтягивания") || name.includes("тяга")) return "Подтягивания";
  if (name.includes("бицепс")) return "Бицепс";
  if (name.includes("Приседания")) return "Присед";
  if (name.includes("Армейский") || name.includes("стоя")) return "Жим стоя";
  return name.split(" ")[0];
}

export default function HomePage() {
  const router = useRouter();
  const {
    workouts,
    activeWorkoutId,
    setViewingWorkoutId,
    startWorkout,
    restartWorkout,
    openWarmupModal,
  } = useWorkoutStore();

  const { measurements } = useBodyStore();

  const [mounted, setMounted] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [selectedReportWorkout, setSelectedReportWorkout] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const completedWorkouts = workouts.filter((w) => w.status === "completed");
  const completedCount = completedWorkouts.length;
  const totalTonnage = completedWorkouts.reduce(
    (acc, w) => acc + (w.tonnageKg || 0),
    0
  );
  const avgPower =
    completedWorkouts.length > 0
      ? Math.round(
          (completedWorkouts.reduce((acc, w) => acc + (w.powerKgPerMin || 0), 0) /
            completedWorkouts.length) *
            10
        ) / 10
      : 0;

  // Next workout: active one OR in-progress OR first upcoming OR last completed
  const currentOrNextWorkout =
    workouts.find((w) => w.id === activeWorkoutId) ||
    workouts.find((w) => w.status === "in_progress") ||
    workouts.find((w) => w.status === "upcoming") ||
    workouts[workouts.length - 1];

  const isHeroCompleted = currentOrNextWorkout?.status === "completed";
  const latestCompleted = completedWorkouts[completedWorkouts.length - 1];
  const latestBody = measurements[0];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Hero: Next Workout Card */}
      {currentOrNextWorkout && (
        <Card className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold">
                {activeWorkoutId
                  ? "🔥 Тренировка активна"
                  : isHeroCompleted
                  ? "🎉 Все 36 тренировок завершены"
                  : "Следующая тренировка"}
              </Badge>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                МКЦ {currentOrNextWorkout.microcycle} • #{currentOrNextWorkout.workoutNumber}/36
              </span>
            </div>
            <CardTitle className="text-lg sm:text-2xl mt-1.5 text-white font-black leading-tight">
              {currentOrNextWorkout.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-1 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {currentOrNextWorkout.supersets.map((ss) => (
                <div
                  key={ss.id}
                  className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-slate-200 text-[11px] sm:text-xs"
                >
                  <span className="text-emerald-400 font-bold">
                    {ss.label.split(":")[0]}:
                  </span>{" "}
                  {ss.exercises
                    .map(
                      (e) =>
                        `${getShortExerciseName(e.name)} (${e.sets[0]?.targetWeight} кг)`
                    )
                    .join(" + ")}
                </div>
              ))}
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              {isHeroCompleted ? (
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full flex-1 font-bold shadow-lg shadow-emerald-500/20 h-11 sm:h-13 text-sm"
                  onClick={() => setSelectedReportWorkout(currentOrNextWorkout)}
                >
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 text-amber-300" />
                  <span>Посмотреть отчет</span>
                </Button>
              ) : activeWorkoutId ? (
                <Link
                  href={`/workout?id=${activeWorkoutId}`}
                  onClick={() => setViewingWorkoutId(activeWorkoutId)}
                  className="flex-1"
                >
                  <Button variant="accent" size="lg" className="w-full font-bold shadow-lg shadow-emerald-500/20 h-11 sm:h-13 text-sm animate-pulse">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 fill-current" />
                    <span>Продолжить тренировку</span>
                  </Button>
                </Link>
              ) : (
                <Link
                  href={`/workout?id=${currentOrNextWorkout.id}`}
                  onClick={() => setViewingWorkoutId(currentOrNextWorkout.id)}
                  className="flex-1"
                >
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full font-bold shadow-lg shadow-emerald-500/20 h-11 sm:h-13 text-sm"
                  >
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                    <span>Ознакомиться с планом</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={openWarmupModal}
                className="sm:w-auto font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-500/10 h-11 sm:h-13 text-sm"
              >
                <Flame className="h-4 w-4 mr-1.5 text-amber-400" />
                <span>Разминка</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Прогресс</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {completedCount} <span className="text-xs font-normal text-slate-500">/ 36</span>
          </div>
          <Progress value={completedCount} max={36} className="mt-2 h-1.5" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Тоннаж</span>
            <Dumbbell className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {Math.round(totalTonnage)} <span className="text-xs font-normal text-slate-500">кг</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Суммарный объем</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Ср. Мощность</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {avgPower} <span className="text-xs font-normal text-slate-500">кг/м</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Плотность СМТ</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Текущий вес</span>
            <Ruler className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {latestBody ? latestBody.weightKg : "—"} <span className="text-xs font-normal text-slate-500">кг</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {latestBody ? formatDate(latestBody.date) : "Нет замеров"}
          </span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Button
          variant="outline"
          onClick={() => setIsSetupOpen(true)}
          className="h-12 sm:h-14 justify-start px-3.5 rounded-2xl border-white/10 bg-slate-900/40 hover:bg-slate-900/80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 mr-2.5 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white">1ПМ & Конструктор СМТ</div>
            <div className="text-[10px] text-slate-400">Настройка упражнений и весов</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => setIsBodyModalOpen(true)}
          className="h-12 sm:h-14 justify-start px-3.5 rounded-2xl border-white/10 bg-slate-900/40 hover:bg-slate-900/80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mr-2.5 shrink-0">
            <Ruler className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white">Внести замер тела</div>
            <div className="text-[10px] text-slate-400">Вес, талия, бицепс, грудь</div>
          </div>
        </Button>

        <Link href="/analytics" className="w-full">
          <Button
            variant="outline"
            className="h-12 sm:h-14 w-full justify-start px-3.5 rounded-2xl border-white/10 bg-slate-900/40 hover:bg-slate-900/80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mr-2.5 shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Графики и прогресс</div>
              <div className="text-[10px] text-slate-400">Тоннаж, мощность, рекомпозиция</div>
            </div>
          </Button>
        </Link>
      </div>

      {/* Latest Workout Summary if completed */}
      {latestCompleted && (
        <Card className="border-white/10 bg-slate-900/60">
          <CardHeader className="p-3.5 sm:p-5 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>Последняя завершенная тренировка</span>
              </CardTitle>
              <span className="text-[10px] sm:text-xs text-slate-400">
                {latestCompleted.completedAt ? formatDate(latestCompleted.completedAt) : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-white text-xs sm:text-sm">{latestCompleted.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Тоннаж: <strong className="text-emerald-400">{latestCompleted.tonnageKg} кг</strong> •
                  Мощность: <strong className="text-amber-400">{latestCompleted.powerKgPerMin} кг/м</strong>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 sm:h-8 font-semibold text-slate-300 hover:text-white hover:border-emerald-500/40"
                onClick={() => setSelectedReportWorkout(latestCompleted)}
              >
                <Trophy className="h-3.5 w-3.5 mr-1 text-amber-400" />
                <span>Отчет</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <WarmupModal />
      <InitialSetupModal open={isSetupOpen} onOpenChange={setIsSetupOpen} />
      <BodyLogModal open={isBodyModalOpen} onOpenChange={setIsBodyModalOpen} />
      <WorkoutReportModal
        open={Boolean(selectedReportWorkout)}
        onOpenChange={(open) => !open && setSelectedReportWorkout(null)}
        workout={selectedReportWorkout}
        onRestart={(workoutId) => {
          restartWorkout(workoutId);
          router.push("/workout");
        }}
      />
    </div>
  );
}
