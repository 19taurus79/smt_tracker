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
import { useBodyStore } from "@/lib/store/useBodyStore";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function BodyCompChart() {
  const { measurements } = useBodyStore();

  const data = [...measurements]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: formatDate(m.date),
      weight: m.weightKg,
      waist: m.waistCm,
      chest: m.chestCm,
      biceps: m.bicepsCm,
    }));

  if (data.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-400">
        <p className="text-sm">Пока нет замеров тела для аналитики.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weight Chart */}
      <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>Динамика веса тела (кг)</span>
            <span className="text-xs font-normal text-emerald-400">
              Масса тела
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} кг`, "Вес"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Вес тела"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recomposition Comparison Chart: Waist vs Chest / Biceps */}
      <Card className="border-white/10 bg-slate-900/70 p-4 sm:p-5">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>Рекомпозиция: Талия vs Мышцы</span>
            <span className="text-xs font-normal text-cyan-400">
              Обхваты (см)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} см`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="waist"
                  name="Талия (цель: ↓)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="chest"
                  name="Грудь (цель: ↑)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="biceps"
                  name="Бицепс (цель: ↑)"
                  stroke="#eab308"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
