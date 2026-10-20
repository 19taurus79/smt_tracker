"use client";

import React from "react";
import {
  LineChart,
  Line,
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

const COLORS = ["#10b981", "#38bdf8", "#f59e0b", "#a855f7", "#ec4899", "#6366f1"];

interface TooltipPayloadItem {
  name: string;
  value: any;
  color?: string;
  stroke?: string;
  dataKey?: string;
}

function KeyLiftsCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const validItems: TooltipPayloadItem[] = payload.filter((item: any) => {
    if (item.value === null || item.value === undefined) return false;
    // Don't show forecast entry if actual entry exists at bridge point
    if (typeof item.dataKey === "string" && item.dataKey.endsWith("_forecast")) {
      const baseKey = item.dataKey.replace("_forecast", "");
      const hasActual = payload.some(
        (p: any) =>
          p.dataKey === `${baseKey}_actual` && p.value !== null && p.value !== undefined
      );
      if (hasActual) return false;
    }
    return true;
  });

  if (validItems.length === 0) return null;

  const isCompletedPoint = payload[0]?.payload?.isCompleted;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1.5 min-w-[180px]">
      <div className="font-bold text-slate-300 pb-1 border-b border-white/10 flex items-center justify-between gap-2">
        <span>Тренировка {label}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
            isCompletedPoint
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border border-white/10"
          }`}
        >
          {isCompletedPoint ? "Выполнено" : "Прогноз"}
        </span>
      </div>
      <div className="space-y-1">
        {validItems.map((item) => {
          const isForecast =
            typeof item.dataKey === "string" && item.dataKey.endsWith("_forecast");
          return (
            <div key={item.dataKey || item.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[150px]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: item.color || item.stroke,
                    opacity: isForecast ? 0.45 : 1,
                  }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className={`font-mono font-bold shrink-0 ${isForecast ? "text-slate-400" : "text-white"}`}>
                {item.value} кг
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KeyLiftsChart() {
  const { workouts, exercises } = useWorkoutStore();
  const { showForecastInAnalytics, setShowForecastInAnalytics } = useSettingsStore();

  if (workouts.length === 0) return null;

  // Key exercises to plot (up to 4 main/accessory lifts)
  const trackedExercises = exercises.slice(0, 4);

  // Find index of the last completed workout
  const lastCompletedIdx = workouts.reduce((maxIdx, w, idx) => {
    return w.status === "completed" ? idx : maxIdx;
  }, -1);

  const hasCompleted = lastCompletedIdx !== -1;

  // Build chart data
  let dataWorkouts = workouts;
  if (!showForecastInAnalytics) {
    // Only show completed workouts when forecast is disabled
    dataWorkouts = workouts.filter((w) => w.status === "completed");
  }

  const data = dataWorkouts.map((w) => {
    const entry: Record<string, any> = {
      name: `#${w.workoutNumber}`,
      isCompleted: w.status === "completed",
    };

    const originalIdx = workouts.findIndex((orig) => orig.id === w.id);

    for (const ss of w.supersets) {
      for (const ex of ss.exercises) {
        if (!trackedExercises.some((t) => t.id === ex.exerciseId)) continue;

        const completedSet = ex.sets.find((s) => s.completed && s.actualWeight !== undefined);
        const set0 = ex.sets[0];
        const targetWeight = set0?.targetWeight || 0;
        const actualWeight = completedSet?.actualWeight ?? set0?.actualWeight ?? targetWeight;

        if (!showForecastInAnalytics) {
          // Forecast is disabled: only actual data
          entry[`${ex.exerciseId}_actual`] = actualWeight;
        } else {
          // Forecast is enabled: distinguish actual vs forecast
          if (w.status === "completed") {
            entry[`${ex.exerciseId}_actual`] = actualWeight;
            // Bridge point: last completed workout connects to forecast line
            if (originalIdx === lastCompletedIdx) {
              entry[`${ex.exerciseId}_forecast`] = actualWeight;
            } else {
              entry[`${ex.exerciseId}_forecast`] = null;
            }
          } else {
            // Future upcoming workout: only forecast
            entry[`${ex.exerciseId}_actual`] = null;
            entry[`${ex.exerciseId}_forecast`] = targetWeight;
          }
        }
      }
    }

    return entry;
  });

  return (
    <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span>Прогресс рабочих весов (кг)</span>
              {showForecastInAnalytics && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Факт + Прогноз
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Сплошная линия — реальные веса • Пунктирная (полупрозрачная) — прогноз СМТ
            </p>
          </div>

          {/* Toggle Forecast Button */}
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
              Пока нет завершенных тренировок для отображения реальных весов.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Включите отображение прогноза программы, чтобы увидеть рассчитанные целевые веса на весь макроцикл СМТ-1.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForecastInAnalytics(true)}
              className="text-xs font-bold border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              <span>Включить прогноз программы</span>
            </Button>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<KeyLiftsCustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
                {trackedExercises.map((ex, idx) => {
                  const color = COLORS[idx % COLORS.length];
                  return (
                    <React.Fragment key={ex.id}>
                      {/* Actual / Real Done Data Line (Solid, prominent) */}
                      <Line
                        type="monotone"
                        dataKey={`${ex.id}_actual`}
                        name={ex.name}
                        stroke={color}
                        strokeWidth={3}
                        dot={{ r: 3.5, fill: color, strokeWidth: 1.5, stroke: "#0f172a" }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                      />

                      {/* Forecast Line (Semi-transparent, dashed) */}
                      {showForecastInAnalytics && (
                        <Line
                          type="monotone"
                          dataKey={`${ex.id}_forecast`}
                          name={`${ex.name} (прогноз)`}
                          legendType="none"
                          stroke={color}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          strokeOpacity={0.35}
                          dot={{ r: 2, fill: color, fillOpacity: 0.35, stroke: "none" }}
                          activeDot={{ r: 4, strokeOpacity: 0.8 }}
                          connectNulls={false}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
