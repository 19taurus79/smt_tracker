"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Calendar,
  Clock,
  Dumbbell,
  Zap,
  TrendingUp,
  MessageCircle,
  FileEdit,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Ruler,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TraineeProfile, useCoachStore } from "@/lib/store/useCoachStore";
import { formatTime, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface TraineeDetailModalProps {
  trainee: TraineeProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TraineeDetailModal({ trainee, open, onOpenChange }: TraineeDetailModalProps) {
  const { updateCoachNotes, updateTrainee } = useCoachStore();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<"workouts" | "body" | "notes">("workouts");
  const [editedNotes, setEditedNotes] = useState(trainee?.coachNotes || "");
  const [notesSaved, setNotesSaved] = useState(false);

  React.useEffect(() => {
    if (trainee) {
      setEditedNotes(trainee.coachNotes || "");
      setNotesSaved(false);
    }
  }, [trainee]);

  if (!trainee) return null;

  const handleSaveNotes = () => {
    updateCoachNotes(trainee.id, editedNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  const getTierBadgeClass = (tierKey: string) => {
    switch (tierKey) {
      case "titan":
        return "bg-amber-500/15 border-amber-500/40 text-amber-300";
      case "iron_pro":
        return "bg-cyan-500/15 border-cyan-500/40 text-cyan-300";
      case "power_master":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
      default:
        return "bg-slate-500/15 border-slate-500/40 text-slate-300";
    }
  };

  const initials = trainee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const cleanTelegramUsername = trainee.username.replace(/^@/, "");
  const telegramChatUrl = `https://t.me/${cleanTelegramUsername}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-xl bg-gradient-to-tr ${trainee.avatarColor} flex items-center justify-center text-xs font-black text-white shadow-md`}>
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white leading-tight">{trainee.name}</span>
              <a
                href={telegramChatUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>@{cleanTelegramUsername}</span>
                <ExternalLink className="h-2.5 w-2.5 inline" />
              </a>
            </div>
          </div>
        </DialogTitle>
        <DialogDescription>
          {language === "uk"
            ? `Досьє підопічного • Тренування #${trainee.currentWorkoutNumber}/36 (МКЦ-${trainee.currentMicrocycle})`
            : language === "en"
            ? `Trainee Profile • Workout #${trainee.currentWorkoutNumber}/36 (MC-${trainee.currentMicrocycle})`
            : `Досье подопечного • Тренировка #${trainee.currentWorkoutNumber}/36 (МКЦ-${trainee.currentMicrocycle})`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[70vh] overflow-y-auto pr-1">
        {/* Trainee Hero Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getTierBadgeClass(
                  trainee.tierKey
                )}`}
              >
                {trainee.tierLabel}
              </span>
              <span className="text-[11px] text-slate-400">
                Індекс: <strong className="text-white font-mono">{trainee.athleticScore}</strong>/100
              </span>
            </div>

            <a
              href={telegramChatUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition-all shadow-sm shadow-cyan-500/20"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{language === "uk" ? "Написати в Telegram" : language === "en" ? "Chat in Telegram" : "Написать в Telegram"}</span>
            </a>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">МКЦ</span>
              <span className="text-sm font-black text-white">{trainee.currentMicrocycle}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Тренувань</span>
              <span className="text-sm font-black text-emerald-400">{trainee.totalWorkouts}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Вага тіла</span>
              <span className="text-sm font-black text-white">{trainee.weightKg} кг</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Динаміка</span>
              <span className={`text-sm font-black ${trainee.weightDeltaKg >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {trainee.weightDeltaKg > 0 ? `+${trainee.weightDeltaKg}` : trainee.weightDeltaKg} кг
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-white/10 pb-1 gap-1">
          <button
            onClick={() => setActiveTab("workouts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "workouts"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Тренування ({trainee.workoutHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("body")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "body"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Заміри ({trainee.measurementHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Замітки тренера</span>
          </button>
        </div>

        {/* TAB 1: WORKOUTS HISTORY */}
        {activeTab === "workouts" && (
          <div className="space-y-3">
            {trainee.workoutHistory.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white/5 rounded-2xl">
                Немає записів тренувань
              </div>
            ) : (
              trainee.workoutHistory.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-2xl border border-white/10 bg-slate-950/70 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs">
                        #{w.workoutNumber}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Тренування #{w.workoutNumber} (МКЦ-{w.microcycle})
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          <span>{formatDate(w.date)}</span>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(
                        w.tierKey
                      )}`}
                    >
                      {w.athleticScore} / 100
                    </span>
                  </div>

                  {/* Metrics summary */}
                  <div className="grid grid-cols-3 gap-1.5 text-center bg-white/5 rounded-xl p-1.5 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Тоннаж</span>
                      <strong className="text-white">{w.tonnageKg.toLocaleString()} кг</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Час</span>
                      <strong className="text-white font-mono">{formatTime(w.durationSeconds)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Потужність</span>
                      <strong className="text-amber-400 font-mono">{w.powerKgPerMin} кг/хв</strong>
                    </div>
                  </div>

                  {/* Exercises and weights */}
                  {w.exercises && w.exercises.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Виконані ваги:
                      </span>
                      <div className="space-y-1">
                        {w.exercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-white/5"
                          >
                            <span className="text-slate-300 font-medium truncate max-w-[200px]">
                              {ex.name}
                            </span>
                            <span className="font-bold text-emerald-400 font-mono text-[11px]">
                              {ex.weight} кг × {ex.reps} ({ex.setsCount} підх)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Athlete Notes */}
                  {w.notes && (
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 italic">
                      <span className="text-slate-500 font-semibold not-italic block text-[10px]">
                        Коментар атлета:
                      </span>
                      "{w.notes}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MEASUREMENTS */}
        {activeTab === "body" && (
          <div className="space-y-3">
            {trainee.measurementHistory.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white/5 rounded-2xl">
                Немає записів замірів
              </div>
            ) : (
              trainee.measurementHistory.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl border border-white/10 bg-slate-950/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-cyan-400" />
                      <span>{formatDate(m.date)}</span>
                    </span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {m.weightKg} кг
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] pt-1 border-t border-white/5">
                    {m.waistCm && (
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[9px] text-slate-400 block">Талія</span>
                        <strong className="text-white">{m.waistCm} см</strong>
                      </div>
                    )}
                    {m.chestCm && (
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[9px] text-slate-400 block">Груди</span>
                        <strong className="text-white">{m.chestCm} см</strong>
                      </div>
                    )}
                    {m.bicepsCm && (
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[9px] text-slate-400 block">Біцепс</span>
                        <strong className="text-white">{m.bicepsCm} см</strong>
                      </div>
                    )}
                    {m.thighCm && (
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <span className="text-[9px] text-slate-400 block">Стегно</span>
                        <strong className="text-white">{m.thighCm} см</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: COACH NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Ці замітки доступні виключно тренеру. Записуйте тут індивідуальні коригування ваг, рекомендації по харчуванню та техніці виконання.
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={5}
                placeholder="Введіть замітки по атлету (наприклад: підвищити жим на +2.5 кг, додати кардіо)..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />

              <Button
                size="sm"
                variant="accent"
                className="w-full font-bold text-xs flex items-center justify-center gap-1.5"
                onClick={handleSaveNotes}
              >
                {notesSaved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                    <span>Збережено!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Зберегти замітки</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-white/10 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onOpenChange(false)}
        >
          {t.common.close}
        </Button>
      </div>
    </Dialog>
  );
}
