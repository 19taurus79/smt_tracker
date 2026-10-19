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
} from "lucide-react";
import { WorkoutSession } from "@/types/smt";
import { formatTime, formatDate } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmResetModal } from "@/components/workout/ConfirmResetModal";

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

  if (!workout) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <span className="truncate">Отчет о тренировке #{workout.workoutNumber}</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {workout.title} • Микроцикл {workout.microcycle} (Неделя {workout.week})
          {workout.completedAt && (
            <span className="block text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Завершена: {formatDate(workout.completedAt)}</span>
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[68vh] overflow-y-auto pr-1">
        {/* KPI Metrics Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Dumbbell className="h-4 w-4 text-emerald-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Тоннаж</span>
            <span className="text-sm sm:text-base font-black text-white">
              {workout.tonnageKg ?? 0} кг
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Clock className="h-4 w-4 text-cyan-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Время</span>
            <span className="font-mono text-sm sm:text-base font-black text-white">
              {formatTime(workout.durationSeconds ?? 0)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="h-4 w-4 text-amber-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Мощность</span>
            <span className="font-mono text-sm sm:text-base font-black text-amber-400">
              {workout.powerKgPerMin ?? 0}{" "}
              <span className="text-[9px] text-slate-500 font-normal">кг/м</span>
            </span>
          </div>
        </div>

        {/* Exercises Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Выполненные упражнения и подходы
          </h4>

          {workout.supersets.map((ss) => (
            <div
              key={ss.id}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 space-y-2"
            >
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                <span>{ss.label}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {ss.type === "single" ? "Одиночный блок" : "Суперсет (отдых 30с)"}
                </span>
              </div>

              <div className="space-y-2 pt-1 border-t border-white/5">
                {ss.exercises.map((ex) => (
                  <div key={ex.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{ex.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {ex.category === "main" ? "Базовое 40%" : "Подсобка 30%"}
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
                            <span className="font-mono text-[10px] text-slate-400">
                              #{s.setNumber}
                            </span>
                            <span className="font-bold text-white">
                              {weight} кг × {reps}
                            </span>
                            {s.completed && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
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
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Заметки к тренировке:
            </span>
            <p className="text-xs text-slate-200 italic leading-relaxed">
              "{workout.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
        <Button
          variant="outline"
          size="default"
          className="flex-1 font-semibold text-xs"
          onClick={() => onOpenChange(false)}
        >
          <span>Закрыть отчет</span>
        </Button>

        {onRestart && (
          <Button
            variant="ghost"
            size="default"
            className="text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            onClick={() => setIsConfirmResetOpen(true)}
            title="Сбросить статус и пройти тренировку заново"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span>Сбросить и пройти заново</span>
          </Button>
        )}
      </div>

      <ConfirmResetModal
        open={isConfirmResetOpen}
        onOpenChange={setIsConfirmResetOpen}
        workout={workout}
        onConfirm={() => {
          if (onRestart) {
            onRestart(workout.id);
            onOpenChange(false);
          }
        }}
      />
    </Dialog>
  );
}
