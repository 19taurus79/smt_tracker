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
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { formatTime } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { calculateWorkoutTonnage, calculateWorkoutPower } from "@/lib/smt/calculator";
import { StoryShareModal } from "@/components/analytics/StoryShareModal";
import { generateWorkoutCoachMessage, shareToTelegramCoach } from "@/lib/coach/telegramCoach";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";
import { calculateAthleticScore, getTierLabel, getTierColor } from "@/lib/scoring/athleticScore";

interface FinishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
}

export function FinishModal({ open, onOpenChange, onFinished }: FinishModalProps) {
  const {
    activeWorkoutId,
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
  } = useSettingsStore();
  const { measurements } = useBodyStore();
  const { t, language } = useTranslation();

  const [notes, setNotes] = useState("");
  // Proposed increments per exercise ID: { [exerciseId]: incrementKg }
  const [exerciseIncrements, setExerciseIncrements] = useState<Record<string, number>>({});
  const [frozenDuration, setFrozenDuration] = useState<number>(0);
  const [sendToCoach, setSendToCoach] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isPublishingChallenge, setIsPublishingChallenge] = useState(false);
  const [publishedChallenge, setPublishedChallenge] = useState(false);

  useEffect(() => {
    if (open) {
      setSendToCoach(Boolean(coachTelegramUsername));
    }
  }, [open, coachTelegramUsername]);

  useEffect(() => {
    if (open) {
      pauseStopwatch();
      setFrozenDuration(workoutElapsedSeconds || 1);
    } else {
      setFrozenDuration(0);
    }
  }, [open]);

  const effectiveDuration = frozenDuration > 0 ? frozenDuration : (workoutElapsedSeconds || 1);
  const currentWorkout =
    workouts.find((w) => w.id === activeWorkoutId) ||
    workouts.find((w) => w.status === "in_progress") ||
    workouts.find((w) => w.status === "upcoming") ||
    workouts[0];
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
    try {
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
          notes,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishedChallenge(true);
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

  const toggleExerciseIncrement = (exerciseId: string, currentVal: number) => {
    setExerciseIncrements((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId] > 0 ? 0 : weightIncrementKg,
    }));
  };

  const handleComplete = () => {
    if (!currentWorkout) return;

    finishWorkout(
      notes,
      exerciseIncrements,
      weightIncrementKg,
      soundEnabled,
      hapticsEnabled,
      effectiveDuration,
      currentWorkout.id
    );

    if (sendToCoach) {
      const msg = generateWorkoutCoachMessage({
        workout: {
          ...currentWorkout,
          durationSeconds: effectiveDuration,
          tonnageKg: tonnage,
          powerKgPerMin: power,
          notes,
        },
        traineeName,
        weightIncrement: weightIncrementKg,
        latestMeasurement: measurements[0],
        language,
        gender,
        userAge,
      });
      shareToTelegramCoach(msg, coachTelegramUsername);
    }

    onOpenChange(false);
    onFinished();
  };

  if (!currentWorkout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
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

      <div className="space-y-4 my-2 max-h-[72vh] overflow-y-auto pr-1">
        {/* Athletic Score Hero Banner */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border ${tierColor.border} ${tierColor.bg} flex items-center justify-between gap-3 shadow-lg ${tierColor.glow} transition-all`}
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
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Dumbbell className="h-5 w-5 text-emerald-400 mb-1" />
            <span className="text-[11px] text-slate-400 font-medium">{t.common.tonnage}</span>
            <span className="text-base font-black text-white">{tonnage} {t.common.kg}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Clock className="h-5 w-5 text-cyan-400 mb-1" />
            <span className="text-[11px] text-slate-400 font-medium">{t.common.time}</span>
            <span className="text-base font-black text-white">
              {formatTime(effectiveDuration)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="h-5 w-5 text-amber-400 mb-1" />
            <span className="text-[11px] text-slate-400 font-medium">{t.common.density}</span>
            <span className="text-base font-black text-white">
              {power} <span className="text-[10px] text-slate-400 font-normal">{t.common.kg}/{t.common.min}</span>
            </span>
          </div>
        </div>

        {/* Progression Proposal Section */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-xs sm:text-sm text-white">
                {language === "uk"
                  ? "Пропозиція збільшення робочих ваг"
                  : language === "en"
                  ? "Weight Progression Proposal"
                  : "Предложение прибавки к весам"}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +{weightIncrementKg} {t.common.kg}
            </span>
          </div>

          <div className="space-y-2">
            {uniqueExercises.map((ex) => {
              const currentInc = exerciseIncrements[ex.id] ?? 0;
              const willIncrease = currentInc > 0;
              const nextWeight = ex.currentWeight + currentInc;

              return (
                <div
                  key={ex.id}
                  onClick={() => toggleExerciseIncrement(ex.id, currentInc)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    willIncrease
                      ? "bg-emerald-950/40 border-emerald-500/40 text-white"
                      : "bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={willIncrease}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs block text-white">
                        {getLocalizedExerciseName(ex.name, language, false)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ex.currentWeight} {t.common.kg} →{" "}
                        <strong className={willIncrease ? "text-emerald-400 font-bold" : "text-slate-300"}>
                          {nextWeight} {t.common.kg}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      willIncrease
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-slate-500"
                    }`}
                  >
                    {willIncrease ? `+${currentInc} ${t.common.kg}` : `0 ${t.common.kg}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            {t.body.notes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t.workout.notesPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Coach Sharing & Instagram Stories */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendToCoach}
              onChange={(e) => setSendToCoach(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                <span>{t.workout.sendCoachButton}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {coachTelegramUsername
                  ? `@${coachTelegramUsername.replace("@", "")}`
                  : language === "uk"
                  ? "У Telegram відкриється вибір контакту"
                  : language === "en"
                  ? "Telegram contact picker will open"
                  : "В Telegram откроется выбор контакта"}
              </span>
            </div>
          </label>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPublishingChallenge || publishedChallenge}
              className={`text-xs font-semibold transition-all ${
                publishedChallenge
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              }`}
              onClick={handlePublishChallenge}
            >
              <Flame className="h-3.5 w-3.5 mr-1 text-amber-400" />
              <span>
                {publishedChallenge
                  ? (language === "uk" ? "В каналі!" : language === "en" ? "In Channel!" : "В канале!")
                  : isPublishingChallenge
                  ? (language === "uk" ? "Публікація..." : language === "en" ? "Publishing..." : "Публикация...")
                  : (language === "uk" ? "Челендж" : language === "en" ? "Challenge" : "Челлендж")}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-semibold border-pink-500/30 text-pink-300 hover:bg-pink-500/10"
              onClick={() => setIsStoryModalOpen(true)}
            >
              <Camera className="h-3.5 w-3.5 mr-1 text-pink-400" />
              <span>{t.workout.shareStoryButton}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2 shrink-0">
        <Button
          variant="accent"
          size="lg"
          className="w-full font-bold text-xs sm:text-sm px-3 py-3 flex items-center justify-center gap-2 text-center leading-snug"
          onClick={handleComplete}
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{t.workout.applyWeightsAndSave}</span>
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
          notes,
        }}
        latestMeasurement={measurements[0]}
      />
    </Dialog>
  );
}
