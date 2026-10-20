"use client";

import React, { useState, useEffect } from "react";
import { Plus, Ruler, Scale, Flame, Sparkles, Send } from "lucide-react";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { BodyLogList } from "@/components/body/BodyLogList";
import { BodyLogModal } from "@/components/body/BodyLogModal";
import { Button } from "@/components/ui/button";
import { generateMeasurementCoachMessage, shareToTelegramCoach } from "@/lib/coach/telegramCoach";

export default function BodyPage() {
  const { measurements } = useBodyStore();
  const { coachTelegramUsername, traineeName } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];

  const totalWeightDelta =
    latest && oldest && measurements.length > 1
      ? Math.round((latest.weightKg - oldest.weightKg) * 10) / 10
      : null;

  const totalWaistDelta =
    latest && oldest && latest.waistCm && oldest.waistCm && measurements.length > 1
      ? Math.round((latest.waistCm - oldest.waistCm) * 10) / 10
      : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Ruler className="h-6 w-6 text-emerald-400" />
            <span>Замеры и Антропометрия</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Контроль массы тела, талии, груди и бицепса в динамике
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {latest && (
            <Button
              variant="outline"
              size="sm"
              className="font-semibold text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 shrink-0"
              onClick={() => {
                const msg = generateMeasurementCoachMessage(
                  latest,
                  measurements[1],
                  traineeName
                );
                shareToTelegramCoach(msg, coachTelegramUsername);
              }}
              title="Отправить последние замеры тренеру в Telegram"
            >
              <Send className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
              <span>{coachTelegramUsername ? "Тренеру в Telegram" : "Поделиться замерами"}</span>
            </Button>
          )}

          <Button
            variant="accent"
            size="sm"
            className="font-bold shrink-0"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Добавить замер</span>
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Текущий вес</span>
            <Scale className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">
            {latest ? `${latest.weightKg} кг` : "—"}
          </div>
          {totalWeightDelta !== null && (
            <span
              className={`text-[11px] font-semibold mt-1 block ${
                totalWeightDelta <= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {totalWeightDelta > 0 ? `+${totalWeightDelta}` : totalWeightDelta} кг от старта
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Талия</span>
            <Ruler className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white">
            {latest?.waistCm ? `${latest.waistCm} см` : "—"}
          </div>
          {totalWaistDelta !== null && (
            <span
              className={`text-[11px] font-semibold mt-1 block ${
                totalWaistDelta <= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalWaistDelta > 0 ? `+${totalWaistDelta}` : totalWaistDelta} см от старта
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Бицепс</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">
            {latest?.bicepsCm ? `${latest.bicepsCm} см` : "—"}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Обхват руки</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Грудь</span>
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white">
            {latest?.chestCm ? `${latest.chestCm} см` : "—"}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Грудная клетка</span>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 px-1">История замеров</h2>
        <BodyLogList />
      </div>

      {/* Modal */}
      <BodyLogModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
