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
  ReferenceLine,
} from "recharts";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, Award, Sparkles, Zap, Flame, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  calculateAthleticScore,
  getTierLabel,
  getTierColor,
} from "@/lib/scoring/athleticScore";

function ScoreCustomTooltip({ active, payload, label, t, language }: any) {
  if (!active || !payload || !payload.length) return null;

  const validItems = payload.filter((item: any) => item.value !== null && item.value !== undefined);
  if (validItems.length === 0) return null;

  const pointData = payload[0]?.payload;
  const isCompletedPoint = pointData?.isCompleted;
  const score = pointData?.score_actual ?? pointData?.score_forecast ?? 50;
  const tierKey = pointData?.tierKey || "active";
  const tierColor = getTierColor(tierKey);
  const tierLabel = getTierLabel(tierKey, t);

  const factLabel = language === "en" ? "Actual" : language === "ru" ? "Факт" : "Факт";
  const forecastLabel = language === "en" ? "Forecast" : language === "ru" ? "Прогноз" : "Прогноз";
  const workoutLabel = language === "en" ? "Workout" : language === "ru" ? "Тренировка" : "Тренування";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-3 shadow-2xl text-xs space-y-2 min-w-[200px]">
      <div className="font-bold text-slate-300 pb-1.5 border-b border-white/10 flex items-center justify-between gap-2">
        <span>{workoutLabel} {label}</span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            isCompletedPoint
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border-white/10"
          }`}
        >
          {isCompletedPoint ? factLabel : forecastLabel}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 border ${tierColor.border} text-base font-black ${tierColor.text}`}
        >
          {score}
        </div>
        <div>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${tierColor.bg} border ${tierColor.border} ${tierColor.text}`}
          >
            {tierLabel}
          </span>
          {pointData?.tonnage && (
            <p className="text-[11px] text-slate-400 mt-1">
              {t.common.tonnage}: <strong className="text-white">{pointData.tonnage} {t.common.kg}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AthleticScoreChart() {
  const { workouts } = useWorkoutStore();
  const { measurements } = useBodyStore();
  const { showForecastInAnalytics, gender, userAge } = useSettingsStore();
  const { t, language } = useTranslation();

  const athleteWeight = measurements[0]?.weightKg || 80;

  // Calculate planned tonnage for forecast
  const getPlannedTonnage = (w: (typeof workouts)[0]) => {
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

  const completedWorkouts = workouts.filter((w) => w.status === "completed" && (w.tonnageKg || 0) > 0);
  const hasCompleted = completedWorkouts.length > 0;

  // Compute scores for completed workouts
  const completedScores = completedWorkouts.map((w) => {
    const res = calculateAthleticScore({
      tonnageKg: w.tonnageKg || 0,
      durationSeconds: w.durationSeconds || 45 * 60,
      bodyWeightKg: athleteWeight,
      gender,
      age: userAge,
    });
    return {
      workoutNumber: w.workoutNumber,
      score: res.score,
      tierKey: res.tierKey,
      tonnage: w.tonnageKg || 0,
    };
  });

  const bestScoreObj = completedScores.reduce(
    (best, cur) => (cur.score > (best?.score || 0) ? cur : best),
    completedScores[0] || null
  );

  const avgScore = hasCompleted
    ? Math.round(
        completedScores.reduce((sum, item) => sum + item.score, 0) / completedScores.length
      )
    : 0;

  const currentTierKey = bestScoreObj?.tierKey || "active";
  const currentTierColor = getTierColor(currentTierKey);
  const currentTierLabel = getTierLabel(currentTierKey, t);

  // Prepare Chart Data
  let dataWorkouts = workouts;
  if (!showForecastInAnalytics) {
    dataWorkouts = completedWorkouts;
  }

  const lastCompletedIdx = workouts.reduce((maxIdx, w, idx) => {
    return w.status === "completed" && w.tonnageKg ? idx : maxIdx;
  }, -1);

  const data = dataWorkouts.map((w) => {
    const originalIdx = workouts.findIndex((orig) => orig.id === w.id);
    const isCompleted = w.status === "completed" && (w.tonnageKg || 0) > 0;

    let scoreActual: number | null = null;
    let scoreForecast: number | null = null;
    let pointTierKey: any = "active";
    let pointTonnage = 0;

    if (isCompleted) {
      const res = calculateAthleticScore({
        tonnageKg: w.tonnageKg || 0,
        durationSeconds: w.durationSeconds || 45 * 60,
        bodyWeightKg: athleteWeight,
        gender,
        age: userAge,
      });
      scoreActual = res.score;
      pointTierKey = res.tierKey;
      pointTonnage = w.tonnageKg || 0;
    }

    if (showForecastInAnalytics) {
      const plannedTonnage = getPlannedTonnage(w);
      const plannedDuration = 45 * 60; // 45 min target protocol
      const plannedRes = calculateAthleticScore({
        tonnageKg: plannedTonnage,
        durationSeconds: plannedDuration,
        bodyWeightKg: athleteWeight,
        gender,
        age: userAge,
      });

      if (!hasCompleted || originalIdx >= lastCompletedIdx) {
        scoreForecast = plannedRes.score;
        if (!isCompleted) {
          pointTierKey = plannedRes.tierKey;
          pointTonnage = plannedTonnage;
        }
      }
    }

    return {
      name: `#${w.workoutNumber}`,
      score_actual: scoreActual,
      score_forecast: scoreForecast,
      isCompleted,
      tierKey: pointTierKey,
      tonnage: pointTonnage,
    };
  });

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/20 shadow-2xl p-4 sm:p-6 space-y-4">
      <CardHeader className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-400" />
              <span>{t.scoring.scoreDynamics}</span>
            </CardTitle>
            <p className="text-xs text-slate-400">
              {t.scoring.scoreFormulaDesc}
            </p>
          </div>

          {hasCompleted && (
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-xl border ${currentTierColor.border} ${currentTierColor.bg} ${currentTierColor.text} self-start sm:self-auto shadow-md`}
            >
              {currentTierLabel}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* KPI Mini Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {t.scoring.bestScore}
            </span>
            <span className="text-base sm:text-xl font-black text-purple-400">
              {bestScoreObj ? `${bestScoreObj.score} / 100` : "—"}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {t.scoring.avgScore}
            </span>
            <span className="text-base sm:text-xl font-black text-cyan-400">
              {avgScore > 0 ? `${avgScore} / 100` : "—"}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {t.scoring.currentTier}
            </span>
            <span className="text-xs sm:text-sm font-black text-white truncate block mt-0.5">
              {hasCompleted ? currentTierLabel : "—"}
            </span>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-64 sm:h-72 w-full pt-2">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              {t.analytics.totalVolumeSummary}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreActualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="scoreForecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[40, 100]}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  ticks={[50, 65, 75, 85, 95, 100]}
                />

                <Tooltip
                  content={<ScoreCustomTooltip t={t} language={language} />}
                />

                {/* Tier Threshold Reference Lines */}
                <ReferenceLine
                  y={75}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{
                    value: "75: Master",
                    fill: "#10b981",
                    fontSize: 9,
                    position: "insideTopLeft",
                  }}
                />
                <ReferenceLine
                  y={85}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{
                    value: "85: Pro",
                    fill: "#f59e0b",
                    fontSize: 9,
                    position: "insideTopLeft",
                  }}
                />
                <ReferenceLine
                  y={95}
                  stroke="#c084fc"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{
                    value: "95: Titan",
                    fill: "#c084fc",
                    fontSize: 9,
                    position: "insideTopLeft",
                  }}
                />

                {/* Forecast Curve (Semi-transparent / dashed) */}
                {showForecastInAnalytics && (
                  <Area
                    type="monotone"
                    dataKey="score_forecast"
                    name={t.analytics.forecastData}
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    fill="url(#scoreForecastGrad)"
                    connectNulls
                  />
                )}

                {/* Actual Real Curve */}
                <Area
                  type="monotone"
                  dataKey="score_actual"
                  name={t.analytics.realData}
                  stroke="#c084fc"
                  strokeWidth={3}
                  fill="url(#scoreActualGrad)"
                  activeDot={{ r: 6, fill: "#c084fc", stroke: "#ffffff", strokeWidth: 2 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
