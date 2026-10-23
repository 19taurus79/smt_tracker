"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  Zap,
  Clock,
  Dumbbell,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Sliders,
  ChevronRight,
  Send,
  Camera,
  Flame,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { formatTime } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { calculateWorkoutTonnage, calculateWorkoutPower } from "@/lib/smt/calculator";
import { StoryShareModal } from "@/components/analytics/StoryShareModal";
import { generateWorkoutCoachMessage, shareToTelegramCoach, sendDirectCoachReport } from "@/lib/coach/telegramCoach";
import { isCoachAccount } from "@/lib/auth/roles";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";
import { calculateAthleticScore, getTierLabel, getTierColor } from "@/lib/scoring/athleticScore";
import { triggerHaptic } from "@/lib/tma/telegram";

interface FinishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: (reportSentToCoach?: boolean) => void;
  workoutId?: string;
}

export function FinishModal({ open, onOpenChange, onFinished, workoutId }: FinishModalProps) {
  const {
    activeWorkoutId,
    viewingWorkoutId,
    workouts,
    workoutElapsedSeconds,
    pauseStopwatch,
    finishWorkout,
  } = useWorkoutStore();
  const {
    weightIncrementKg,
    soundEnabled,
    hapticsEnabled,
    coachTelegramUsername,
    traineeName,
    gender,
    userAge,
    userRole,
    linkedTelegramUser,
  } = useSettingsStore();
  const { measurements } = useBodyStore();
  const { t, language } = useTranslation();

  const isCoach = userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id);

  // Fatigue & Condition (RPE & Tags)
  const [fatigueLevel, setFatigueLevel] = useState<number>(3); // 1-5 (default 3 = Важко/RPE 8)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false);
  const [tempNote, setTempNote] = useState("");

  const handleOpenNoteSheet = () => {
    setTempNote(customNote);
    setIsNoteSheetOpen(true);
    triggerHaptic("selection");
  };

  // Proposed increments per exercise ID: { [exerciseId]: incrementKg }
  const [exerciseIncrements, setExerciseIncrements] = useState<Record<string, number>>({});
  const [frozenDuration, setFrozenDuration] = useState<number>(0);
  const [sendToCoach, setSendToCoach] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isPublishingChallenge, setIsPublishingChallenge] = useState(false);
  const [publishedChallenge, setPublishedChallenge] = useState(false);

  const fatigueOptions = [
    { level: 1, emoji: "🟢", label: language === "uk" ? "Легко" : "Легко", rpe: "RPE 6" },
    { level: 2, emoji: "🔵", label: language === "uk" ? "Норм" : "Норм", rpe: "RPE 7" },
    { level: 3, emoji: "🟡", label: language === "uk" ? "Важко" : "Тяжело", rpe: "RPE 8" },
    { level: 4, emoji: "🟠", label: language === "uk" ? "На межі" : "На пределе", rpe: "RPE 9" },
    { level: 5, emoji: "🔴", label: language === "uk" ? "Відмова" : "Отказ", rpe: "RPE 10" },
  ];

  const conditionTags = [
    { id: "sleep", label: language === "uk" ? "😴 Мало спав" : "😴 Мало спал" },
    { id: "fresh", label: language === "uk" ? "⚡️ Повен сил" : "⚡️ Полон сил" },
    { id: "sick", label: language === "uk" ? "🤧 Прихворів" : "🤧 Приболел" },
    { id: "alcohol", label: language === "uk" ? "🍺 Алкоголь напередодні" : "🍺 Алкоголь накануне" },
    { id: "stress", label: language === "uk" ? "🤯 Стрес на роботі" : "🤯 Стресс на работе" },
    { id: "no_preworkout", label: language === "uk" ? "☕️ Без передтрену" : "☕️ Без предтрена" },
    { id: "rest_kept", label: language === "uk" ? "⏱ 30с витримано" : "⏱ 30с выдержано" },
    { id: "food", label: language === "uk" ? "🍕 Збив режим їжі" : "🍕 Сбил режим еды" },
  ];

  const toggleTag = (tagLabel: string) => {
    triggerHaptic("selection");
    setSelectedTags((prev) =>
      prev.includes(tagLabel) ? prev.filter((t) => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const buildFullNotes = () => {
    const fatigueObj = fatigueOptions.find((f) => f.level === fatigueLevel);
    const fatigueText = fatigueObj ? `Втома: ${fatigueObj.level}/5 (${fatigueObj.label}, ${fatigueObj.rpe})` : "";
    const tagsText = selectedTags.length > 0 ? selectedTags.join(" ") : "";
    return [fatigueText, tagsText, customNote.trim()].filter(Boolean).join(" • ");
  };

  useEffect(() => {
    if (open) {
      setSendToCoach(!isCoach && Boolean(coachTelegramUsername));
    }
  }, [open, isCoach, coachTelegramUsername]);

  const targetWorkoutId = workoutId || activeWorkoutId || viewingWorkoutId;
  const currentWorkout =
    workouts.find((w) => w.id === targetWorkoutId) ||
    workouts.find((w) => w.id === activeWorkoutId) ||
    workouts.find((w) => w.status === "in_progress") ||
    workouts.find((w) => w.status === "completed") ||
    workouts[0];

  useEffect(() => {
    if (open) {
      pauseStopwatch();
      const dur = currentWorkout?.durationSeconds || workoutElapsedSeconds || 1;
      setFrozenDuration(dur);
    } else {
      setFrozenDuration(0);
    }
  }, [open, currentWorkout]);

  const effectiveDuration =
    frozenDuration > 0
      ? frozenDuration
      : currentWorkout?.durationSeconds || workoutElapsedSeconds || 1;
  const tonnage = currentWorkout
    ? calculateWorkoutTonnage(currentWorkout.supersets)
    : 0;
  const power = calculateWorkoutPower(tonnage, effectiveDuration);

  // Check if current workout is the last one in the microcycle (e.g. 9, 18, 27, 36)
  const isEndOfMicrocycle = currentWorkout ? currentWorkout.workoutNumber % 9 === 0 : false;

  const athleteWeight = measurements[0]?.weightKg || 80;
  const athleticScore = calculateAthleticScore({
    tonnageKg: tonnage,
    durationSeconds: effectiveDuration,
    bodyWeightKg: athleteWeight,
    gender,
    age: userAge,
  });

  const handlePublishChallenge = async () => {
    if (isPublishingChallenge || publishedChallenge) return;
    setIsPublishingChallenge(true);
    triggerHaptic("selection");
    try {
      const fullNotes = buildFullNotes();
      const res = await fetch("/api/challenge/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutNumber: currentWorkout?.workoutNumber || 1,
          microcycle: currentWorkout?.microcycle || 1,
          durationSeconds: effectiveDuration,
          tonnageKg: tonnage,
          powerKgPerMin: power,
          athleticScore: {
            ...athleticScore,
            tierLabel,
          },
          athleteName: traineeName || window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "",
          athleteUsername: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || "",
          notes: fullNotes,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishedChallenge(true);
        triggerHaptic("success");
      }
    } catch (e) {
      console.error("Failed to publish to challenge:", e);
    } finally {
      setIsPublishingChallenge(false);
    }
  };
  const tierColor = getTierColor(athleticScore.tierKey);
  const tierLabel = getTierLabel(athleticScore.tierKey, t);

  // Collect unique exercises from the current workout
  const uniqueExercises = React.useMemo(() => {
    if (!currentWorkout) return [];
    const list: Array<{ id: string; name: string; currentWeight: number; allCompleted: boolean }> = [];
    const seen = new Set<string>();

    for (const ss of currentWorkout.supersets) {
      for (const ex of ss.exercises) {
        if (!seen.has(ex.exerciseId)) {
          seen.add(ex.exerciseId);
          const allCompleted = ex.sets.every(
            (s) => s.completed && (s.actualReps ? s.actualReps >= s.targetReps : true)
          );
          const currentWeight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
          list.push({
            id: ex.exerciseId,
            name: ex.name,
            currentWeight,
            allCompleted,
          });
        }
      }
    }
    return list;
  }, [currentWorkout]);

  // Pre-fill increment recommendations
  useEffect(() => {
    if (open && uniqueExercises.length > 0) {
      const initial: Record<string, number> = {};
      for (const ex of uniqueExercises) {
        initial[ex.id] = ex.allCompleted ? weightIncrementKg : 0;
      }
      setExerciseIncrements(initial);

      // Trigger celebratory confetti
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#10b981", "#38bdf8", "#f59e0b", "#ec4899"],
      });
    }
  }, [open, uniqueExercises, weightIncrementKg]);

  const [isFinishing, setIsFinishing] = useState(false);

  const allIncrementsActive =
    uniqueExercises.length > 0 &&
    uniqueExercises.every((ex) => (exerciseIncrements[ex.id] ?? 0) > 0);

  const toggleAllIncrements = () => {
    triggerHaptic("selection");
    if (allIncrementsActive) {
      const reset: Record<string, number> = {};
      for (const ex of uniqueExercises) reset[ex.id] = 0;
      setExerciseIncrements(reset);
    } else {
      const applied: Record<string, number> = {};
      for (const ex of uniqueExercises) applied[ex.id] = weightIncrementKg;
      setExerciseIncrements(applied);
    }
  };

  const toggleExerciseIncrement = (exerciseId: string, currentVal: number) => {
    triggerHaptic("selection");
    setExerciseIncrements((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId] > 0 ? 0 : weightIncrementKg,
    }));
  };

  const handleComplete = async () => {
    if (!currentWorkout || isFinishing) return;
    setIsFinishing(true);
    triggerHaptic("medium");

    try {
      const fullNotes = buildFullNotes();
      finishWorkout(
        fullNotes,
        exerciseIncrements,
        weightIncrementKg,
        soundEnabled,
        hapticsEnabled,
        effectiveDuration,
        currentWorkout.id
      );

      let didSendToCoach = false;
      if (sendToCoach && !isCoach) {
        didSendToCoach = true;
        const exercisesSummary = currentWorkout.supersets.flatMap((ss) =>
          ss.exercises.map((ex) => ({
            name: getLocalizedExerciseName(ex.exerciseId || ex.name, language, false),
            weight: ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0,
            reps: ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10,
            setsCount: ex.sets.filter((s) => s.completed).length || ex.sets.length,
            supersetLabel: ss.label,
          }))
        );

        sendDirectCoachReport({
          traineeName: traineeName || linkedTelegramUser?.firstName || (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name) || "Атлет",
          traineeUsername: linkedTelegramUser?.username || (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.username) || "",
          workoutNumber: currentWorkout.workoutNumber || 1,
          microcycle: currentWorkout.microcycle || 1,
          durationSeconds: effectiveDuration,
          tonnageKg: tonnage,
          powerKgPerMin: power,
          athleticScore: {
            score: athleticScore.score,
            tierKey: athleticScore.tierKey,
            tierLabel,
          },
          latestMeasurement: measurements[0] ? {
            weightKg: measurements[0].weightKg,
            waistCm: measurements[0].waistCm,
            bicepsCm: measurements[0].bicepsCm,
          } : undefined,
          exercises: exercisesSummary,
          notes: fullNotes,
        }).catch((err) => console.error("Direct coach send failed:", err));
      }

      onOpenChange(false);
      onFinished(didSendToCoach);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleClose = () => {
    const fullNotes = buildFullNotes();
    if (currentWorkout && (fullNotes || Object.keys(exerciseIncrements).length > 0)) {
      finishWorkout(
        fullNotes,
        exerciseIncrements,
        weightIncrementKg,
        soundEnabled,
        hapticsEnabled,
        effectiveDuration,
        currentWorkout.id
      );
    }
    onOpenChange(false);
  };

  if (!currentWorkout) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else onOpenChange(true); }}>
      <DialogHeader className="shrink-0 mb-2">
        <DialogTitle onClose={handleClose}>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <span>
              {isEndOfMicrocycle
                ? `🎉 ${t.common.microcycle} ${currentWorkout.microcycle} ${t.program.statusCompleted}!`
                : t.workout.finishModalTitle}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {isEndOfMicrocycle
            ? `${t.workout.finishModalDesc} ${t.common.microcycle}-${currentWorkout.microcycle}.`
            : t.workout.finishModalDesc}
        </DialogDescription>
      </DialogHeader>

      {/* Scrollable Body with flex-1 min-h-0 so footer NEVER gets cut off */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 pr-1 py-1">
        {/* Athletic Score Hero Banner */}
        <div
          className={`p-3 sm:p-4 rounded-2xl border ${tierColor.border} ${tierColor.bg} flex items-center justify-between gap-3 shadow-lg ${tierColor.glow} transition-all`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-950 border ${tierColor.border} text-xl sm:text-2xl font-black ${tierColor.text} shadow-inner shrink-0`}
            >
              {athleticScore.score}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.scoring.athleticScoreLabel}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${tierColor.bg} border ${tierColor.border} ${tierColor.text}`}
                >
                  {tierLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {t.scoring.relativeTonnage}: <strong className="text-white">{athleticScore.relativeTonnage}x</strong> • {t.scoring.density}: <strong className="text-white">{athleticScore.densityKgPerMin} {t.common.kg}/{t.common.min}</strong>
              </p>
            </div>
          </div>
          <Sparkles className={`h-6 w-6 ${tierColor.text} shrink-0 animate-pulse`} />
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Dumbbell className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t.common.tonnage}</span>
            <span className="text-xs sm:text-sm font-black text-white">{tonnage} {t.common.kg}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Clock className="h-4 w-4 text-cyan-400 mb-1" />
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t.common.time}</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {formatTime(effectiveDuration)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="h-4 w-4 text-amber-400 mb-1" />
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t.common.density}</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {power} <span className="text-[9px] text-slate-400 font-normal">{t.common.kg}/{t.common.min}</span>
            </span>
          </div>
        </div>

        {/* Progression Proposal Section (Clean & Smart Toggle) */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-xs sm:text-sm text-white truncate">
                {language === "uk"
                  ? "Прогресія робочих ваг"
                  : language === "en"
                  ? "Weight Progression"
                  : "Прогрессия рабочих весов"}
              </span>
            </div>

            {/* Quick 1-tap toggle for all */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAllIncrements}
              className={`h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all ${
                allIncrementsActive
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-slate-900/80 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {allIncrementsActive
                ? (language === "uk" ? `✓ Додати +${weightIncrementKg} кг на всі` : `✓ Добавить +${weightIncrementKg} кг на все`)
                : (language === "uk" ? "Залишити поточні" : "Оставить текущие")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {uniqueExercises.map((ex) => {
              const currentInc = exerciseIncrements[ex.id] ?? 0;
              const willIncrease = currentInc > 0;
              const nextWeight = ex.currentWeight + currentInc;

              return (
                <div
                  key={ex.id}
                  onClick={() => toggleExerciseIncrement(ex.id, currentInc)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                    willIncrease
                      ? "bg-emerald-950/35 border-emerald-500/40 text-white"
                      : "bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/15"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-bold text-[11px] sm:text-xs block text-white truncate">
                      {getLocalizedExerciseName(ex.name, language, false)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ex.currentWeight} {t.common.kg} →{" "}
                      <strong className={willIncrease ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {nextWeight} {t.common.kg}
                      </strong>
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors ${
                      willIncrease
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-white/5 text-slate-500 border border-white/5"
                    }`}
                  >
                    {willIncrease ? `+${currentInc} ${t.common.kg}` : `0 ${t.common.kg}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fatigue & Condition (RPE scale + smart pills) */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-3.5 space-y-3">
          {/* RPE 1-5 Scale */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🔋 {language === "uk" ? "Рівень втоми (RPE):" : "Уровень усталости (RPE):"}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {fatigueOptions.find((f) => f.level === fatigueLevel)?.rpe} • {fatigueOptions.find((f) => f.level === fatigueLevel)?.label}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {fatigueOptions.map((item) => {
                const isSelected = fatigueLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setFatigueLevel(item.level);
                    }}
                    className={`py-1.5 px-1 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                        : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-sm sm:text-base block">{item.emoji}</span>
                    <span className="text-[10px] font-bold block mt-0.5">{item.level}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Tags Pills */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 block">
              🏷 {language === "uk" ? "Що вплинуло на тренування? (оберіть якщо є):" : "Что повлияло на тренировку? (выберите если есть):"}
            </span>

            <div className="flex flex-wrap gap-1.5">
              {conditionTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.label);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.label)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-sm"
                        : "bg-slate-900/80 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Note Trigger / Preview Card */}
          <div className="pt-1">
            {!customNote.trim() ? (
              <button
                type="button"
                onClick={handleOpenNoteSheet}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-white/20 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">✍️</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                      {language === "uk" ? "+ Додати замітку текстом" : "+ Добавить заметку текстом"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {language === "uk" ? "Зручне вікно для введення на весь екран" : "Удобное окно для ввода на весь экран"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </button>
            ) : (
              <div
                onClick={handleOpenNoteSheet}
                className="w-full p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/30 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                    <span>✍️</span> {language === "uk" ? "Ваша замітка" : "Ваша заметка"}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-white flex items-center gap-0.5">
                    {language === "uk" ? "Змінити" : "Изменить"}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 italic">
                  &ldquo;{customNote}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coach Direct Report */}
        {!isCoach && (
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-white/10 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendToCoach}
              onChange={(e) => setSendToCoach(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                <span>{t.workout.sendCoachButton}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                {language === "uk"
                  ? `Прямий звіт тренеру @${(coachTelegramUsername || "OnyshchenkoSergey").replace("@", "")}`
                  : `Прямой отчет тренеру @${(coachTelegramUsername || "OnyshchenkoSergey").replace("@", "")}`}
              </span>
            </div>
          </label>
        )}

        {/* Social Sharing & Community Challenge */}
        <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-3 flex flex-col gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>{language === "uk" ? "Поділитися успіхом" : "Поделиться успехом"}</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPublishingChallenge || publishedChallenge}
              className={`h-9 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                publishedChallenge
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              }`}
              onClick={handlePublishChallenge}
            >
              <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {publishedChallenge
                  ? (language === "uk" ? "✓ Опубліковано в канал!" : "✓ Опубликовано в канал!")
                  : isPublishingChallenge
                  ? (language === "uk" ? "Публікація..." : "Публикация...")
                  : (language === "uk" ? "📢 В канал @athletic_league" : "📢 В канал @athletic_league")}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold border-pink-500/30 text-pink-300 hover:bg-pink-500/10 flex items-center justify-center gap-1.5"
              onClick={() => setIsStoryModalOpen(true)}
            >
              <Camera className="h-3.5 w-3.5 text-pink-400 shrink-0" />
              <span className="truncate">
                {language === "uk" ? "📸 Створити Stories" : "📸 Создать Stories"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Finish Action: Big, prominent, always visible at bottom */}
      <div className="pt-2 border-t border-white/10 flex flex-col gap-2 shrink-0">
        <Button
          variant="accent"
          size="lg"
          disabled={isFinishing}
          className="w-full h-12 font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 hover:opacity-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-transform"
          onClick={handleComplete}
        >
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>
            {isFinishing
              ? (language === "uk" ? "Збереження..." : "Сохранение...")
              : (language === "uk" ? "✔ ЗБЕРЕГТИ ТА ЗАКРИТИ" : "✔ СОХРАНИТЬ И ЗАКРЫТЬ")}
          </span>
        </Button>
      </div>

      <StoryShareModal
        open={isStoryModalOpen}
        onOpenChange={setIsStoryModalOpen}
        workout={{
          ...currentWorkout,
          durationSeconds: effectiveDuration,
          tonnageKg: tonnage,
          powerKgPerMin: power,
          notes: buildFullNotes(),
        }}
        latestMeasurement={measurements[0]}
      />

      {/* Dedicated Note Bottom Sheet / Modal (High Z-Index, Full Ergonomics) */}
      {isNoteSheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          {/* Backdrop click to dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsNoteSheetOpen(false);
              triggerHaptic("light");
            }}
          />

          <div
            className="relative z-10 w-full sm:max-w-lg bg-slate-900 border border-white/15 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto"
            style={{
              paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
            }}
          >
            {/* Grab handle for bottom sheet on mobile */}
            <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto sm:hidden -mt-1 mb-1" />

            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="text-lg">✍️</span>
                  <span>{language === "uk" ? "Замітка до тренування" : "Заметка к тренировке"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === "uk"
                    ? "Опишіть відчуття, самопочуття або важливі нюанси підходів"
                    : "Опишите ощущения, самочувствие или важные нюансы подходов"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNoteSheetOpen(false);
                  triggerHaptic("light");
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            <textarea
              autoFocus
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              rows={6}
              placeholder={
                language === "uk"
                  ? "Наприклад: трохи тягнуло ліве плече на 3 сеті, жим гантелей пішов дуже впевнено..."
                  : "Например: немного тянуло левое плечо на 3 сете, жим гантелей пошел очень уверенно..."
              }
              className="w-full rounded-xl border border-white/15 bg-slate-950 p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none leading-relaxed"
            />

            <div className="flex items-center gap-2 pt-1">
              {tempNote.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempNote("");
                    triggerHaptic("light");
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5"
                >
                  {language === "uk" ? "Очистити" : "Очистить"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsNoteSheetOpen(false);
                  triggerHaptic("light");
                }}
                className="text-xs border-white/15 text-slate-300 hover:text-white"
              >
                {language === "uk" ? "Скасувати" : "Отмена"}
              </Button>
              <Button
                type="button"
                variant="accent"
                className="flex-1 font-bold text-xs sm:text-sm h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                onClick={() => {
                  setCustomNote(tempNote.trim());
                  setIsNoteSheetOpen(false);
                  triggerHaptic("success");
                }}
              >
                {language === "uk" ? "✓ Зберегти замітку" : "✓ Сохранить заметку"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
