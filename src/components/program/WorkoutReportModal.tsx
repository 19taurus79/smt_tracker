"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Clock,
  Dumbbell,
  Zap,
  CheckCircle2,
  FileText,
  RotateCcw,
  Calendar,
  Send,
  Camera,
  Sparkles,
  Flame,
} from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { formatTime, formatDate } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmResetModal } from "@/components/workout/ConfirmResetModal";
import { StoryShareModal } from "@/components/analytics/StoryShareModal";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { generateWorkoutCoachMessage, shareToTelegramCoach, sendDirectCoachReport } from "@/lib/coach/telegramCoach";
import { isCoachAccount } from "@/lib/auth/roles";
import { useTranslation } from "@/lib/i18n";
import {
  getLocalizedExerciseName,
  formatWorkoutTitle,
  formatSupersetLabel,
  formatSupersetType,
} from "@/lib/i18n/exercises";
import { calculateAthleticScore, getTierLabel, getTierColor } from "@/lib/scoring/athleticScore";

interface WorkoutReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  onRestart?: (workoutId: string) => void;
  initialSentToCoach?: boolean;
}

export function WorkoutReportModal({
  open,
  onOpenChange,
  workout,
  onRestart,
  initialSentToCoach = false,
}: WorkoutReportModalProps) {
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isPublishingChallenge, setIsPublishingChallenge] = useState(false);
  const [publishedChallenge, setPublishedChallenge] = useState(false);
  const [isSendingToCoach, setIsSendingToCoach] = useState(false);
  const [sentToCoach, setSentToCoach] = useState(Boolean(initialSentToCoach));

  useEffect(() => {
    if (initialSentToCoach) {
      setSentToCoach(true);
    }
  }, [initialSentToCoach]);

  const { coachTelegramUsername, traineeName, gender, userAge, userRole, linkedTelegramUser } = useSettingsStore();
  const { measurements } = useBodyStore();
  const { t, language } = useTranslation();

  const isCoach = userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id);

  if (!workout) return null;

  const calcDurFallback = (workout.completedAt && workout.startedAt)
    ? Math.round((new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) / 1000)
    : 0;
  const effectiveDuration = (workout.durationSeconds && workout.durationSeconds > 0)
    ? workout.durationSeconds
    : (calcDurFallback > 0 ? calcDurFallback : 0);

  const athleteWeight = measurements[0]?.weightKg || 80;
  const athleticScore = calculateAthleticScore({
    tonnageKg: workout.tonnageKg || 0,
    durationSeconds: effectiveDuration,
    bodyWeightKg: athleteWeight,
    gender,
    age: userAge,
    workout,
  });
  const tierColor = getTierColor(athleticScore.tierKey);
  const tierLabel = getTierLabel(athleticScore.tierKey, t);

  const handlePublishChallenge = async () => {
    if (!workout || isPublishingChallenge || publishedChallenge) return;
    setIsPublishingChallenge(true);
    try {
      const res = await fetch("/api/challenge/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutNumber: workout.workoutNumber || 1,
          microcycle: workout.microcycle || 1,
          durationSeconds: effectiveDuration,
          tonnageKg: workout.tonnageKg || 0,
          powerKgPerMin: workout.powerKgPerMin || 0,
          athleticScore: {
            ...athleticScore,
            tierLabel,
          },
          athleteName: traineeName || (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name) || "",
          athleteUsername: (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.username) || "",
          notes: workout.notes,
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

  const handleSendToCoach = async () => {
    if (!workout || isSendingToCoach || sentToCoach) return;
    setIsSendingToCoach(true);
    try {
      const exercisesSummary = workout.supersets.flatMap((ss) =>
        ss.exercises.map((ex) => ({
          name: getLocalizedExerciseName(ex.exerciseId || ex.name, language, false),
          weight: ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0,
          reps: ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10,
          setsCount: ex.sets.filter((s) => s.completed).length || ex.sets.length,
          supersetLabel: ss.label,
        }))
      );

      const success = await sendDirectCoachReport({
        traineeName: traineeName || linkedTelegramUser?.firstName || (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name) || "Атлет",
        traineeUsername: linkedTelegramUser?.username || (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.username) || "",
        workoutNumber: workout.workoutNumber || 1,
        microcycle: workout.microcycle || 1,
        durationSeconds: effectiveDuration,
        tonnageKg: workout.tonnageKg || 0,
        powerKgPerMin: workout.powerKgPerMin || 0,
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
        notes: workout.notes,
      });

      if (success) {
        setSentToCoach(true);
      }
    } catch (e) {
      console.error("Direct coach send failed:", e);
    } finally {
      setIsSendingToCoach(false);
    }
  };

  const reportTitle =
    language === "uk"
      ? `Звіт про тренування #${workout.workoutNumber}`
      : language === "en"
      ? `Workout Report #${workout.workoutNumber}`
      : `Отчет о тренировке #${workout.workoutNumber}`;

  const completedAtText =
    language === "uk"
      ? "Завершено:"
      : language === "en"
      ? "Completed:"
      : "Завершена:";

  const exercisesTitle =
    language === "uk"
      ? "Виконані вправи та підходи"
      : language === "en"
      ? "Completed Exercises & Sets"
      : "Выполненные упражнения и подходы";

  const repeatWorkoutText =
    language === "uk"
      ? "Повторити тренування"
      : language === "en"
      ? "Restart Workout"
      : "Повторить тренировку";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-xl"
    >
      <DialogHeader className="shrink-0 mb-1">
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="truncate">{reportTitle}</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {formatWorkoutTitle(workout.workoutNumber, workout.microcycle, workout.week, language)}
          {workout.completedAt && (
            <span className="block text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{completedAtText} {formatDate(workout.completedAt)}</span>
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 my-1.5 pr-1">
        {/* Athletic Score Hero Banner */}
        <div
          className={`p-3 rounded-2xl border ${tierColor.border} ${tierColor.bg} flex items-center justify-between gap-3 shadow-md ${tierColor.glow}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 border ${tierColor.border} text-lg font-black ${tierColor.text} shadow-inner shrink-0`}
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
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                {t.scoring.relativeTonnage}: <strong className="text-white">{athleticScore.relativeTonnage}x</strong> • {t.scoring.density}: <strong className="text-white">{athleticScore.densityKgPerMin} {t.common.kg}/{t.common.min}</strong>
              </p>
            </div>
          </div>
          <Sparkles className={`h-5 w-5 ${tierColor.text} shrink-0 animate-pulse`} />
        </div>

        {/* KPI Metrics Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Dumbbell className="h-4 w-4 text-emerald-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.common.tonnage}</span>
            <span className="text-sm sm:text-base font-black text-white">
              {workout.tonnageKg ?? 0} {t.common.kg}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Clock className="h-4 w-4 text-cyan-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.common.time}</span>
            <span className="font-mono text-sm sm:text-base font-black text-white">
              {formatTime(workout.durationSeconds ?? 0)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="h-4 w-4 text-amber-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.common.density}</span>
            <span className="font-mono text-sm sm:text-base font-black text-amber-400">
              {workout.powerKgPerMin ?? 0}{" "}
              <span className="text-[9px] text-slate-500 font-normal">{t.common.kg}/{t.common.min}</span>
            </span>
          </div>
        </div>

        {/* Exercises Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {exercisesTitle}
          </h4>

          {workout.supersets.map((ss, idx) => (
            <div
              key={ss.id}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 space-y-2"
            >
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                <span>{formatSupersetLabel(ss.label, language)}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {formatSupersetType(ss.type === "single", language)}
                </span>
              </div>

              <div className="space-y-2 pt-1 border-t border-white/5">
                {ss.exercises.map((ex) => (
                  <div key={ex.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {getLocalizedExerciseName(ex.name, language, false)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ex.category === "main" ? t.workout.mainExercise : t.workout.accessoryExercise}
                      </span>
                    </div>

                    {/* Sets chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                      {ex.sets.map((s) => {
                        const weight = s.actualWeight ?? s.targetWeight;
                        const reps = s.actualReps ?? s.targetReps;
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between px-2 py-1 rounded-lg border ${
                              s.completed
                                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                                : "bg-white/5 border-white/5 text-slate-400"
                            }`}
                          >
                            <span className="text-[10px] text-slate-500">#{s.setNumber}</span>
                            <span className="font-bold">
                              {weight} {t.common.kg} × {reps}
                            </span>
                            {s.completed ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <span className="text-[10px] text-slate-500">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notes if present */}
        {workout.notes && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
            <span className="font-bold text-white block mb-0.5">{t.body.notes}:</span>
            <p className="italic">{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPublishingChallenge || publishedChallenge}
          className={`text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            publishedChallenge
              ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
              : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          }`}
          onClick={handlePublishChallenge}
        >
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span>
            {publishedChallenge
              ? (language === "uk" ? "В каналі!" : language === "en" ? "In Channel!" : "В канале!")
              : isPublishingChallenge
              ? (language === "uk" ? "Публікація..." : language === "en" ? "Publishing..." : "Публикация...")
              : (language === "uk" ? "Челендж" : language === "en" ? "Challenge" : "Челлендж")}
          </span>
        </Button>

        {!isCoach && (
          <Button
            variant="outline"
            size="sm"
            disabled={isSendingToCoach || sentToCoach}
            className={`text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              sentToCoach
                ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                : "border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            }`}
            onClick={handleSendToCoach}
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {sentToCoach
                ? (language === "uk" ? "✓ Надіслано тренеру!" : language === "en" ? "✓ Sent to Coach!" : "✓ Отправлено тренеру!")
                : isSendingToCoach
                ? (language === "uk" ? "Надсилання..." : language === "en" ? "Sending..." : "Отправка...")
                : t.workout.sendCoachButton}
            </span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="text-xs font-semibold border-pink-500/30 text-pink-300 hover:bg-pink-500/10 flex items-center justify-center gap-1.5"
          onClick={() => setIsStoryModalOpen(true)}
        >
          <Camera className="h-3.5 w-3.5 text-pink-400" />
          <span>{t.workout.shareStoryButton}</span>
        </Button>

        {onRestart && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-semibold border-rose-500/30 text-rose-300 hover:bg-rose-500/10 flex items-center justify-center gap-1.5"
            onClick={() => setIsConfirmResetOpen(true)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{repeatWorkoutText}</span>
          </Button>
        )}

        <Button
          variant="accent"
          size="sm"
          className="font-bold text-xs sm:ml-auto"
          onClick={() => onOpenChange(false)}
        >
          {t.common.close}
        </Button>
      </div>

      <StoryShareModal
        open={isStoryModalOpen}
        onOpenChange={setIsStoryModalOpen}
        workout={workout}
        latestMeasurement={measurements[0]}
      />

      <ConfirmResetModal
        open={isConfirmResetOpen}
        onOpenChange={setIsConfirmResetOpen}
        workout={workout}
        onConfirmReset={() => {
          setIsConfirmResetOpen(false);
          onOpenChange(false);
          onRestart?.(workout.id);
        }}
      />
    </Dialog>
  );
}
