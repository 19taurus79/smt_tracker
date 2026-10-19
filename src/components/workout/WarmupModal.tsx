"use client";

import React from "react";
import { CheckCircle2, Circle, Flame, ArrowRight } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function WarmupModal() {
  const {
    isWarmupModalOpen,
    closeWarmupModal,
    warmupItems,
    toggleWarmupItem,
    completeWarmupAndStart,
  } = useWorkoutStore();

  const completedCount = warmupItems.filter((i) => i.completed).length;
  const totalCount = warmupItems.length;

  return (
    <Dialog open={isWarmupModalOpen} onOpenChange={closeWarmupModal}>
      <DialogHeader>
        <DialogTitle onClose={closeWarmupModal}>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-400" />
            <span>Суставная разминка</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          Подготовьте связки и сердечно-сосудистую систему перед взрывной работой СМТ.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Готовность разминки</span>
          <span className="font-semibold text-emerald-400">
            {completedCount} из {totalCount}
          </span>
        </div>
        <Progress value={completedCount} max={totalCount} />

        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {warmupItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleWarmupItem(item.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                item.completed
                  ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                  : "bg-slate-900/40 border-white/5 hover:border-white/15 text-slate-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <h4
                  className={`text-sm font-semibold ${
                    item.completed ? "text-emerald-300 line-through opacity-80" : "text-white"
                  }`}
                >
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-2">
        <Button
          variant="accent"
          size="lg"
          className="w-full flex items-center justify-center gap-2 font-bold"
          onClick={completeWarmupAndStart}
        >
          <span>Разминка окончена → Начать тренировку</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Dialog>
  );
}
