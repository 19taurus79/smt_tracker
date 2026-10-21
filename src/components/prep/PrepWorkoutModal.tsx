"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight,
  Dumbbell,
  Check,
  Zap,
  Trophy,
  ShieldAlert,
  Sliders,
  ChevronRight,
  X,
  Send,
  Camera,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePrepStore, PrepSession } from "@/lib/store/usePrepStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { DEFAULT_EXERCISES } from "@/lib/smt/generator";
import { soundPlayer } from "@/lib/audio/sound";
import { triggerHaptic } from "@/lib/tma/telegram";
import { formatTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { StoryShareModal, StoryTemplateType, PrepStoryData } from "@/components/analytics/StoryShareModal";
import { WorkoutSession } from "@/types/smt";

interface PrepWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCalculator: () => void;
}

type ModalStep = "briefing" | "workout" | "calibrate" | "all_completed";

export function PrepWorkoutModal({
  open,
  onOpenChange,
  onOpenCalculator,
}: PrepWorkoutModalProps) {
  const { language } = useTranslation();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    updateSet,
    updateSessionExerciseWeights,
    applyWeightsToUpcomingSessions,
    setIsWeightsConfirmed,
    completeSession,
    getSuggestedSmtWeights,
    setHasAppliedPrepWeights,
    setPrepWidgetDismissed,
    areAllSessionsCompleted,
  } = usePrepStore();

  const { soundEnabled, hapticsEnabled, weightIncrementKg, traineeName } = useSettingsStore();
  const { exercises, initializeProgram } = useWorkoutStore();

  // Multi-step modal navigation
  const [step, setStep] = useState<ModalStep>("briefing");
  const [selectedNum, setSelectedNum] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isAppliedSuccessfully, setIsAppliedSuccessfully] = useState<boolean>(false);
  const [isPublishingChallenge, setIsPublishingChallenge] = useState<boolean>(false);
  const [publishedChallenge, setPublishedChallenge] = useState<boolean>(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [storyInitialTemplate, setStoryInitialTemplate] = useState<StoryTemplateType>("prep_step");

  // Calibration state for after workout
  const [calibrateBench, setCalibrateBench] = useState<number>(50);
  const [calibratePull, setCalibratePull] = useState<number>(45);
  const [calibrateSquat, setCalibrateSquat] = useState<number>(60);
  const [showAdjustInputs, setShowAdjustInputs] = useState<boolean>(false);
  const [calibrateSaved, setCalibrateSaved] = useState<boolean>(false);

  // Rest timer
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current session object
  const currentSession = sessions.find((s) => s.number === selectedNum) || sessions[0];
  const targetRest = currentSession.targetRestSeconds;

  // Init session on open
  useEffect(() => {
    if (open) {
      const active = sessions.find((s) => s.id === activeSessionId);
      if (active) {
        setSelectedNum(active.number);
        setStep("workout");
        setIsTimerRunning(true);
      } else {
        const firstUncompleted = sessions.find((s) => !s.completed);
        const targetNum = firstUncompleted ? firstUncompleted.number : 1;
        setSelectedNum(targetNum);
        
        // If all are already completed and user opened this modal
        if (areAllSessionsCompleted()) {
          setStep("all_completed");
        } else {
          setStep("briefing");
        }
        setIsTimerRunning(false);
      }

      setElapsedSeconds(0);
      setIsRestActive(false);
      setIsAppliedSuccessfully(false);
      setShowAdjustInputs(false);
      setCalibrateSaved(false);
      setIsPublishingChallenge(false);
      setPublishedChallenge(false);

      // Initialize calibration input values from current session
      const sess = sessions.find((s) => s.number === (active?.number || 1)) || sessions[0];
      const bSet = sess.exercises.find((e) => e.id === "bench")?.sets[0]?.weight || 50;
      const pSet = sess.exercises.find((e) => e.id === "pull")?.sets[0]?.weight || 45;
      const sSet = sess.exercises.find((e) => e.id === "squat")?.sets[0]?.weight || 60;
      setCalibrateBench(bSet);
      setCalibratePull(pSet);
      setCalibrateSquat(sSet);
    } else {
      setIsTimerRunning(false);
      setIsRestActive(false);
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
  }, [open, activeSessionId]);

  // Keep calibration defaults in sync when session changes
  useEffect(() => {
    if (currentSession) {
      const bSet = currentSession.exercises.find((e) => e.id === "bench")?.sets[0]?.weight || 50;
      const pSet = currentSession.exercises.find((e) => e.id === "pull")?.sets[0]?.weight || 45;
      const sSet = currentSession.exercises.find((e) => e.id === "squat")?.sets[0]?.weight || 60;
      setCalibrateBench(bSet);
      setCalibratePull(pSet);
      setCalibrateSquat(sSet);
    }
  }, [selectedNum, currentSession]);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning && step === "workout") {
      stopwatchIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isTimerRunning, step]);

  // Rest timer effect
  useEffect(() => {
    if (isRestActive && restRemaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(restIntervalRef.current!);
            setIsRestActive(false);
            if (soundEnabled) soundPlayer.playRestComplete();
            if (hapticsEnabled) triggerHaptic("success");
            return 0;
          }
          if (prev <= 4 && prev > 1) {
            if (soundEnabled) soundPlayer.playTick();
            if (hapticsEnabled) triggerHaptic("impact");
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isRestActive, restRemaining, soundEnabled, hapticsEnabled]);

  const handleStartRest = (duration: number = targetRest) => {
    setRestRemaining(duration);
    setIsRestActive(true);
    if (soundEnabled) soundPlayer.playBeep(880, 0.12, "sine");
    if (hapticsEnabled) triggerHaptic("impact");
  };

  const handleToggleSet = (
    exerciseId: "bench" | "pull" | "squat",
    setIndex: number,
    currentCompleted: boolean
  ) => {
    const nextCompleted = !currentCompleted;
    updateSet(currentSession.id, exerciseId, setIndex, { completed: nextCompleted });

    if (nextCompleted) {
      if (soundEnabled) soundPlayer.playBeep(980, 0.1, "triangle");
      if (hapticsEnabled) triggerHaptic("impact");
      handleStartRest(targetRest);
    }
  };

  // Start workout after briefing
  const handleStartWorkout = () => {
    setActiveSessionId(currentSession.id);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setStep("workout");
    if (soundEnabled) soundPlayer.playBeep(880, 0.15, "triangle");
    if (hapticsEnabled) triggerHaptic("impact");
  };

  // Complete workout
  const handleFinishSession = () => {
    completeSession(currentSession.id, elapsedSeconds);
    if (soundEnabled) soundPlayer.playWorkoutComplete();
    if (hapticsEnabled) triggerHaptic("success");
    setIsTimerRunning(false);
    setIsRestActive(false);

    // If this was session 6 or all sessions are now completed -> show full completion
    if (selectedNum === 6 || areAllSessionsCompleted()) {
      setStep("all_completed");
    } else {
      setStep("calibrate");
    }
  };

  // Calibration action: Weights were ideal!
  const handleConfirmIdealWeights = () => {
    setIsWeightsConfirmed(true);
    const weights = {
      bench: calibrateBench,
      pull: calibratePull,
      squat: calibrateSquat,
    };
    // Apply current weights to all remaining sessions
    applyWeightsToUpcomingSessions(selectedNum + 1, weights);
    setCalibrateSaved(true);
    if (soundEnabled) soundPlayer.playWorkoutComplete();
    if (hapticsEnabled) triggerHaptic("success");

    setTimeout(() => {
      onOpenChange(false);
    }, 1200);
  };

  // Calibration action: Apply adjusted weights to upcoming sessions
  const handleSaveAdjustedWeights = () => {
    setIsWeightsConfirmed(false); // keep false so user can confirm next time
    const weights = {
      bench: calibrateBench,
      pull: calibratePull,
      squat: calibrateSquat,
    };
    applyWeightsToUpcomingSessions(selectedNum + 1, weights);
    setCalibrateSaved(true);
    if (soundEnabled) soundPlayer.playBeep(880, 0.1, "triangle");
    if (hapticsEnabled) triggerHaptic("success");

    setTimeout(() => {
      onOpenChange(false);
    }, 1200);
  };

  const suggestedWeights = getSuggestedSmtWeights(weightIncrementKg || 2.5);

  // Apply final calculated weights to SMT-1 (36 sessions)
  const handleApplyWeightsDirectly = () => {
    const baseList = exercises.length > 0 ? exercises : DEFAULT_EXERCISES;

    const mapping: Record<string, { oneRepMax: number; startWeight: number }> = {
      bench_press: suggestedWeights.benchPress,
      close_grip_bench: suggestedWeights.closeGripBench,
      pull_ups: suggestedWeights.pullUps,
      biceps_curl: suggestedWeights.bicepsCurl,
      squat: suggestedWeights.squat,
      ohp: suggestedWeights.ohp,
    };

    const updatedExercises = baseList.map((ex) => {
      const target = mapping[ex.id];
      if (target) {
        return {
          ...ex,
          oneRepMax: target.oneRepMax,
          customStartWeight: target.startWeight,
        };
      }
      return ex;
    });

    initializeProgram(updatedExercises, weightIncrementKg || 2.5);
    setHasAppliedPrepWeights(true);
    setPrepWidgetDismissed(true); // Close prep cycle permanently as user graduated to SMT-1!
    setIsAppliedSuccessfully(true);

    if (soundEnabled) soundPlayer.playWorkoutComplete();
    if (hapticsEnabled) triggerHaptic("success");

    setTimeout(() => {
      onOpenChange(false);
    }, 1400);
  };

  const completedSetsCount = currentSession.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSetsCount = currentSession.exercises.length * 4; // 12 sets

  const prepTonnage = currentSession.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return s.completed ? sAcc + (s.weight || 0) * (s.reps || 0) : sAcc;
      }, 0)
    );
  }, 0);

  const handlePublishPrepChallenge = async (isGraduation: boolean = false) => {
    if (isPublishingChallenge || publishedChallenge) return;
    setIsPublishingChallenge(true);
    try {
      const athleteName =
        traineeName ||
        (typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name : "") ||
        "";
      const athleteUsername =
        (typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user?.username : "") ||
        "";

      const weightsSummary = `Жим ${suggestedWeights.benchPress.startWeight}кг, Тяга ${suggestedWeights.pullUps.startWeight}кг, Присед ${suggestedWeights.squat.startWeight}кг`;

      const res = await fetch("/api/challenge/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSeconds: elapsedSeconds || 30 * 60,
          tonnageKg: prepTonnage,
          athleteName,
          athleteUsername,
          isPrep: true,
          prepSessionNumber: selectedNum,
          targetRestSeconds: targetRest,
          completedSetsCount,
          totalSetsCount,
          isFinalGraduation: isGraduation,
          suggestedWeightsSummary: weightsSummary,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setPublishedChallenge(true);
        if (soundEnabled) soundPlayer.playWorkoutComplete();
        if (hapticsEnabled) triggerHaptic("success");
      }
    } catch (e) {
      console.error("Failed to publish prep session to challenge:", e);
    } finally {
      setIsPublishingChallenge(false);
    }
  };

  // Quick weight adjuster helper for briefing screen
  const handleBriefingWeightChange = (
    exId: "bench" | "pull" | "squat",
    delta: number
  ) => {
    const curWeight =
      exId === "bench" ? calibrateBench : exId === "pull" ? calibratePull : calibrateSquat;
    const nextWeight = Math.max(0, Math.round((curWeight + delta) * 10) / 10);
    
    if (exId === "bench") setCalibrateBench(nextWeight);
    if (exId === "pull") setCalibratePull(nextWeight);
    if (exId === "squat") setCalibrateSquat(nextWeight);

    updateSessionExerciseWeights(currentSession.id, {
      bench: exId === "bench" ? nextWeight : calibrateBench,
      pull: exId === "pull" ? nextWeight : calibratePull,
      squat: exId === "squat" ? nextWeight : calibrateSquat,
    });
  };

  // Synthetic workout & prep data for Story generation
  const prepStoryWorkout: WorkoutSession = {
    id: currentSession.id,
    workoutNumber: selectedNum,
    microcycle: 1,
    week: 1,
    title: `Вводне тренування #${selectedNum}`,
    status: "completed",
    completedAt: new Date().toISOString(),
    durationSeconds: elapsedSeconds || 25 * 60,
    tonnageKg: prepTonnage,
    powerKgPerMin: Math.round(prepTonnage / Math.max(1, (elapsedSeconds || 25 * 60) / 60)),
    supersets: currentSession.exercises.map((ex, i) => ({
      id: `ss-${i}`,
      label: ex.name,
      exercises: [
        {
          id: ex.id,
          exerciseId: ex.id,
          name: ex.name,
          category: "main",
          order: i + 1,
          sets: ex.sets.map((s, si) => ({
            id: s.id,
            setNumber: si + 1,
            targetWeight: s.weight,
            actualWeight: s.weight,
            targetReps: s.reps,
            actualReps: s.reps,
            completed: s.completed,
          })),
        },
      ],
    })),
  };

  const prepStoryData: PrepStoryData = {
    prepSessionNumber: selectedNum,
    targetRestSeconds: targetRest,
    isGraduation: step === "all_completed",
    completedSetsCount,
    totalSetsCount,
    suggestedWeights: {
      bench: suggestedWeights.benchPress.startWeight,
      closeGrip: suggestedWeights.closeGripBench.startWeight,
      pull: suggestedWeights.pullUps.startWeight,
      biceps: suggestedWeights.bicepsCurl.startWeight,
      squat: suggestedWeights.squat.startWeight,
      ohp: suggestedWeights.ohp.startWeight,
    },
  };

  // =========================================================================
  // SCREEN 1: PRE-WORKOUT BRIEFING & TRIAL WEIGHTS (Before timer starts)
  // =========================================================================
  if (step === "briefing") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle onClose={() => onOpenChange(false)}>
            <div className="flex items-center gap-2 text-cyan-400">
              <Flame className="h-5 w-5" />
              <span>
                {language === "uk"
                  ? `Вводне тренування #${selectedNum} із 6`
                  : language === "en"
                  ? `Prep Workout #${selectedNum} of 6`
                  : `Вводная тренировка #${selectedNum} из 6`}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {language === "uk"
              ? `Цільовий відпочинок: ${targetRest} секунд • 3 вправи × 4 підходи на 10–12 повторень`
              : language === "en"
              ? `Target rest: ${targetRest}s • 3 exercises × 4 sets of 10–12 reps`
              : `Целевой отдых: ${targetRest} секунд • 3 упражнения × 4 подхода на 10–12 повторений`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 max-h-[72vh] overflow-y-auto pr-1">
          {/* Workout Switcher Pill Tabs (1..6) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {sessions.map((sess) => {
              const isSelected = sess.number === selectedNum;
              return (
                <button
                  key={sess.id}
                  onClick={() => {
                    setSelectedNum(sess.number);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                      : sess.completed
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>#{sess.number}</span>
                  <span className="text-[10px] opacity-75">({sess.targetRestSeconds}с)</span>
                  {sess.completed && <Check className="h-3 w-3 text-emerald-400 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Golden Rule Notice Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">
                {language === "uk" ? "Головне правило адаптації" : language === "en" ? "Adaptation Rule" : "Главное правило адаптации"}
              </h4>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {language === "uk"
                ? "Не женіться за великими вагами! Це не силова програма. Мета вводного циклу — підготувати серце, капіляри та зв'язки. Збільшуйте робочу вагу ТІЛЬКИ якщо ви легко витримуєте скорочений відпочинок між підходами."
                : language === "en"
                ? "Do not chase heavy weights! This is not powerlifting. The goal is cardio and joint conditioning. Increase load ONLY if you can comfortably sustain the shortened rest intervals."
                : "Не гонитесь за большими весами! Это не силовая программа. Цель вводного цикла — подготовить сердце, капилляры и связки. Увеличивайте рабочий вес ТОЛЬКО если легко выдерживаете сокращенный отдых между подходами."}
            </p>
          </div>

          {/* Trial Weights Setting Before Starting */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {language === "uk"
                    ? "Пробні робочі ваги (10–12 повторень):"
                    : language === "en"
                    ? "Trial Working Weights (10–12 reps):"
                    : "Пробные рабочие веса (10–12 повторений):"}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {language === "uk" ? "4 підходи в кожній вправі" : "4 подхода в каждом упражнении"}
              </span>
            </div>

            {/* Exercise 1: Bench Press */}
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Жим лежачи (штанга/гантелі)</div>
                <div className="text-[10px] text-slate-400">База для грудей та трицепса</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-xs font-bold border-white/15"
                  onClick={() => handleBriefingWeightChange("bench", -2.5)}
                >
                  -
                </Button>
                <div className="w-16 text-center font-black text-emerald-400 text-sm">
                  {calibrateBench} <span className="text-[10px] font-normal text-slate-400">кг</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-xs font-bold border-white/15"
                  onClick={() => handleBriefingWeightChange("bench", +2.5)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Exercise 2: Pull / Lat Pulldown */}
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Підтягування або тяга блоку</div>
                <div className="text-[10px] text-slate-400">База для найширших та біцепса</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-xs font-bold border-white/15"
                  onClick={() => handleBriefingWeightChange("pull", -2.5)}
                >
                  -
                </Button>
                <div className="w-16 text-center font-black text-purple-400 text-sm">
                  {calibratePull} <span className="text-[10px] font-normal text-slate-400">кг</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-xs font-bold border-white/15"
                  onClick={() => handleBriefingWeightChange("pull", +2.5)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Exercise 3: Squat / Leg Press */}
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Присідання або жим ногами</div>
                <div className="text-[10px] text-slate-400">База для ніг та кора</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-xs font-bold border-white/15"
                  onClick={() => handleBriefingWeightChange("squat", -2.5)}
                >
                  -
                </Button>
                <div className="w-16 text-center font-black text-cyan-400 text-sm">
                  {calibrateSquat} <span className="text-[10px] font-normal text-slate-400">кг</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-xs font-bold border-white/15"
                  onClick={() => handleBriefingWeightChange("squat", +2.5)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          <Button
            variant="accent"
            size="lg"
            className="flex-1 font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20"
            onClick={handleStartWorkout}
          >
            <Play className="h-4 w-4 mr-1.5 fill-current" />
            <span>
              {language === "uk"
                ? `Розпочати тренування (${targetRest}с відпочинку)`
                : language === "en"
                ? `Start Workout (${targetRest}s Rest)`
                : `Начать тренировку (${targetRest}с отдыха)`}
            </span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="border-white/20 text-xs text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            {language === "uk" ? "Закрити" : language === "en" ? "Close" : "Закрыть"}
          </Button>
        </div>
      </Dialog>
    );
  }

  // =========================================================================
  // SCREEN 3: POST-WORKOUT CALIBRATION QUERY (Workouts 1 to 5)
  // "Вгадали зі стартовими вагами чи будемо коригувати?"
  // =========================================================================
  if (step === "calibrate") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle onClose={() => onOpenChange(false)}>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                {language === "uk"
                  ? `Тренування #${selectedNum} виконано!`
                  : language === "en"
                  ? `Workout #${selectedNum} Completed!`
                  : `Тренировка #${selectedNum} выполнена!`}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {language === "uk"
              ? `Час: ${formatTime(elapsedSeconds)} • Закрито підходів: ${completedSetsCount}/${totalSetsCount} • Відпочинок: ${targetRest}с.`
              : language === "en"
              ? `Time: ${formatTime(elapsedSeconds)} • Sets: ${completedSetsCount}/${totalSetsCount} • Rest: ${targetRest}s.`
              : `Время: ${formatTime(elapsedSeconds)} • Подходов: ${completedSetsCount}/${totalSetsCount} • Отдых: ${targetRest}с.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 max-h-[70vh] overflow-y-auto pr-1">
          {calibrateSaved ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-base">
                {language === "uk" ? "Ваги успішно зафіксовано!" : "Веса успешно зафиксированы!"}
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                {language === "uk"
                  ? `Параметри перенесені на наступне тренування #${selectedNum + 1}. Відпочинок скоротиться до наступного кроку протоколу.`
                  : `Параметры перенесены на следующую тренировку #${selectedNum + 1}. Отдых сократится до следующего шага протокола.`}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-4 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="h-5 w-5 shrink-0" />
                <h4 className="font-bold text-sm sm:text-base text-white">
                  {language === "uk"
                    ? "Вгадали зі стартовими вагами чи будемо коригувати?"
                    : language === "en"
                    ? "Did we nail the starting weights or need adjustments?"
                    : "Угадали со стартовыми весами или будем корректировать?"}
                </h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {language === "uk"
                  ? `Якщо 4 підходи по 10–12 повторень із паузами ${targetRest}с далися комфортно — зафіксуємо їх для подальших тренувань. Якщо було заважко або залегко — скоригуйте їх для тренування #${selectedNum + 1}.`
                  : `Если 4 подхода по 10–12 повторений с паузами ${targetRest}с дались комфортно — зафиксируем их для последующих тренировок. Если было слишком тяжело или легко — скорректируйте их для тренировки #${selectedNum + 1}.`}
              </p>

              {/* Show adjust inputs if user clicked "Adjust" */}
              {showAdjustInputs && (
                <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-cyan-300 block">
                    {language === "uk"
                      ? `Скоригувати робочі ваги для тренування #${selectedNum + 1}:`
                      : `Скорректировать рабочие веса для тренировки #${selectedNum + 1}:`}
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/10 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Жим лежачи</span>
                      <Input
                        type="number"
                        step="2.5"
                        value={calibrateBench}
                        onChange={(e) => setCalibrateBench(parseFloat(e.target.value) || 0)}
                        className="h-8 text-center text-xs font-bold text-emerald-400"
                      />
                      <span className="text-[9px] text-slate-500">кг</span>
                    </div>

                    <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/10 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Тяга / підтяг.</span>
                      <Input
                        type="number"
                        step="2.5"
                        value={calibratePull}
                        onChange={(e) => setCalibratePull(parseFloat(e.target.value) || 0)}
                        className="h-8 text-center text-xs font-bold text-purple-400"
                      />
                      <span className="text-[9px] text-slate-500">кг</span>
                    </div>

                    <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/10 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Присідання</span>
                      <Input
                        type="number"
                        step="2.5"
                        value={calibrateSquat}
                        onChange={(e) => setCalibrateSquat(parseFloat(e.target.value) || 0)}
                        className="h-8 text-center text-xs font-bold text-cyan-400"
                      />
                      <span className="text-[9px] text-slate-500">кг</span>
                    </div>
                  </div>

                  <Button
                    variant="accent"
                    size="sm"
                    className="w-full bg-cyan-500 text-slate-950 font-bold text-xs mt-2"
                    onClick={handleSaveAdjustedWeights}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {language === "uk"
                        ? `Зберегти та застосувати до тренування #${selectedNum + 1}`
                        : `Сохранить и применить к тренировке #${selectedNum + 1}`}
                    </span>
                  </Button>
                </div>
              )}

              {/* Two Option Buttons if not showing inputs */}
              {!showAdjustInputs && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="accent"
                    size="lg"
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs shadow-md shadow-emerald-500/20"
                    onClick={handleConfirmIdealWeights}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    <span>
                      {language === "uk" ? "Так, ваги ідеальні" : "Да, веса идеальные"}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 font-bold text-xs"
                    onClick={() => setShowAdjustInputs(true)}
                  >
                    <Sliders className="h-4 w-4 mr-1.5 text-cyan-400" />
                    <span>
                      {language === "uk" ? "Потрібно скоригувати" : "Нужно скорректировать"}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Telegram Challenge Channel Card */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900 to-cyan-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                <span>{language === "uk" ? "Telegram-канал Челенджу" : "Telegram-канал Челленджа"}</span>
              </span>
              <p className="text-[11px] text-slate-400">
                {language === "uk"
                  ? `Опублікуйте тренування #${selectedNum} (відпочинок ${targetRest}с витримано, тоннаж: ${prepTonnage} кг)!`
                  : `Опубликуйте тренировку #${selectedNum} (отдых ${targetRest}с выдержан, тоннаж: ${prepTonnage} кг)!`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10 text-xs font-bold h-8.5"
                onClick={() => {
                  setStoryInitialTemplate("prep_step");
                  setIsStoryModalOpen(true);
                }}
              >
                <Camera className="h-3.5 w-3.5 mr-1 text-pink-400" />
                <span>{language === "uk" ? "Сторіс" : "Сторис"}</span>
              </Button>

              <Button
                size="sm"
                variant={publishedChallenge ? "outline" : "accent"}
                disabled={isPublishingChallenge || publishedChallenge}
                className={`text-xs h-8.5 font-bold ${
                  publishedChallenge
                    ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                }`}
                onClick={() => handlePublishPrepChallenge(false)}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                <span>
                  {publishedChallenge
                    ? (language === "uk" ? "✓ В каналі!" : "✓ В канале!")
                    : isPublishingChallenge
                    ? (language === "uk" ? "Публікація..." : "Публикация...")
                    : (language === "uk" ? "В канал Челенджу" : "В канал Челленджа")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400"
            onClick={() => onOpenChange(false)}
          >
            {language === "uk" ? "Закрити" : language === "en" ? "Close" : "Закрыть"}
          </Button>
        </div>

        <StoryShareModal
          open={isStoryModalOpen}
          onOpenChange={setIsStoryModalOpen}
          workout={prepStoryWorkout}
          prepData={prepStoryData}
          initialTemplate={storyInitialTemplate}
        />
      </Dialog>
    );
  }

  // =========================================================================
  // SCREEN 4: FULL PREP COMPLETION & SMT-1 1-CLICK APPLY (Session 6 or all done)
  // =========================================================================
  if (step === "all_completed") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle onClose={() => onOpenChange(false)}>
            <div className="flex items-center gap-2 text-emerald-400">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span>
                {language === "uk"
                  ? "🎉 Вводний цикл успішно пройдено!"
                  : language === "en"
                  ? "🎉 Prep Cycle Completed!"
                  : "🎉 Вводный цикл успешно пройден!"}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {language === "uk"
              ? "Ваше тіло повністю адаптоване до пауз 30 секунд. Нижче автоматично розраховані стартові ваги для 36 тренувань СМТ-1."
              : "Ваше тело полностью адаптировано к паузам 30 секунд. Ниже автоматически рассчитаны стартовые веса для 36 тренировок СМТ-1."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h4 className="font-bold text-sm sm:text-base text-white">
                  {language === "uk"
                    ? "Розраховані робочі ваги СМТ-1:"
                    : "Рассчитанные рабочие веса СМТ-1:"}
                </h4>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                40% база / 30% підсобка
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === "uk"
                ? "На основі реальних показників 6 адаптаційних тренувань програма сформувала точні стартові ваги для 12-тижневого циклу:"
                : "На основе реальных показателей 6 адаптационных тренировок программа сформировала точные стартовые веса для 12-недельного цикла:"}
            </p>

            {/* 6 Deduced Exercises Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Жим лежачи (Блок 1)</span>
                <span className="text-sm font-black text-emerald-400 block">
                  {suggestedWeights.benchPress.startWeight} кг
                </span>
                <span className="text-[9px] text-slate-500">1ПМ: {suggestedWeights.benchPress.oneRepMax} кг</span>
              </div>

              <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Жим вузьким (Блок 2)</span>
                <span className="text-sm font-black text-emerald-400 block">
                  {suggestedWeights.closeGripBench.startWeight} кг
                </span>
                <span className="text-[9px] text-slate-500">1ПМ: {suggestedWeights.closeGripBench.oneRepMax} кг</span>
              </div>

              <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Тяга / підтяг. (СС-1)</span>
                <span className="text-sm font-black text-purple-400 block">
                  {suggestedWeights.pullUps.startWeight} кг
                </span>
                <span className="text-[9px] text-slate-500">1ПМ: {suggestedWeights.pullUps.oneRepMax} кг</span>
              </div>

              <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Штанга на біцепс (СС-1)</span>
                <span className="text-sm font-black text-cyan-400 block">
                  {suggestedWeights.bicepsCurl.startWeight} кг
                </span>
                <span className="text-[9px] text-slate-500">1ПМ: {suggestedWeights.bicepsCurl.oneRepMax} кг</span>
              </div>

              <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Присідання / платф. (СС-2)</span>
                <span className="text-sm font-black text-purple-400 block">
                  {suggestedWeights.squat.startWeight} кг
                </span>
                <span className="text-[9px] text-slate-500">1ПМ: {suggestedWeights.squat.oneRepMax} кг</span>
              </div>

              <div className="rounded-xl bg-slate-950/70 p-2.5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Армійський жим (СС-2)</span>
                <span className="text-sm font-black text-cyan-400 block">
                  {suggestedWeights.ohp.startWeight} кг
                </span>
                <span className="text-[9px] text-slate-500">1ПМ: {suggestedWeights.ohp.oneRepMax} кг</span>
              </div>
            </div>
          </div>

          {/* Telegram Challenge Graduation Card */}
          <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Send className="h-4 w-4 text-cyan-400" />
                <span>{language === "uk" ? "Поділитися випускним у Челендж-каналі" : "Поделиться выпускным в Челлендж-канале"}</span>
              </span>
              <p className="text-[11px] text-slate-300">
                {language === "uk"
                  ? "Опублікуйте успішне закінчення підготовки та ваші стартові ваги на 36 тренувань СМТ-1!"
                  : "Опубликуйте успешное окончание подготовки и ваши стартовые веса на 36 тренировок СМТ-1!"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold h-9 px-3"
                onClick={() => {
                  setStoryInitialTemplate("prep_grad");
                  setIsStoryModalOpen(true);
                }}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                <span>{language === "uk" ? "Сторіс Випускника" : "Сторис Выпускника"}</span>
              </Button>

              <Button
                size="sm"
                variant={publishedChallenge ? "outline" : "accent"}
                disabled={isPublishingChallenge || publishedChallenge}
                className={`text-xs h-9 font-bold px-3.5 ${
                  publishedChallenge
                    ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                }`}
                onClick={() => handlePublishPrepChallenge(true)}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                <span>
                  {publishedChallenge
                    ? (language === "uk" ? "✓ Випускний у каналі!" : "✓ Выпускной в канале!")
                    : isPublishingChallenge
                    ? (language === "uk" ? "Публікація..." : "Публикация...")
                    : (language === "uk" ? "Опублікувати випускний" : "Опубликовать выпускной")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          <Button
            variant="accent"
            size="lg"
            disabled={isAppliedSuccessfully}
            className="flex-1 font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20"
            onClick={handleApplyWeightsDirectly}
          >
            {isAppliedSuccessfully ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-slate-950" />
                <span>
                  {language === "uk" ? "Ваги застосовано до СМТ-1!" : "Веса применены к СМТ-1!"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>
                  {language === "uk"
                    ? "Застосувати до СМТ-1 (36 тренувань)"
                    : "Применить к СМТ-1 (36 тренировок)"}
                </span>
              </div>
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="text-xs text-slate-400"
            onClick={() => onOpenChange(false)}
          >
            {language === "uk" ? "Закрити" : language === "en" ? "Close" : "Закрыть"}
          </Button>
        </div>

        <StoryShareModal
          open={isStoryModalOpen}
          onOpenChange={setIsStoryModalOpen}
          workout={prepStoryWorkout}
          prepData={prepStoryData}
          initialTemplate={storyInitialTemplate}
        />
      </Dialog>
    );
  }

  // =========================================================================
  // SCREEN 2: ACTIVE PREP WORKOUT
  // =========================================================================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-cyan-400" />
            <span>
              {language === "uk"
                ? `Вводне тренування #${selectedNum} (Адаптація)`
                : language === "en"
                ? `Prep Workout #${selectedNum} (Adaptation)`
                : `Вводная тренировка #${selectedNum} (Адаптация)`}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {language === "uk"
            ? `3 вправи × 4 підходи на 10–12 повторень. Цільовий відпочинок між сетами: ${targetRest} секунд.`
            : language === "en"
            ? `3 exercises × 4 sets of 10–12 reps. Target rest interval between sets: ${targetRest}s.`
            : `3 упражнения × 4 подхода на 10–12 повторений. Целевой отдых между сетами: ${targetRest} секунд.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[72vh] overflow-y-auto pr-1">
        {/* Dashboard Bar: Stopwatch & Active Rest Timer */}
        <div className="grid grid-cols-2 gap-2">
          {/* Workout Elapsed Time */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/10">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {language === "uk" ? "Час тренування" : language === "en" ? "Elapsed Time" : "Время тренировки"}
              </span>
              <span className="text-base sm:text-lg font-black text-white">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 hover:text-white"
            >
              {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>

          {/* Rest Countdown Timer */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              isRestActive
                ? "bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                : "bg-slate-900 border-white/10"
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                <Timer className="h-3 w-3 text-cyan-400" />
                {language === "uk" ? "Відпочинок" : language === "en" ? "Rest Timer" : "Отдых"}
              </span>
              <span className="text-base sm:text-lg font-black text-cyan-400">
                {isRestActive ? `${restRemaining}с` : `${targetRest}с`}
              </span>
            </div>
            <Button
              size="sm"
              variant={isRestActive ? "accent" : "outline"}
              className="text-xs h-8 px-2.5"
              onClick={() => {
                if (isRestActive) {
                  setIsRestActive(false);
                } else {
                  handleStartRest(targetRest);
                }
              }}
            >
              {isRestActive ? "Стоп" : "Старт"}
            </Button>
          </div>
        </div>

        {/* 3 Exercises Sections */}
        <div className="space-y-3">
          {currentSession.exercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white text-xs sm:text-sm">{ex.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                  4 × 10–12
                </Badge>
              </div>

              {/* 4 Sets Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      set.completed
                        ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-200"
                        : "bg-slate-950/50 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSet(ex.id, setIdx, set.completed)}
                        className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                          set.completed
                            ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30"
                            : "border border-white/20 hover:border-white/40"
                        }`}
                      >
                        {set.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>
                      <span className="text-xs font-semibold">Сет {setIdx + 1}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="2.5"
                          value={set.weight}
                          onChange={(e) =>
                            updateSet(currentSession.id, ex.id, setIdx, {
                              weight: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-7 w-14 text-center text-xs font-bold p-1"
                        />
                        <span className="text-[10px] text-slate-400">кг</span>
                      </div>
                      <span className="text-slate-500">×</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(currentSession.id, ex.id, setIdx, {
                              reps: parseInt(e.target.value, 10) || 10,
                            })
                          }
                          className="h-7 w-12 text-center text-xs font-bold p-1"
                        />
                        <span className="text-[10px] text-slate-400">повт</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
        <Button
          variant="accent"
          size="lg"
          className="flex-1 font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950"
          onClick={handleFinishSession}
        >
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          <span>
            {language === "uk"
              ? `Завершити тренування (${completedSetsCount}/${totalSetsCount})`
              : language === "en"
              ? `Finish Workout (${completedSetsCount}/${totalSetsCount})`
              : `Завершить тренировку (${completedSetsCount}/${totalSetsCount})`}
          </span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="border-white/20 text-xs"
          onClick={() => onOpenChange(false)}
        >
          {language === "uk" ? "Закрити" : language === "en" ? "Close" : "Закрыть"}
        </Button>
      </div>
    </Dialog>
  );
}
