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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = ["#10b981", "#38bdf8", "#f59e0b", "#a855f7", "#ec4899", "#6366f1"];

export function KeyLiftsChart() {
  const { workouts, exercises } = useWorkoutStore();

  if (workouts.length === 0) return null;

  // Key exercises to plot (up to 4 main/accessory lifts)
  const trackedExercises = exercises.slice(0, 4);

  const data = workouts.map((w) => {
    const entry: Record<string, any> = {
      name: `#${w.workoutNumber}`,
    };

    for (const ss of w.supersets) {
      for (const ex of ss.exercises) {
        if (trackedExercises.some((t) => t.id === ex.exerciseId)) {
          entry[ex.exerciseId] = ex.sets[0]?.targetWeight || 0;
        }
      }
    }

    return entry;
  });

  return (
    <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>Прогресс рабочих весов (кг)</span>
          <span className="text-xs font-normal text-emerald-400">
            Динамика по микроциклам
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [`${val} кг`]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {trackedExercises.map((ex, idx) => (
                <Line
                  key={ex.id}
                  type="monotone"
                  dataKey={ex.id}
                  name={ex.name}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
