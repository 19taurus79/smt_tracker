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
  ChevronRight,
  RotateCcw,
  Check,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
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
import { useTranslation } from "@/lib/i18n";
import {
  getLocalizedExerciseName,
  formatWorkoutTitle,
  formatSupersetLabel,
} from "@/lib/i18n/exercises";
import {
  calculateAthleticScore,
  getTierColor,
  getTierLabel,
} from "@/lib/scoring/athleticScore";
import { usePrepStore } from "@/lib/store/usePrepStore";
import { PrepWorkoutModal } from "@/components/prep/PrepWorkoutModal";
import { PrepCalculatorModal } from "@/components/prep/PrepCalculatorModal";
import { DEFAULT_EXERCISES } from "@/lib/smt/generator";

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const {
    workouts,
    exercises,
    initializeProgram,
    activeWorkoutId,
    setViewingWorkoutId,
    openWarmupModal,
  } = useWorkoutStore();

  const { measurements } = useBodyStore();
  const { gender, userAge, weightIncrementKg } = useSettingsStore();
  const {
    sessions: prepSessions,
    prepWidgetDismissed,
    setPrepWidgetDismissed,
    hasAppliedPrepWeights,
    setHasAppliedPrepWeights,
    getSuggestedSmtWeights,
  } = usePrepStore();

  const [mounted, setMounted] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [selectedReportWorkout, setSelectedReportWorkout] = useState<WorkoutSession | null>(null);
  const [isPrepWorkoutOpen, setIsPrepWorkoutOpen] = useState(false);
  const [isPrepCalcOpen, setIsPrepCalcOpen] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  const suggestedWeights = getSuggestedSmtWeights(weightIncrementKg || 2.5);
  const hasCompletedAnyPrep = prepSessions.some((s) => s.completed);

  const handleApplySuggestedWeights = () => {
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
        return { ...ex, oneRepMax: target.oneRepMax, customStartWeight: target.startWeight };
      }
      return ex;
    });
    initializeProgram(updatedExercises, weightIncrementKg || 2.5);
    setHasAppliedPrepWeights(true);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

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

  const latestScore = latestCompleted
    ? calculateAthleticScore({
        tonnageKg: latestCompleted.tonnageKg || 0,
        durationSeconds: latestCompleted.durationSeconds || 45 * 60,
        bodyWeightKg: latestBody?.weightKg || 80,
        gender,
        age: userAge,
      })
    : null;
  const latestTierColor = latestScore ? getTierColor(latestScore.tierKey) : null;
  const latestTierLabel = latestScore ? getTierLabel(latestScore.tierKey, t) : null;

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
                  ? t.dashboard.workoutActiveBadge
                  : isHeroCompleted
                  ? t.dashboard.allCompletedBadge
                  : t.dashboard.nextWorkout}
              </Badge>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                {t.common.microcycle} {currentOrNextWorkout.microcycle} • #{currentOrNextWorkout.workoutNumber}/36
              </span>
            </div>
            <CardTitle className="text-lg sm:text-2xl mt-1.5 text-white font-black leading-tight flex items-center justify-between flex-wrap gap-2">
              <span>
                {formatWorkoutTitle(
                  currentOrNextWorkout.workoutNumber,
                  currentOrNextWorkout.microcycle,
                  currentOrNextWorkout.week,
                  language
                )}
              </span>
              {isHeroCompleted && latestScore && latestTierColor && (
                <span
                  className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl border ${latestTierColor.border} ${latestTierColor.bg} ${latestTierColor.text} flex items-center gap-1.5 shadow-md`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {latestScore.score} • {latestTierLabel}
                </span>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-1 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {currentOrNextWorkout.supersets.map((ss, idx) => {
                const isSingle = ss.type === "single" || ss.exercises.length === 1;
                const prefix = isSingle
                  ? (language === "en" ? `Block ${idx + 1}:` : `Блок ${idx + 1}:`)
                  : (language === "en" ? `Superset ${idx + 1}:` : `Суперсет ${idx + 1}:`);

                return (
                  <div
                    key={ss.id}
                    className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-slate-200 text-[11px] sm:text-xs"
                  >
                    <span className="text-emerald-400 font-bold mr-1">{prefix}</span>
                    {ss.exercises
                      .map(
                        (e) =>
                          `${getLocalizedExerciseName(e.name, language, true)} (${e.sets[0]?.targetWeight} ${t.common.kg})`
                      )
                      .join(" + ")}
                  </div>
                );
              })}
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
                  <span>{t.dashboard.viewReport}</span>
                </Button>
              ) : activeWorkoutId ? (
                <Link
                  href={`/workout?id=${activeWorkoutId}`}
                  onClick={() => setViewingWorkoutId(activeWorkoutId)}
                  className="w-full flex-1"
                >
                  <Button variant="accent" size="lg" className="w-full font-bold shadow-lg shadow-emerald-500/20 h-11 sm:h-13 text-sm animate-pulse">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 fill-current" />
                    <span>{t.dashboard.continueWorkout}</span>
                  </Button>
                </Link>
              ) : (
                <>
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
                      <span>{t.dashboard.viewPlan}</span>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={openWarmupModal}
                    className="sm:w-auto font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-500/10 h-11 sm:h-13 text-sm"
                  >
                    <Flame className="h-4 w-4 mr-1.5 text-amber-400" />
                    <span>{t.dashboard.warmupBtn}</span>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preparatory Adaptation Cycle Widget (Bento) */}
      {!prepWidgetDismissed && (
        <Card className="relative overflow-hidden border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 p-3.5 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 bg-cyan-500/10 text-[10px]">
                  🌱 {language === "uk" ? "Адаптація 1–2 тижні" : language === "en" ? "Adaptation 1–2 wks" : "Адаптация 1–2 нед"}
                </Badge>
                <span className="text-[11px] text-slate-400">
                  {prepSessions.filter((s) => s.completed).length}/6 {language === "uk" ? "тренувань пройдено" : language === "en" ? "sessions done" : "тренировок пройдено"}
                </span>
                {hasAppliedPrepWeights && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-[10px]">
                    ✓ {language === "uk" ? "Синхронізовано з СМТ-1" : language === "en" ? "Synced" : "Синхронизировано"}
                  </Badge>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>
                  {language === "uk"
                    ? "Вводний цикл: підготовка серця, зв'язок та калібрування ваг"
                    : language === "en"
                    ? "Prep Cycle: Cardio conditioning & weight calibration"
                    : "Вводный цикл: подготовка сердца, связок и калибровка весов"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                {language === "uk"
                  ? "СМТ-1 має екстремальну щільність (паузи 30с). Пройдіть 6 вводних тренувань зі скороченням пауз з 90с до 30с, щоб плавно адаптувати зв'язки та серце й підібрати точні робочі ваги."
                  : language === "en"
                  ? "SMT-1 is high density (strict 30s rest). Complete 6 prep sessions reducing rest from 90s to 30s to condition joints, cardio and calibrate exact loads."
                  : "СМТ-1 обладает экстремальной плотностью (паузы 30с). Пройдите 6 вводных тренировок с сокращением пауз с 90с до 30с, чтобы плавно адаптировать связки и сердце и подобрать точные рабочие веса."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Primary Workout / Continue Button */}
              <Button
                variant="accent"
                size="sm"
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs shadow-md shadow-cyan-500/20 h-9 px-3.5"
                onClick={() => setIsPrepWorkoutOpen(true)}
              >
                <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                <span>
                  {prepSessions.every((s) => s.completed)
                    ? (language === "uk" ? "Переглянути підсумок" : language === "en" ? "View Summary" : "Итоги подготовки")
                    : prepSessions.some((s) => s.completed)
                    ? (language === "uk"
                        ? `⚡️ Тренування #${(prepSessions.find((s) => !s.completed)?.number || 1)}`
                        : `⚡️ Тренировка #${(prepSessions.find((s) => !s.completed)?.number || 1)}`)
                    : (language === "uk" ? "🏋️‍♂️ Почати підготовку" : language === "en" ? "Start Prep" : "🏋️‍♂️ Начать подготовку")}
                </span>
              </Button>

              {/* Ready / Dismiss Button (replaces close cross and premature calculator) */}
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold h-9"
                onClick={() => setPrepWidgetDismissed(true)}
                title={language === "uk" ? "Я вже підготовлений, приховати вводний цикл" : "Я уже подготовлен, скрыть вводный цикл"}
              >
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                <span>
                  {language === "uk"
                    ? "Я вже готовий до СМТ-1"
                    : language === "en"
                    ? "I'm ready for SMT-1"
                    : "Я уже готов к СМТ-1"}
                </span>
              </Button>
            </div>
          </div>

          {/* SMT-1 Calculated Weights Strip (shown ONLY when all 6 prep sessions are completed) */}
          {prepSessions.every((s) => s.completed) && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
              <div className="space-y-0.5">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                  🎉 {language === "uk" ? "Всі 6 тренувань виконано! Розраховані стартові ваги СМТ-1:" : "Все 6 тренировок выполнены! Рассчитанные стартовые веса СМТ-1:"}
                </span>
                <div className="text-xs text-slate-200 flex flex-wrap gap-2">
                  <span>Жим: <strong className="text-emerald-400">{suggestedWeights.benchPress.startWeight} кг</strong></span>
                  <span>•</span>
                  <span>Тяга: <strong className="text-purple-400">{suggestedWeights.pullUps.startWeight} кг</strong></span>
                  <span>•</span>
                  <span>Присед: <strong className="text-purple-400">{suggestedWeights.squat.startWeight} кг</strong></span>
                  <span>•</span>
                  <span>Біцепс: <strong className="text-cyan-400">{suggestedWeights.bicepsCurl.startWeight} кг</strong></span>
                </div>
              </div>

              <div>
                {justApplied ? (
                  <Badge className="bg-emerald-500 text-slate-950 font-bold text-xs py-1 px-2.5">
                    ✅ {language === "uk" ? "Застосовано до СМТ-1!" : language === "en" ? "Applied to SMT-1!" : "Применено к СМТ-1!"}
                  </Badge>
                ) : hasAppliedPrepWeights ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:text-white text-xs h-8"
                    onClick={handleApplySuggestedWeights}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    <span>{language === "uk" ? "Оновити ваги" : language === "en" ? "Re-apply" : "Обновить веса"}</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="accent"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 h-8"
                    onClick={handleApplySuggestedWeights}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>{language === "uk" ? "Застосувати у 1 клік" : language === "en" ? "Apply in 1-Click" : "Применить в 1 клик"}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{t.dashboard.progress}</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {completedCount} <span className="text-xs font-normal text-slate-500">/ 36</span>
          </div>
          <Progress value={completedCount} max={36} className="mt-2 h-1.5" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{t.common.tonnage}</span>
            <Dumbbell className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {Math.round(totalTonnage).toLocaleString()} <span className="text-xs font-normal text-slate-500">{t.common.kg}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.dashboard.totalVolume}</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{t.dashboard.avgPower}</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {avgPower} <span className="text-xs font-normal text-slate-500">{t.common.kg}/{t.common.min}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.dashboard.powerDensity}</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{t.dashboard.currentWeight}</span>
            <Ruler className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {latestBody ? latestBody.weightKg : "—"} <span className="text-xs font-normal text-slate-500">{t.common.kg}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {latestBody ? formatDate(latestBody.date) : t.dashboard.noMeasurements}
          </span>
        </div>
      </div>

      {/* Latest Athletic Score Spotlight Card */}
      {latestCompleted && latestScore && latestTierColor && (
        <div
          className={`rounded-2xl border ${latestTierColor.border} ${latestTierColor.bg} p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg ${latestTierColor.glow} transition-all`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-950 border ${latestTierColor.border} text-xl sm:text-2xl font-black ${latestTierColor.text} shadow-inner shrink-0`}
            >
              {latestScore.score}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.scoring.title} (#{latestCompleted.workoutNumber})
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${latestTierColor.bg} border ${latestTierColor.border} ${latestTierColor.text}`}
                >
                  {latestTierLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {t.scoring.relativeTonnage}: <strong className="text-white">{latestScore.relativeTonnage}x</strong> • {t.scoring.density}: <strong className="text-white">{latestScore.densityKgPerMin} {t.common.kg}/{t.common.min}</strong>
              </p>
            </div>
          </div>
          <Link href="/analytics">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs font-bold ${latestTierColor.text} hover:bg-white/10 shrink-0`}
            >
              <span>{t.nav.analytics}</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

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
            <div className="text-xs font-bold text-white">{t.dashboard.setup1pm}</div>
            <div className="text-[10px] text-slate-400">{t.dashboard.setup1pmDesc}</div>
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
            <div className="text-xs font-bold text-white">{t.dashboard.logBody}</div>
            <div className="text-[10px] text-slate-400">{t.dashboard.logBodyDesc}</div>
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
              <div className="text-xs font-bold text-white">{t.dashboard.charts}</div>
              <div className="text-[10px] text-slate-400">{t.dashboard.chartsDesc}</div>
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
                <span>{t.dashboard.latestCompleted}</span>
              </CardTitle>
              <span className="text-[10px] sm:text-xs text-slate-400">
                {latestCompleted.completedAt ? formatDate(latestCompleted.completedAt) : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-white">
                  {formatWorkoutTitle(
                    latestCompleted.workoutNumber,
                    latestCompleted.microcycle,
                    latestCompleted.week,
                    language
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {t.common.tonnage}: {latestCompleted.tonnageKg ?? 0} {t.common.kg} • {t.common.density}: {latestCompleted.powerKgPerMin ?? 0} {t.common.kg}/{t.common.min} • {t.common.time}: {formatTime(latestCompleted.durationSeconds ?? 0)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-white/10 hover:border-emerald-500/40"
                onClick={() => setSelectedReportWorkout(latestCompleted)}
              >
                {t.dashboard.viewReport}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <WarmupModal />
      <InitialSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
      <BodyLogModal isOpen={isBodyModalOpen} onClose={() => setIsBodyModalOpen(false)} />
      <WorkoutReportModal
        open={Boolean(selectedReportWorkout)}
        onOpenChange={(open) => !open && setSelectedReportWorkout(null)}
        workout={selectedReportWorkout}
      />
      <PrepWorkoutModal
        open={isPrepWorkoutOpen}
        onOpenChange={setIsPrepWorkoutOpen}
        onOpenCalculator={() => setIsPrepCalcOpen(true)}
      />
      <PrepCalculatorModal
        open={isPrepCalcOpen}
        onOpenChange={setIsPrepCalcOpen}
      />
    </div>
  );
}
