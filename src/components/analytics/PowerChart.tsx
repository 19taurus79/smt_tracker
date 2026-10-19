"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function PowerChart() {
  const { workouts } = useWorkoutStore();

  const data = workouts
    .filter((w) => w.status === "completed" && w.powerKgPerMin)
    .map((w) => ({
      name: `#${w.workoutNumber}`,
      power: w.powerKgPerMin,
      durationMin: Math.round(((w.durationSeconds || 0) / 60) * 10) / 10,
    }));

  if (data.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-400">
        <p className="text-sm">Пока нет данных мощности.</p>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>Мощность и Длительность</span>
          <span className="text-xs font-normal text-cyan-400">
            Плотность тренинга (кг/мин)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="power" name="Мощность (кг/мин)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              <Bar dataKey="durationMin" name="Время (мин)" fill="#64748b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
