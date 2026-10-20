"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { formatTime, formatDate } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmResetModal } from "@/components/workout/ConfirmResetModal";
import { StoryShareModal } from "@/components/analytics/StoryShareModal";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { generateWorkoutCoachMessage, shareToTelegramCoach } from "@/lib/coach/telegramCoach";
import { useTranslation } from "@/lib/i18n";
import {
  getLocalizedExerciseName,
  formatWorkoutTitle,
  formatSupersetLabel,
  formatSupersetType,
} from "@/lib/i18n/exercises";

interface WorkoutReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  onRestart?: (workoutId: string) => void;
}

export function WorkoutReportModal({
  open,
  onOpenChange,
  workout,
  onRestart,
}: WorkoutReportModalProps) {
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const { coachTelegramUsername, traineeName } = useSettingsStore();
  const { measurements } = useBodyStore();
  const { t, language } = useTranslation();

  const handleSendToCoach = () => {
    if (!workout) return;
    const msg = generateWorkoutCoachMessage({
      workout,
      traineeName,
      weightIncrement: 2.5,
      latestMeasurement: measurements[0],
      language,
    });
    shareToTelegramCoach(msg, coachTelegramUsername);
  };

  if (!workout) return null;

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
    >
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
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

      <div className="space-y-4 my-2 max-h-[68vh] overflow-y-auto pr-1">
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
          variant="outline"
          size="sm"
          className="text-xs font-semibold border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 flex items-center justify-center gap-1.5"
          onClick={handleSendToCoach}
        >
          <Send className="h-3.5 w-3.5" />
          <span>{coachTelegramUsername ? t.workout.sendCoachButton : t.common.share}</span>
        </Button>

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
