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

interface PrepWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCalculator: () => void;
}

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
    completeSession,
    getSuggestedSmtWeights,
    setHasAppliedPrepWeights,
  } = usePrepStore();
  const { soundEnabled, hapticsEnabled, weightIncrementKg } = useSettingsStore();
  const { exercises, initializeProgram } = useWorkoutStore();

  // Selected session (defaults to active or first uncompleted or #1)
  const [selectedNum, setSelectedNum] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isFinishedScreen, setIsFinishedScreen] = useState<boolean>(false);
  const [isAppliedSuccessfully, setIsAppliedSuccessfully] = useState<boolean>(false);

  // Rest timer
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Init session on open
  useEffect(() => {
    if (open) {
      const active = sessions.find((s) => s.id === activeSessionId);
      if (active) {
        setSelectedNum(active.number);
      } else {
        const firstUncompleted = sessions.find((s) => !s.completed);
        setSelectedNum(firstUncompleted ? firstUncompleted.number : 1);
      }
      setElapsedSeconds(0);
      setIsTimerRunning(true);
      setIsFinishedScreen(false);
      setIsAppliedSuccessfully(false);
    } else {
      setIsTimerRunning(false);
      setIsRestActive(false);
      setIsFinishedScreen(false);
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
  }, [open, activeSessionId]);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isTimerRunning]);

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

  const currentSession = sessions.find((s) => s.number === selectedNum) || sessions[0];
  const targetRest = currentSession.targetRestSeconds;

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
      // Auto-start rest timer
      handleStartRest(targetRest);
    }
  };

  const handleFinishSession = () => {
    completeSession(currentSession.id, elapsedSeconds);
    if (soundEnabled) soundPlayer.playWorkoutComplete();
    if (hapticsEnabled) triggerHaptic("success");
    setIsTimerRunning(false);
    setIsRestActive(false);
    setIsFinishedScreen(true);
  };

  const suggestedWeights = getSuggestedSmtWeights(weightIncrementKg || 2.5);

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
    setIsAppliedSuccessfully(true);

    setTimeout(() => {
      onOpenChange(false);
    }, 1000);
  };

  const completedSetsCount = currentSession.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSetsCount = currentSession.exercises.length * 4; // 12 sets

  // --- SCREEN 2: POST-WORKOUT RESULTS & AUTO-CALCULATED SMT WEIGHTS ---
  if (isFinishedScreen) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle onClose={() => onOpenChange(false)}>
            <div className="flex items-center gap-2 text-emerald-400">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span>
                {language === "uk"
                  ? "Підготовче тренування завершено!"
                  : language === "en"
                  ? "Prep Session Completed!"
                  : "Подготовительная тренировка завершена!"}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {language === "uk"
              ? `Час: ${formatTime(elapsedSeconds)} • Закрито підходів: ${completedSetsCount}/${totalSetsCount}. Ваше тіло адаптоване до пауз ${targetRest}с.`
              : language === "en"
              ? `Time: ${formatTime(elapsedSeconds)} • Sets: ${completedSetsCount}/${totalSetsCount}. Conditioned for ${targetRest}s rest.`
              : `Время: ${formatTime(elapsedSeconds)} • Подходов: ${completedSetsCount}/${totalSetsCount}. Тело адаптировано к паузам ${targetRest}с.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Hero Banner with Auto-calculated SMT-1 starting weights */}
          <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h4 className="font-bold text-sm sm:text-base text-white">
                  {language === "uk"
                    ? "Автоматично розраховані стартові ваги СМТ-1:"
                    : language === "en"
                    ? "Auto-Calculated SMT-1 Starting Loads:"
                    : "Автоматически рассчитанные стартовые веса СМТ-1:"}
                </h4>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                40% база / 30% підсобка
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === "uk"
                ? "На основі виконаних підходів система вирахувала ваш 1ПМ та підібрала ідеальні робочі ваги для старту 12-тижневої програми:"
                : language === "en"
                ? "Based on your completed sets, the system calculated your 1RM and calibrated optimal starting loads for SMT-1:"
                : "На основе выполненных подходов система рассчитала ваш 1ПМ и подобрала идеальные рабочие веса для старта 12-недельной программы:"}
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
                  {language === "uk" ? "Ваги застосовано до СМТ-1!" : language === "en" ? "Applied to SMT-1!" : "Веса применены к СМТ-1!"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>
                  {language === "uk"
                    ? "Застосувати ваги та перейти до СМТ-1"
                    : language === "en"
                    ? "Apply Weights to SMT-1 (36 workouts)"
                    : "Применить веса и перейти к СМТ-1"}
                </span>
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="border-white/20 text-xs font-semibold"
            onClick={() => {
              onOpenChange(false);
              onOpenCalculator();
            }}
          >
            <Zap className="h-3.5 w-3.5 mr-1 text-cyan-400" />
            <span>{language === "uk" ? "Змінити вручну" : language === "en" ? "Customize" : "Изменить вручную"}</span>
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
      </Dialog>
    );
  }

  // --- SCREEN 1: ACTIVE PREP WORKOUT ---
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
        {/* Workout Switcher Pill Tabs (1..6) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {sessions.map((sess) => {
            const isSelected = sess.number === selectedNum;
            return (
              <button
                key={sess.id}
                onClick={() => {
                  setSelectedNum(sess.number);
                  setActiveSessionId(sess.id);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                    : sess.completed
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <span>Тренування {sess.number}</span>
                <span className="text-[10px] opacity-75">({sess.targetRestSeconds}с)</span>
                {sess.completed && <Check className="h-3 w-3 text-emerald-400 ml-0.5" />}
              </button>
            );
          })}
        </div>

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
