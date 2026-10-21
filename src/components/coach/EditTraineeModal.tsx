"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Tag,
  User,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TraineeProfile, useCoachStore } from "@/lib/store/useCoachStore";

interface EditTraineeModalProps {
  trainee: TraineeProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updatedTrainee: TraineeProfile) => void;
}

const PRESET_TAGS = ["Онлайн", "Зал", "VIP", "Ранок", "Вечір", "Харчування", "Підготовка"];

export function EditTraineeModal({
  trainee,
  open,
  onOpenChange,
  onSaved,
}: EditTraineeModalProps) {
  const { updateTrainee } = useCoachStore();

  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (trainee) {
      setName(trainee.name || "");
      setAlias(trainee.alias || "");
      setIsSaved(false);
    }
  }, [trainee, open]);

  if (!trainee) return null;

  const handleAddTag = (tag: string) => {
    const formattedTag = `[${tag}]`;
    if (alias.includes(formattedTag)) return;
    const newAlias = alias.trim() ? `${alias.trim()} ${formattedTag}` : `${name.split(" ")[0]} ${formattedTag}`;
    setAlias(newAlias);
  };

  const handleClearAlias = () => {
    setAlias("");
  };

  const handleResetName = () => {
    setName(trainee.name);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    const trimmedName = name.trim();
    const trimmedAlias = alias.trim() ? alias.trim() : undefined;

    updateTrainee(trainee.id, {
      name: trimmedName,
      alias: trimmedAlias,
    });

    const updated: TraineeProfile = {
      ...trainee,
      name: trimmedName,
      alias: trimmedAlias,
    };

    if (onSaved) {
      onSaved(updated);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onOpenChange(false);
    }, 400);
  };

  const previewDisplayName = alias.trim() || name.trim() || trainee.name;
  const initials = previewDisplayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const cleanTelegramUsername = trainee.username.replace(/^@/, "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-black text-white">
                Ім&apos;я та псевдонім атлета
              </span>
              <span className="text-xs text-slate-400 block font-normal">
                Налаштування для вашої тренерської панелі
              </span>
            </div>
          </div>
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSave} className="space-y-4 my-1">
        {/* Live Preview Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900/90 border border-white/10 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Попередній перегляд в аналітиці:
          </span>
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl bg-gradient-to-tr ${trainee.avatarColor} flex items-center justify-center text-xs font-black text-white shadow-md shrink-0`}
            >
              {initials || "АТ"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white truncate max-w-[200px]">
                  {previewDisplayName}
                </span>
                {alias.trim() && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    ПСЕВДОНІМ
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {alias.trim() && (
                  <span className="text-slate-400 mr-2">
                    Ориг: <span className="text-slate-300 font-medium">{name}</span>
                  </span>
                )}
                {cleanTelegramUsername && (
                  <span className="text-cyan-400">@{cleanTelegramUsername}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alias / Pseudonym Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              <span>Псевдонім / Робоча мітка тренера</span>
            </label>
            {alias && (
              <button
                type="button"
                onClick={handleClearAlias}
                className="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors"
              >
                Очистити
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Напр: Саня Жим, Марина Онлайн, Олег Зал"
              className="w-full h-10 rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              maxLength={40}
            />
            {alias && (
              <button
                type="button"
                onClick={handleClearAlias}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            💡 Псевдонім відображається першим у таблицях та графіках. Бачите тільки ви.
          </p>

          {/* Quick Preset Tags */}
          <div className="pt-1">
            <span className="text-[10px] text-slate-500 block mb-1 font-semibold uppercase">
              Швидкі мітки в 1 клік:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => {
                const isIncluded = alias.includes(`[${tag}]`);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className={`h-6 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                      isIncluded
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 opacity-70"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-white/20"
                    }`}
                  >
                    +{tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real / Full Name Input */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Повне ім&apos;я атлета</span>
            </label>
            {name !== trainee.name && (
              <button
                type="button"
                onClick={handleResetName}
                className="text-[11px] font-medium text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Повернути оригінал</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ім'я та прізвище"
            required
            className="w-full h-10 rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
          />
          <p className="text-[11px] text-slate-500 leading-snug">
            Основне ім&apos;я атлета з профілю Telegram або анкети.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
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
                <span>Збережено!</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Зберегти зміни</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
