"use client";

import React, { useState, useEffect } from "react";
import { Check, Delete, ArrowRight, Sparkles, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/tma/telegram";
import { useTranslation } from "@/lib/i18n";

interface WeightNumpadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWeight: number;
  exerciseName?: string;
  setNumber?: number;
  totalSets?: number;
  onSave: (newWeight: number, applyToRemaining: boolean) => void;
}

export function WeightNumpadModal({
  open,
  onOpenChange,
  initialWeight,
  exerciseName,
  setNumber = 1,
  totalSets = 4,
  onSave,
}: WeightNumpadModalProps) {
  const { t, language } = useTranslation();
  const [valStr, setValStr] = useState<string>("");
  const [applyToRemaining, setApplyToRemaining] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      setValStr(initialWeight > 0 ? String(initialWeight) : "0");
      setApplyToRemaining(true);
    }
  }, [open, initialWeight]);

  const handleDigit = (digit: string) => {
    triggerHaptic("selection");
    if (valStr === "0" && digit !== ".") {
      setValStr(digit);
      return;
    }
    // Prevent multiple dots
    if (digit === "." && valStr.includes(".")) {
      return;
    }
    // Limit length to 6 characters (e.g. "122.5")
    if (valStr.length >= 6) return;
    setValStr((prev) => prev + digit);
  };

  const handleBackspace = () => {
    triggerHaptic("selection");
    if (valStr.length <= 1) {
      setValStr("0");
    } else {
      setValStr((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    triggerHaptic("light");
    setValStr("0");
  };

  const handleDelta = (delta: number) => {
    triggerHaptic("light");
    const current = parseFloat(valStr.replace(",", ".")) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setValStr(String(next));
  };

  const handleConfirm = () => {
    triggerHaptic("medium");
    const parsed = parseFloat(valStr.replace(",", ".")) || 0;
    onSave(parsed, applyToRemaining);
    onOpenChange(false);
  };

  const deltaOptions = [-2.5, -1, -0.5, 0.5, 1, 2.5];

  const remainingSetsCount = Math.max(0, totalSets - setNumber + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xs sm:max-w-sm p-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="min-w-0 pr-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            {language === "uk" ? "Введення ваги" : language === "en" ? "Set Weight" : "Ввод веса"}
          </div>
          <div className="text-sm font-black text-white truncate">
            {exerciseName || (language === "uk" ? "Вправа" : language === "en" ? "Exercise" : "Упражнение")}
            {setNumber ? ` • ${language === "en" ? "Set" : "Подход"} #${setNumber}` : ""}
          </div>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Display */}
      <div className="my-3 flex items-center justify-between rounded-2xl bg-slate-950/80 border border-white/10 p-3 shadow-inner">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-black text-emerald-300 tracking-tight">
            {valStr || "0"}
          </span>
          <span className="text-sm font-semibold text-slate-400">{t.common.kg}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClear}
          className="h-7 px-2 text-[11px] text-slate-400 hover:text-rose-400"
        >
          {language === "uk" ? "Очистити" : language === "en" ? "Clear" : "Очистить"}
        </Button>
      </div>

      {/* Quick Delta Chips */}
      <div className="grid grid-cols-6 gap-1 mb-3">
        {deltaOptions.map((delta) => {
          const isPlus = delta > 0;
          return (
            <button
              key={delta}
              type="button"
              onClick={() => handleDelta(delta)}
              className={cn(
                "h-8 rounded-lg text-xs font-bold transition-all border",
                isPlus
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 active:scale-95"
                  : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 active:scale-95"
              )}
            >
              {isPlus ? `+${delta}` : delta}
            </button>
          );
        })}
      </div>

      {/* Custom Keypad Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 select-none">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-11 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-white/5 font-mono text-lg font-bold text-white transition-all active:scale-95 shadow-sm"
          >
            {digit}
          </button>
        ))}

        {/* Dot Button */}
        <button
          type="button"
          onClick={() => handleDigit(".")}
          className="h-11 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-white/5 font-mono text-xl font-black text-cyan-400 transition-all active:scale-95"
          title="Десятичная точка"
        >
          •
        </button>

        {/* Zero Button */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="h-11 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-white/5 font-mono text-lg font-bold text-white transition-all active:scale-95"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-11 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 active:bg-rose-900/60 border border-white/5 flex items-center justify-center text-slate-300 hover:text-rose-300 transition-all active:scale-95"
          title="Стереть"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      {/* Apply to remaining sets toggle */}
      {remainingSetsCount > 1 && (
        <label className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5 mb-3 cursor-pointer select-none hover:bg-white/[0.06] transition-colors">
          <input
            type="checkbox"
            checked={applyToRemaining}
            onChange={(e) => {
              triggerHaptic("selection");
              setApplyToRemaining(e.target.checked);
            }}
            className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
          />
          <div className="text-xs text-slate-300">
            <span>
              {language === "uk"
                ? `Застосувати до всіх наступних підходів (${remainingSetsCount})`
                : language === "en"
                ? `Apply to remaining sets (${remainingSetsCount})`
                : `Применить ко всем оставшимся подходам (${remainingSetsCount})`}
            </span>
          </div>
        </label>
      )}

      {/* Save Button */}
      <Button
        variant="accent"
        size="lg"
        onClick={handleConfirm}
        className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
      >
        <Check className="h-4 w-4 stroke-[3]" />
        <span>{language === "uk" ? "Зберегти вагу" : language === "en" ? "Save Weight" : "Сохранить вес"}</span>
      </Button>
    </Dialog>
  );
}
