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
} from "recharts";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TonnageChart() {
  const { workouts } = useWorkoutStore();

  const data = workouts
    .filter((w) => w.status === "completed" && w.tonnageKg)
    .map((w) => ({
      name: `#${w.workoutNumber}`,
      tonnage: w.tonnageKg,
      title: w.title,
    }));

  if (data.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-400">
        <p className="text-sm">Пока нет завершенных тренировок для графика тоннажа.</p>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>Динамика Тоннажа (кг)</span>
          <span className="text-xs font-normal text-emerald-400">
            Объем выполненной работы
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tonnageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                formatter={(value: any) => [`${value} кг`, "Тоннаж"]}
              />
              <Area
                type="monotone"
                dataKey="tonnage"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#tonnageGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
