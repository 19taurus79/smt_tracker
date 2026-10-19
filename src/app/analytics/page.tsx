"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Dumbbell, Ruler, Activity } from "lucide-react";
import { TonnageChart } from "@/components/analytics/TonnageChart";
import { PowerChart } from "@/components/analytics/PowerChart";
import { KeyLiftsChart } from "@/components/analytics/KeyLiftsChart";
import { BodyCompChart } from "@/components/analytics/BodyCompChart";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"workouts" | "body">("workouts");
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

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          <span>Аналитика и Графики прогресса</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Отслеживание тоннажа, мощности СМТ-1 и рекомпозиции тела
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-2xl bg-slate-900/80 p-1 border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab("workouts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "workouts"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Тренировки СМТ</span>
        </button>

        <button
          onClick={() => setActiveTab("body")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "body"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Ruler className="h-4 w-4" />
          <span>Тело и Замеры</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "workouts" ? (
        <div className="space-y-5">
          <TonnageChart />
          <PowerChart />
          <KeyLiftsChart />
        </div>
      ) : (
        <div className="space-y-5">
          <BodyCompChart />
        </div>
      )}
    </div>
  );
}
