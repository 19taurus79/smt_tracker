"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Dumbbell, Ruler, Activity, Eye, EyeOff } from "lucide-react";
import { TonnageChart } from "@/components/analytics/TonnageChart";
import { PowerChart } from "@/components/analytics/PowerChart";
import { KeyLiftsChart } from "@/components/analytics/KeyLiftsChart";
import { BodyCompChart } from "@/components/analytics/BodyCompChart";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"workouts" | "body">("workouts");
  const [mounted, setMounted] = useState(false);
  const { showForecastInAnalytics, setShowForecastInAnalytics } = useSettingsStore();
  const { t } = useTranslation();

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
          <span>{t.analytics.title}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.analytics.subtitle}
        </p>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs Switcher */}
        <div className="flex rounded-2xl bg-slate-900/80 p-1 border border-white/10 w-full sm:w-auto sm:min-w-[280px]">
          <button
            onClick={() => setActiveTab("workouts")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "workouts"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>{t.analytics.tabWorkouts}</span>
          </button>

          <button
            onClick={() => setActiveTab("body")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "body"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Ruler className="h-4 w-4" />
            <span>{t.analytics.tabBody}</span>
          </button>
        </div>

        {/* Global Forecast Toggle for Workouts */}
        {activeTab === "workouts" && (
          <button
            onClick={() => setShowForecastInAnalytics(!showForecastInAnalytics)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              showForecastInAnalytics
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-slate-900/80 text-slate-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
            title={showForecastInAnalytics ? t.analytics.forecastDisabled : t.analytics.forecastEnabled}
          >
            {showForecastInAnalytics ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  {t.analytics.toggleForecast}:{" "}
                  <strong className="text-emerald-300 font-bold">{t.analytics.forecastEnabled}</strong>
                </span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  {t.analytics.toggleForecast}:{" "}
                  <strong className="text-slate-300 font-bold">{t.analytics.forecastDisabled}</strong>
                </span>
              </>
            )}
          </button>
        )}
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
