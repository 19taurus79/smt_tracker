"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Calendar } from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { WorkoutCard } from "@/components/program/WorkoutCard";
import { WorkoutReportModal } from "@/components/program/WorkoutReportModal";
import { InitialSetupModal } from "@/components/program/InitialSetupModal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function ProgramPage() {
  const router = useRouter();
  const { workouts, restartWorkout, startWorkout } = useWorkoutStore();
  const { t } = useTranslation();
  const [selectedMkc, setSelectedMkc] = useState<number | "all">("all");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
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

  const filteredWorkouts =
    selectedMkc === "all"
      ? workouts
      : workouts.filter((w) => w.microcycle === selectedMkc);

  const completedCount = workouts.filter((w) => w.status === "completed").length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
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

        <Button
          variant="accent"
          size="sm"
          className="font-bold self-start sm:self-auto"
          onClick={() => setIsSetupOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          <span>{t.program.setupButton}</span>
        </Button>
      </div>

      {/* Microcycle Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedMkc("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMkc === "all"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {t.program.tabAll} ({workouts.length})
        </button>

        <button
          onClick={() => setSelectedMkc(1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMkc === 1
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {t.program.tabMkc1}
        </button>

        <button
          onClick={() => setSelectedMkc(2)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMkc === 2
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {t.program.tabMkc2}
        </button>

        <button
          onClick={() => setSelectedMkc(3)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMkc === 3
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {t.program.tabMkc3}
        </button>

        <button
          onClick={() => setSelectedMkc(4)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMkc === 4
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {t.program.tabMkc4}
        </button>
      </div>

      {/* Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onOpenReport={(w) => setSelectedReportWorkout(w)}
          />
        ))}
      </div>

      {/* Modals */}
      <InitialSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
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
