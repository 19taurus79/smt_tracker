"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Calendar } from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { WorkoutCard } from "@/components/program/WorkoutCard";
import { WorkoutReportModal } from "@/components/program/WorkoutReportModal";
import { InitialSetupModal } from "@/components/program/InitialSetupModal";
import { PrepCalculatorModal } from "@/components/prep/PrepCalculatorModal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function ProgramPage() {
  const router = useRouter();
  const { workouts, restartWorkout, startWorkout } = useWorkoutStore();
  const { t, language } = useTranslation();
  const [selectedMkc, setSelectedMkc] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isPrepCalcOpen, setIsPrepCalcOpen] = useState(false);
  const [selectedReportWorkout, setSelectedReportWorkout] = useState<WorkoutSession | null>(null);
  const [mounted, setMounted] = useState(false);

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

  const mkcWorkouts =
    selectedMkc === "all"
      ? workouts
      : workouts.filter((w) => w.microcycle === selectedMkc);

  const upcomingWorkouts = mkcWorkouts.filter((w) => w.status !== "completed");
  const completedWorkouts = mkcWorkouts.filter((w) => w.status === "completed");

  const totalCompleted = workouts.filter((w) => w.status === "completed").length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Header & Generator Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-400" />
            <span>{t.program.title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.program.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold"
            onClick={() => setIsPrepCalcOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-cyan-400" />
            <span>
              {language === "uk"
                ? "Калькулятор старту"
                : language === "en"
                ? "Start Calculator"
                : "Калькулятор старта"}
            </span>
          </Button>

          <Button
            variant="accent"
            size="sm"
            className="font-bold text-xs"
            onClick={() => setIsSetupOpen(true)}
          >
            <span>{t.program.setupButton}</span>
          </Button>
        </div>
      </div>

      {/* Row 1: Status Filter Tabs (All / Upcoming / Completed) */}
      <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "all"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "uk" ? "Всі" : language === "en" ? "All" : "Все"} ({mkcWorkouts.length})
        </button>

        <button
          onClick={() => setStatusFilter("upcoming")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "upcoming"
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "uk" ? "До виконання" : language === "en" ? "Upcoming" : "К выполнению"} ({upcomingWorkouts.length})
        </button>

        <button
          onClick={() => setStatusFilter("completed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "completed"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "uk" ? "Завершені" : language === "en" ? "Completed" : "Завершенные"} ({completedWorkouts.length})
        </button>
      </div>

      {/* Row 2: Microcycle Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedMkc("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMkc === "all"
              ? "bg-white/15 text-white border border-white/20 shadow-sm"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {t.program.tabAll}
        </button>

        {[1, 2, 3, 4].map((mkcNum) => (
          <button
            key={mkcNum}
            onClick={() => setSelectedMkc(mkcNum)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedMkc === mkcNum
                ? "bg-white/15 text-white border border-white/20 shadow-sm"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {mkcNum === 1
              ? t.program.tabMkc1
              : mkcNum === 2
              ? t.program.tabMkc2
              : mkcNum === 3
              ? t.program.tabMkc3
              : t.program.tabMkc4}
          </button>
        ))}
      </div>

      {/* SECTION 1: UPCOMING WORKOUTS (Priority at the top) */}
      {(statusFilter === "all" || statusFilter === "upcoming") && upcomingWorkouts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>⚡️</span>
              <span>
                {language === "uk"
                  ? `До виконання (${upcomingWorkouts.length})`
                  : language === "en"
                  ? `Upcoming Sessions (${upcomingWorkouts.length})`
                  : `К выполнению (${upcomingWorkouts.length})`}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upcomingWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onOpenReport={(w) => setSelectedReportWorkout(w)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: COMPLETED WORKOUTS (Organized cleanly at the bottom) */}
      {(statusFilter === "all" || statusFilter === "completed") && completedWorkouts.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1 border-t border-white/5 pt-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>✅</span>
              <span>
                {language === "uk"
                  ? `Завершені тренування (${completedWorkouts.length})`
                  : language === "en"
                  ? `Completed Sessions (${completedWorkouts.length})`
                  : `Завершенные тренировки (${completedWorkouts.length})`}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 opacity-90">
            {completedWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onOpenReport={(w) => setSelectedReportWorkout(w)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {mkcWorkouts.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs">
          {t.workout.noWorkoutsAvailable}
        </div>
      )}

      {/* Modals */}
      <InitialSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
      <PrepCalculatorModal open={isPrepCalcOpen} onOpenChange={setIsPrepCalcOpen} />
      <WorkoutReportModal
        open={Boolean(selectedReportWorkout)}
        onOpenChange={(open) => !open && setSelectedReportWorkout(null)}
        workout={selectedReportWorkout}
        onRestart={(workoutId) => {
          setSelectedReportWorkout(null);
          startWorkout(workoutId);
          router.push(`/workout?id=${workoutId}`);
        }}
      />
    </div>
  );
}
