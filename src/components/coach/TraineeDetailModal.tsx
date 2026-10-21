"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Dumbbell,
  Zap,
  TrendingUp,
  MessageCircle,
  FileEdit,
  Save,
  CheckCircle2,
  Ruler,
  ExternalLink,
  Ban,
  Unlock,
  Trash2,
  Trophy,
  Scale,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TraineeProfile, useCoachStore } from "@/lib/store/useCoachStore";
import { formatTime, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { EditTraineeModal } from "./EditTraineeModal";

interface TraineeDetailModalProps {
  trainee: TraineeProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TraineeDetailModal({ trainee: initialTrainee, open, onOpenChange }: TraineeDetailModalProps) {
  const { updateCoachNotes, blockTrainee, unblockTrainee, deleteTrainee } = useCoachStore();
  const storeTrainee = useCoachStore((s) => s.trainees.find((t) => t.id === initialTrainee?.id));
  const trainee = storeTrainee || initialTrainee;

  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<"workouts" | "body" | "notes">("workouts");
  const [editedNotes, setEditedNotes] = useState(trainee?.coachNotes || "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const isBlocked = trainee.status === "blocked";
  const isLead = trainee.status === "new_lead";

  const displayName = trainee.alias || trainee.name;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "АТ";

  const cleanTelegramUsername = trainee.username.replace(/^@/, "");
  const telegramChatUrl = cleanTelegramUsername ? `https://t.me/${cleanTelegramUsername}` : "#";
  const progressPercent = Math.min(100, Math.round((trainee.currentWorkoutNumber / 36) * 100));

  const getTierColorInfo = (tierKey: string) => {
    switch (tierKey) {
      case "titan":
        return {
          bg: "bg-amber-500/15",
          border: "border-amber-500/30",
          text: "text-amber-300",
          dot: "bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50",
          label: "Титан Сили ⚡",
        };
      case "iron_pro":
        return {
          bg: "bg-cyan-500/15",
          border: "border-cyan-500/30",
          text: "text-cyan-300",
          dot: "bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50",
          label: "Залізний Профі 🦾",
        };
      case "power_master":
        return {
          bg: "bg-emerald-500/15",
          border: "border-emerald-500/30",
          text: "text-emerald-300",
          dot: "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50",
          label: "Майстер Потужності 💥",
        };
      case "lead":
        return {
          bg: "bg-rose-500/15",
          border: "border-rose-500/30",
          text: "text-rose-300",
          dot: "bg-rose-400 animate-ping",
          label: "Новий Лід 🔥",
        };
      default:
        return {
          bg: "bg-slate-500/15",
          border: "border-slate-500/30",
          text: "text-slate-300",
          dot: "bg-slate-400",
          label: "Активний Атлет 🏋️",
        };
    }
  };

  const tierInfo = getTierColorInfo(trainee.tierKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl bg-gradient-to-tr ${trainee.avatarColor} flex items-center justify-center text-sm font-black text-white shadow-md shrink-0`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black text-white leading-tight truncate">
                  {displayName}
                </span>
                {trainee.alias && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                    ПСЕВДОНІМ
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="h-6 px-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 text-slate-300 hover:text-amber-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  title="Змінити ім'я або надати псевдонім"
                >
                  <FileEdit className="h-3 w-3" />
                  <span>Редагувати</span>
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {trainee.alias && (
                  <span className="text-xs text-slate-400">
                    Оригінал: <span className="text-slate-300 font-medium">{trainee.name}</span>
                  </span>
                )}
                {cleanTelegramUsername ? (
                  <a
                    href={telegramChatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                  >
                    <span>@{cleanTelegramUsername}</span>
                    <ExternalLink className="h-2.5 w-2.5 inline" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-500 italic block">Без юзернейму</span>
                )}
              </div>
            </div>
          </div>
        </DialogTitle>
        <DialogDescription>
          Досьє атлета • Програма СМТ-1 (12 тижнів, 36 тренувань)
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 my-1 max-h-[75vh] overflow-y-auto scrollbar-none no-scrollbar pb-2">
        {/* ======================================================== */}
        {/* BENTO GRID: Атлетичний статус та метрики підопічного    */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Bento 1: Индекс атлетичности */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Індекс сили</span>
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">{trainee.athleticScore}</span>
                <span className="text-[10px] text-slate-500 font-mono">/100</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-sm ${tierInfo.bg} ${tierInfo.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tierInfo.dot}`} />
                <span className={`text-[10px] font-black tracking-wide ${tierInfo.text}`}>
                  {isBlocked ? "Блок 🚫" : tierInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Bento 2: Прогресс в программе СМТ */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Прогрес СМТ</span>
              <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white font-mono">#{trainee.currentWorkoutNumber}</span>
                <span className="text-[10px] text-slate-500 font-mono">/ 36</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                МКЦ-{trainee.currentMicrocycle} ({progressPercent}%)
              </span>
              <div className="h-1.5 w-full rounded-full bg-slate-900 mt-1.5 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bento 3: Текущий вес и динамика */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Вага тіла</span>
              <Scale className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white font-mono">{trainee.weightKg}</span>
                <span className="text-[10px] text-slate-400 font-bold">кг</span>
              </div>
              <span
                className={`inline-block mt-1 text-[10px] font-bold ${
                  trainee.weightDeltaKg > 0
                    ? "text-emerald-400"
                    : trainee.weightDeltaKg < 0
                    ? "text-cyan-400"
                    : "text-slate-400"
                }`}
              >
                {trainee.weightDeltaKg > 0
                  ? `↑ +${trainee.weightDeltaKg} кг`
                  : trainee.weightDeltaKg < 0
                  ? `↓ ${trainee.weightDeltaKg} кг`
                  : "0.0 кг (старт)"}
              </span>
            </div>
          </div>

          {/* Bento 4: Быстрая связь в Telegram */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Зв'язок</span>
              <MessageCircle className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              {cleanTelegramUsername ? (
                <a
                  href={telegramChatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-8 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-cyan-500/10"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Написати</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 italic block mt-2">
                  Юзернейм відсутній
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* СЕГМЕНТОВАНИЙ BENTO-ПЕРЕМИКАЧ ВКЛАДОК                     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("workouts")}
            className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "workouts"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Тренування ({trainee.workoutHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("body")}
            className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "body"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Заміри ({trainee.measurementHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Замітки тренера</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: ІСТОРІЯ ТРЕНУВАНЬ (BENTO WORKOUT CARDS)           */}
        {/* ======================================================== */}
        {activeTab === "workouts" && (
          <div className="space-y-3">
            {trainee.workoutHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-3xl border border-white/5 space-y-1">
                <Dumbbell className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">Немає збережених тренувань</p>
                <p className="text-slate-500 text-[11px]">
                  Звіти з'являться тут автоматично після завершення першого тренування.
                </p>
              </div>
            ) : (
              trainee.workoutHistory.map((w) => (
                <div
                  key={w.id}
                  className="p-3 sm:p-3.5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-2.5 shadow-md"
                >
                  {/* Workout Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs shrink-0">
                        #{w.workoutNumber}
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-white leading-tight">
                          Тренування #{w.workoutNumber} (МКЦ-{w.microcycle})
                        </h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>{formatDate(w.date)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono font-bold whitespace-nowrap shadow-sm">
                        <span className="text-amber-300 font-black text-xs">{w.athleticScore}</span>
                        <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Metrics Pills (Compact & space-efficient) */}
                  <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-950/50 border border-white/5 rounded-xl p-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Тоннаж</span>
                      <strong className="text-white font-mono text-xs">{w.tonnageKg.toLocaleString()} кг</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Тривалість</span>
                      <strong className="text-white font-mono text-xs">{formatTime(w.durationSeconds)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Потужність</span>
                      <strong className="text-amber-400 font-mono text-xs">{w.powerKgPerMin} кг/хв</strong>
                    </div>
                  </div>

                  {/* Exercises: Unified Divider List (NO nested double-margin boxes!) */}
                  {w.exercises && w.exercises.length > 0 && (
                    <div className="pt-1.5 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Виконані вправи:
                      </span>
                      <div className="rounded-xl bg-slate-950/50 border border-white/5 divide-y divide-white/5 overflow-hidden">
                        {w.exercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.02] transition-colors"
                          >
                            <span className="text-slate-200 font-medium leading-snug">
                              {ex.name}
                            </span>
                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs whitespace-nowrap">
                                {ex.weight} кг × {ex.reps}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium whitespace-nowrap">
                                ({ex.setsCount} підх)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Athlete Notes */}
                  {w.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 text-xs text-slate-300 leading-relaxed italic space-y-0.5">
                      <span className="text-slate-500 font-semibold not-italic block text-[10px]">
                        Коментар атлета:
                      </span>
                      <p>&ldquo;{w.notes}&rdquo;</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ЗАМІРИ ТІЛА (BENTO MEASUREMENT CARDS)             */}
        {/* ======================================================== */}
        {activeTab === "body" && (
          <div className="space-y-3">
            {trainee.measurementHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-3xl border border-white/5 space-y-1">
                <Ruler className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">Немає записів замірів</p>
                <p className="text-slate-500 text-[11px]">
                  Заміри ваги та обхватів атлета зберігатимуться тут по датах.
                </p>
              </div>
            ) : (
              trainee.measurementHistory.map((m) => (
                <div
                  key={m.id}
                  className="p-3 sm:p-3.5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{formatDate(m.date)}</span>
                    </span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Вага: {m.weightKg} кг
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-1 border-t border-white/5">
                    <div className="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Талія</span>
                      <strong className="text-white font-mono">{m.waistCm ? `${m.waistCm} см` : "—"}</strong>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Груди</span>
                      <strong className="text-white font-mono">{m.chestCm ? `${m.chestCm} см` : "—"}</strong>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Біцепс</span>
                      <strong className="text-white font-mono">{m.bicepsCm ? `${m.bicepsCm} см` : "—"}</strong>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Стегно</span>
                      <strong className="text-white font-mono">{m.thighCm ? `${m.thighCm} см` : "—"}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ЗАМІТКИ ТРЕНЕРА                                   */}
        {/* ======================================================== */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Приватний блокнот тренера: зафіксуйте індивідуальні коригування робочих ваг, рекомендації по харчуванню та техніці виконання.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={5}
                placeholder="Введіть замітки по атлету (наприклад: підвищити жим на +2.5 кг, додати кардіо)..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
              />

              <Button
                size="sm"
                variant="accent"
                className="w-full h-10 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                onClick={handleSaveNotes}
              >
                {notesSaved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-slate-950" />
                    <span>Збережено!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Зберегти замітки</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ФУТЕР МОДАЛКИ: Гармонійні кнопки однакової висоти h-9    */}
      {/* ======================================================== */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              isBlocked
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => {
              if (isBlocked) {
                unblockTrainee(trainee.id);
              } else {
                blockTrainee(trainee.id);
              }
            }}
          >
            {isBlocked ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Розблокувати</span>
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Заблокувати</span>
                <span className="sm:hidden">Блок</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="h-9 px-2.5 sm:px-3 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            onClick={() => {
              if (confirm(`Ви дійсно бажаєте видалити атлета ${trainee.name}?`)) {
                deleteTrainee(trainee.id);
                onOpenChange(false);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span>Видалити</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="h-9 px-4 sm:px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-md shadow-emerald-500/20 shrink-0 min-w-[76px]"
        >
          {t.common.close}
        </button>
      </div>

      <EditTraineeModal
        trainee={trainee}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </Dialog>
  );
}
