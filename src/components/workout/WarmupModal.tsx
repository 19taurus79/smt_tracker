"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Flame,
  ArrowRight,
  Dumbbell,
  Activity,
  Play,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedWarmupList, getLocalizedExerciseName } from "@/lib/i18n/exercises";
import { generateWorkoutWarmupPlan } from "@/lib/smt/rampUpCalculator";

export function WarmupModal() {
  const {
    isWarmupModalOpen,
    closeWarmupModal,
    warmupItems,
    toggleWarmupItem,
    completeWarmupAndStart,
    workouts,
    activeWorkoutId,
    viewingWorkoutId,
  } = useWorkoutStore();
  const { weightIncrementKg } = useSettingsStore();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<"mobility" | "ramp_up">("mobility");
  const [completedRampSets, setCompletedRampSets] = useState<Record<string, boolean>>({});

  // Target workout for today's session
  const currentWorkout = useMemo(() => {
    const targetId = viewingWorkoutId || activeWorkoutId;
    return (
      workouts.find((w) => w.id === targetId) ||
      workouts.find((w) => w.status === "in_progress") ||
      workouts.find((w) => w.status === "upcoming") ||
      workouts[0] ||
      null
    );
  }, [workouts, viewingWorkoutId, activeWorkoutId]);

  // Localized Joint Mobility Items
  const localizedMobilityItems = useMemo(() => {
    const list = getLocalizedWarmupList(language);
    return list.map((item) => {
      const stored = warmupItems.find((w) => w.id === item.id);
      return {
        ...item,
        completed: stored?.completed ?? false,
      };
    });
  }, [warmupItems, language]);

  // Calculated Ramp-up Plans for Today's Exercises
  const rampUpPlans = useMemo(() => {
    return generateWorkoutWarmupPlan(currentWorkout, weightIncrementKg || 2.5);
  }, [currentWorkout, weightIncrementKg]);

  const completedMobilityCount = localizedMobilityItems.filter((i) => i.completed).length;
  const totalMobilityCount = localizedMobilityItems.length;

  const totalRampSetsCount = rampUpPlans.reduce((sum, p) => sum + p.sets.length, 0);
  const completedRampSetsCount = Object.values(completedRampSets).filter(Boolean).length;

  const toggleRampSet = (setId: string) => {
    setCompletedRampSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  const workoutNumber = currentWorkout?.workoutNumber || 1;
  const microcycle = currentWorkout?.microcycle || 1;

  return (
    <Dialog open={isWarmupModalOpen} onOpenChange={closeWarmupModal} className="max-w-xl">
      <DialogHeader>
        <DialogTitle onClose={closeWarmupModal}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">
                  {activeTab === "mobility" ? t.workout.warmupTitle : t.workout.rampUpTitle}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  #{workoutNumber} (МКЦ-{microcycle})
                </span>
              </div>
              <span className="text-xs text-slate-400 block font-normal truncate mt-0.5">
                {activeTab === "mobility" ? t.workout.warmupDesc : t.workout.rampUpDesc}
              </span>
            </div>
          </div>
        </DialogTitle>
      </DialogHeader>

      {/* Modern 2-Step Segmented Navigation Pills */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 my-1">
        <button
          type="button"
          onClick={() => setActiveTab("mobility")}
          className={`h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "mobility"
              ? "bg-white/15 text-white shadow-md border border-white/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-amber-400" />
          <span>{t.workout.jointMobilityTab}</span>
          <span className="text-[10px] font-mono opacity-80">
            ({completedMobilityCount}/{totalMobilityCount})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ramp_up")}
          className={`h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "ramp_up"
              ? "bg-emerald-500/20 text-emerald-300 shadow-md border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
          <span>{t.workout.rampUpTab}</span>
          {rampUpPlans.length > 0 && (
            <span className="text-[10px] font-mono opacity-80">
              ({rampUpPlans.length})
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: JOINT MOBILITY */}
      {activeTab === "mobility" && (
        <div className="space-y-3.5 my-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-300 px-1">
            <span className="font-medium text-slate-400">Прогрес суглобової підготовки:</span>
            <span className="font-mono font-bold text-emerald-400">
              {completedMobilityCount} з {totalMobilityCount} вправ
            </span>
          </div>
          <Progress value={completedMobilityCount} max={totalMobilityCount} className="h-2" />

          <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-none pr-1">
            {localizedMobilityItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleWarmupItem(item.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  item.completed
                    ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                    : "bg-slate-900/50 border-white/5 hover:border-white/15 text-slate-300"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-xs sm:text-sm font-semibold leading-tight ${
                      item.completed ? "text-emerald-300 line-through opacity-80" : "text-white"
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tab 1 Actions */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-9 text-xs text-slate-400 border-white/10 hover:text-white"
              onClick={completeWarmupAndStart}
            >
              {t.workout.skipToWorkoutDirectly}
            </Button>
            <Button
              type="button"
              variant="accent"
              className="w-full sm:flex-1 h-10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20"
              onClick={() => setActiveTab("ramp_up")}
            >
              <span>{t.workout.nextStepRampUp}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: WEIGHT RAMP-UP (SUB-WORKOUT PRO RAMP) */}
      {activeTab === "ramp_up" && (
        <div className="space-y-3 my-2 animate-in fade-in duration-200">
          {/* Important Rule Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/90 leading-snug">
              <strong className="text-amber-300 block mb-0.5">
                Правило безпеки та чистоти таймінгу СМТ:
              </strong>
              {t.workout.rampUpRule}
            </div>
          </div>

          {/* Ramp-up Plans List */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-none pr-1">
            {rampUpPlans.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-2xl bg-white/5 border border-white/10">
                Немає запланованих вправ для розрахунку.
              </div>
            ) : (
              rampUpPlans.map((plan) => {
                const displayName = getLocalizedExerciseName(plan.exerciseName, language, true);
                const isAllDone = plan.sets.every((s) => completedRampSets[s.id]);

                return (
                  <div
                    key={plan.exerciseId}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2.5 shadow-sm"
                  >
                    {/* Exercise Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                            plan.isMainCompound
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          <Dumbbell className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-white truncate">
                            {displayName}
                          </h4>
                          {plan.supersetLabel && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {plan.supersetLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Working Weight Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                          Робоча: {plan.workingWeight} {t.common.kg} ({plan.workingSets}×{plan.workingReps})
                        </span>
                      </div>
                    </div>

                    {/* Ramp Sets Table/Cards */}
                    <div className="space-y-1.5">
                      {plan.sets.map((set) => {
                        const isDone = Boolean(completedRampSets[set.id]);
                        const purposeText =
                          language === "uk"
                            ? set.purpose.uk
                            : language === "en"
                            ? set.purpose.en
                            : set.purpose.ru;

                        return (
                          <div
                            key={set.id}
                            onClick={() => toggleRampSet(set.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                              isDone
                                ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                                : "bg-slate-950/60 border-white/5 hover:border-white/15 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="shrink-0">
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Circle className="h-4 w-4 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className={`font-mono font-bold mr-1.5 ${isDone ? "text-emerald-300" : "text-white"}`}>
                                  {set.weight} {t.common.kg} × {set.reps}
                                </span>
                                <span className="text-[10px] text-slate-400 hidden sm:inline">
                                  ({purposeText})
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                                {set.percent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tab 2 Actions */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-9 text-xs text-slate-400 border-white/10 hover:text-white"
              onClick={() => setActiveTab("mobility")}
            >
              « {t.workout.jointMobilityTab}
            </Button>
            <Button
              type="button"
              variant="accent"
              className="w-full sm:flex-1 h-11 font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30"
              onClick={completeWarmupAndStart}
            >
              <Play className="h-4 w-4 fill-current shrink-0" />
              <span>{t.workout.startSmtWorkout}</span>
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
