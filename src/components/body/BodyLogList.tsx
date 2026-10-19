"use client";

import React, { useState } from "react";
import { Trash2, Edit3, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { BodyMeasurement } from "@/types/body";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BodyLogModal } from "./BodyLogModal";

export function BodyLogList() {
  const { measurements, deleteMeasurement } = useBodyStore();
  const [editingItem, setEditingItem] = useState<BodyMeasurement | null>(null);

  if (measurements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
        <p className="text-sm">История замеров пока пуста.</p>
        <p className="text-xs text-slate-500 mt-1">
          Нажмите кнопку «Добавить замер», чтобы внести первые данные.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {measurements.map((item, idx) => {
          // Compare with previous chronological entry (which is at idx + 1 because list is sorted desc)
          const prevItem = measurements[idx + 1];
          const weightDiff = prevItem
            ? Math.round((item.weightKg - prevItem.weightKg) * 10) / 10
            : null;
          const waistDiff =
            prevItem && item.waistCm && prevItem.waistCm
              ? Math.round((item.waistCm - prevItem.waistCm) * 10) / 10
              : null;
          const bicepsDiff =
            prevItem && item.bicepsCm && prevItem.bicepsCm
              ? Math.round((item.bicepsCm - prevItem.bicepsCm) * 10) / 10
              : null;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-white/20"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
                <div>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatDate(item.date)}
                  </span>
                  {item.notes && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => setEditingItem(item)}
                    title="Редактировать"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-400"
                    onClick={() => deleteMeasurement(item.id)}
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white/[0.03]">
                  <span className="text-slate-400 text-[11px]">Вес тела</span>
                  <div className="flex items-center gap-1 font-bold text-white text-sm mt-0.5">
                    <span>{item.weightKg} кг</span>
                    {weightDiff !== null && (
                      <span
                        className={`text-[10px] font-semibold flex items-center ${
                          weightDiff < 0
                            ? "text-emerald-400"
                            : weightDiff > 0
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {weightDiff > 0 ? `+${weightDiff}` : weightDiff}
                      </span>
                    )}
                  </div>
                </div>

                {item.waistCm && (
                  <div className="p-2 rounded-xl bg-white/[0.03]">
                    <span className="text-slate-400 text-[11px]">Талия</span>
                    <div className="flex items-center gap-1 font-bold text-white text-sm mt-0.5">
                      <span>{item.waistCm} см</span>
                      {waistDiff !== null && (
                        <span
                          className={`text-[10px] font-semibold flex items-center ${
                            waistDiff < 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {waistDiff > 0 ? `+${waistDiff}` : waistDiff}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {item.bicepsCm && (
                  <div className="p-2 rounded-xl bg-white/[0.03]">
                    <span className="text-slate-400 text-[11px]">Бицепс</span>
                    <div className="flex items-center gap-1 font-bold text-white text-sm mt-0.5">
                      <span>{item.bicepsCm} см</span>
                      {bicepsDiff !== null && (
                        <span
                          className={`text-[10px] font-semibold flex items-center ${
                            bicepsDiff > 0 ? "text-emerald-400" : "text-slate-400"
                          }`}
                        >
                          {bicepsDiff > 0 ? `+${bicepsDiff}` : bicepsDiff}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {item.chestCm && (
                  <div className="p-2 rounded-xl bg-white/[0.03]">
                    <span className="text-slate-400 text-[11px]">Грудь</span>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {item.chestCm} см
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BodyLogModal
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
        initialData={editingItem}
      />
    </>
  );
}
