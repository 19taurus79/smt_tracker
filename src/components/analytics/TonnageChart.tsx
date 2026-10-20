"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Sparkles } from "lucide-react";

function TonnageCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const validItems = payload.filter((item: any) => {
    if (item.value === null || item.value === undefined) return false;
    // Don't show forecast if actual is present at bridge point
    if (item.dataKey === "tonnage_forecast") {
      const hasActual = payload.some(
        (p: any) =>
          p.dataKey === "tonnage_actual" && p.value !== null && p.value !== undefined
      );
      if (hasActual) return false;
    }
    return true;
  });

  if (validItems.length === 0) return null;

  const isCompletedPoint = validItems.some((i: any) => i.dataKey === "tonnage_actual");

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1.5 min-w-[170px]">
      <div className="font-bold text-slate-300 pb-1 border-b border-white/10 flex items-center justify-between gap-2">
        <span>Тренировка {label}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
            isCompletedPoint
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border border-white/10"
          }`}
        >
          {isCompletedPoint ? "Факт" : "Прогноз"}
        </span>
      </div>
      <div className="space-y-1">
        {validItems.map((item: any) => {
          const isForecast = item.dataKey === "tonnage_forecast";
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: "#10b981",
                    opacity: isForecast ? 0.45 : 1,
                  }}
                />
                <span>{item.name}</span>
              </span>
              <span className={`font-mono font-bold ${isForecast ? "text-slate-400" : "text-emerald-400"}`}>
                {typeof item.value === "number" ? item.value.toLocaleString("ru-RU") : item.value} кг
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TonnageChart() {
  const { workouts } = useWorkoutStore();
  const { showForecastInAnalytics, setShowForecastInAnalytics } = useSettingsStore();

  const lastCompletedIdx = workouts.reduce((maxIdx, w, idx) => {
    return w.status === "completed" && w.tonnageKg ? idx : maxIdx;
  }, -1);

  const hasCompleted = lastCompletedIdx !== -1;

  // Calculate planned tonnage for a workout based on target sets
  const getPlannedTonnage = (w: typeof workouts[0]) => {
    return w.supersets.reduce(
      (acc, ss) =>
        acc +
        ss.exercises.reduce(
          (a, ex) =>
            a +
            ex.sets.reduce(
              (sAcc, s) => sAcc + (s.targetWeight || 0) * (s.targetReps || 0),
              0
            ),
          0
        ),
      0
    );
  };

  let dataWorkouts = workouts;
  if (!showForecastInAnalytics) {
    dataWorkouts = workouts.filter((w) => w.status === "completed" && w.tonnageKg);
  }

  const data = dataWorkouts.map((w) => {
    const originalIdx = workouts.findIndex((orig) => orig.id === w.id);
    const planned = getPlannedTonnage(w);
    const actual = w.status === "completed" && w.tonnageKg ? w.tonnageKg : null;

    if (!showForecastInAnalytics) {
      return {
        name: `#${w.workoutNumber}`,
        tonnage_actual: actual,
      };
    }

    if (w.status === "completed" && w.tonnageKg) {
      return {
        name: `#${w.workoutNumber}`,
        tonnage_actual: actual,
        tonnage_forecast: originalIdx === lastCompletedIdx ? actual : null,
      };
    }

    return {
      name: `#${w.workoutNumber}`,
      tonnage_actual: null,
      tonnage_forecast: planned,
    };
  });

  return (
    <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span>Динамика Тоннажа (кг)</span>
              {showForecastInAnalytics && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Факт + Прогноз
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Сплошной график — фактически поднятый объем • Пунктирный — плановый тоннаж
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForecastInAnalytics(!showForecastInAnalytics)}
            className="h-8 px-2.5 text-xs font-semibold self-start sm:self-auto border-white/15 hover:border-emerald-500/40"
          >
            {showForecastInAnalytics ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <span>Скрыть прогноз</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                <span>Показать прогноз</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!showForecastInAnalytics && !hasCompleted ? (
          <div className="py-12 px-4 text-center space-y-3 rounded-xl bg-slate-950/40 border border-white/5">
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Пока нет завершенных тренировок для отображения реального тоннажа.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Включите отображение прогноза программы, чтобы увидеть рассчитанную кривую тоннажа по программе СМТ-1.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForecastInAnalytics(true)}
              className="text-xs font-bold border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              <span>Включить прогноз тоннажа</span>
            </Button>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tonnageActualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tonnageForecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<TonnageCustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
                {/* Actual Tonnage Area (Solid) */}
                <Area
                  type="monotone"
                  dataKey="tonnage_actual"
                  name="Факт (выполнено)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tonnageActualGradient)"
                  connectNulls={false}
                />

                {/* Forecast Tonnage Area (Semi-transparent, dashed) */}
                {showForecastInAnalytics && (
                  <Area
                    type="monotone"
                    dataKey="tonnage_forecast"
                    name="Прогноз (план СМТ)"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                    fillOpacity={1}
                    fill="url(#tonnageForecastGradient)"
                    connectNulls={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
