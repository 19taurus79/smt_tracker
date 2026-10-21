"use client";

import React, { useState } from "react";
import {
  UserPlus,
  User,
  Tag,
  Dumbbell,
  Scale,
  FileText,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCoachStore, TraineeProfile } from "@/lib/store/useCoachStore";

interface AddTraineeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

export function AddTraineeModal({ open, onOpenChange }: AddTraineeModalProps) {
  const { addTrainee } = useCoachStore();

  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [username, setUsername] = useState("");
  const [currentWorkoutNumber, setCurrentWorkoutNumber] = useState(1);
  const [currentMicrocycle, setCurrentMicrocycle] = useState(1);
  const [weightKg, setWeightKg] = useState(80);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const resetForm = () => {
    setName("");
    setAlias("");
    setUsername("");
    setCurrentWorkoutNumber(1);
    setCurrentMicrocycle(1);
    setWeightKg(80);
    setGender("male");
    setNotes("");
    setIsSaved(false);
  };

  const handleWorkoutNumChange = (num: number) => {
    const val = Math.max(1, Math.min(36, num));
    setCurrentWorkoutNumber(val);
    const mc = Math.ceil(val / 9);
    setCurrentMicrocycle(mc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const randomColor = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
    const cleanUsername = username.replace(/^@/, "").trim();

    addTrainee({
      name: name.trim(),
      alias: alias.trim() ? alias.trim() : undefined,
      username: cleanUsername,
      avatarColor: randomColor,
      gender,
      age: 28,
      currentMicrocycle,
      currentWorkoutNumber,
      totalWorkouts: currentWorkoutNumber,
      weightKg: Number(weightKg) || 80,
      weightDeltaKg: 0,
      lastWorkoutDate: new Date().toISOString(),
      athleticScore: 78,
      tierKey: "active",
      tierLabel: "Активний Атлет 🏋️",
      status: "active",
      coachNotes: notes.trim() || "Додано вручну тренером.",
      workoutHistory: [],
      measurementHistory: [
        {
          id: `m-init-${Date.now()}`,
          date: new Date().toISOString(),
          weightKg: Number(weightKg) || 80,
        },
      ],
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      resetForm();
      onOpenChange(false);
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-lg">
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-white">
                Додати підопічного вручну
              </span>
              <span className="text-xs text-slate-400 block font-normal">
                Для атлетів, які вже займаються або тренувалися раніше
              </span>
            </div>
          </div>
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3.5 my-1 max-h-[75vh] overflow-y-auto scrollbar-none no-scrollbar pr-1">
        {/* Name & Alias Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ім&apos;я атлета *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Олександр Кравченко"
              className="w-full h-10 rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              <span>Псевдонім / Мітка тренера</span>
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Напр: Саня Жим, Марина Онлайн"
              className="w-full h-10 rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Telegram Username & Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>@ Telegram юзернейм</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username (без @)"
              className="w-full h-10 rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-slate-400" />
              <span>Вага атлета (кг)</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="40"
              max="200"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full h-10 rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Current Progress: Workout # and Microcycle */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-amber-400" />
            <span>Поточний прогрес у програмі СМТ-1:</span>
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Пройдено тренувань:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={currentWorkoutNumber}
                  onChange={(e) => handleWorkoutNumChange(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 shrink-0">/ 36</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Мікроцикл (МКЦ):
              </label>
              <div className="h-9 px-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
                <span>МКЦ-{currentMicrocycle}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {currentMicrocycle === 1 ? "Втягування" : currentMicrocycle === 2 ? "Навантаження" : currentMicrocycle === 3 ? "Пік" : "Делоад"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Примітка тренера</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Наприклад: почав тренування до оновлення, робоча вага в жимі 80 кг..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Скасувати
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || isSaved}
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              isSaved
                ? "bg-emerald-600 text-white shadow-emerald-500/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4" />
                <span>Додано!</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Додати атлета</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
