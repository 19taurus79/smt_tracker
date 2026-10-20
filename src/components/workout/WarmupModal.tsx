"use client";

import React, { useMemo } from "react";
import { CheckCircle2, Circle, Flame, ArrowRight } from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedWarmupList } from "@/lib/i18n/exercises";

export function WarmupModal() {
  const {
    isWarmupModalOpen,
    closeWarmupModal,
    warmupItems,
    toggleWarmupItem,
    completeWarmupAndStart,
  } = useWorkoutStore();
  const { t, language } = useTranslation();

  const localizedItems = useMemo(() => {
    const list = getLocalizedWarmupList(language);
    return list.map((item) => {
      const stored = warmupItems.find((w) => w.id === item.id);
      return {
        ...item,
        completed: stored?.completed ?? false,
      };
    });
  }, [warmupItems, language]);

  const completedCount = localizedItems.filter((i) => i.completed).length;
  const totalCount = localizedItems.length;

  return (
    <Dialog open={isWarmupModalOpen} onOpenChange={closeWarmupModal}>
      <DialogHeader>
        <DialogTitle onClose={closeWarmupModal}>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-400" />
            <span>{t.workout.warmupTitle}</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {t.workout.warmupDesc}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>{t.workout.warmup}</span>
          <span className="font-semibold text-emerald-400">
            {completedCount} / {totalCount}
          </span>
        </div>
        <Progress value={completedCount} max={totalCount} />

        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {localizedItems.map((item) => (
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
          className="w-full flex items-center justify-center gap-2 font-bold px-3 py-3 text-xs sm:text-sm text-center leading-snug"
          onClick={completeWarmupAndStart}
        >
          <span>{t.workout.finishAndStart}</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </Dialog>
  );
}
