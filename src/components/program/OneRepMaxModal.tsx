"use client";

import React, { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import { calculateOneRepMax } from "@/lib/smt/calculator";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OneRepMaxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  onApply: (calculated1RM: number) => void;
}

export function OneRepMaxModal({
  open,
  onOpenChange,
  exerciseName,
  onApply,
}: OneRepMaxModalProps) {
  const [weight, setWeight] = useState("80");
  const [reps, setReps] = useState("8");

  const weightNum = parseFloat(weight) || 0;
  const repsNum = parseInt(reps, 10) || 0;

  const result = calculateOneRepMax(weightNum, repsNum);

  const handleApply = () => {
    onApply(result.average);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <span>Калькулятор 1ПМ</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          Расчет предельного максимума (1ПМ) по формулам Эпли и Бжицки для:{" "}
          <strong className="text-white">{exerciseName}</strong>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Рабочий вес (кг)</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Повторения</label>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="8"
            />
          </div>
        </div>

        {/* Calculation Result */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
          <span className="text-xs text-slate-400">Расчетный максимум (1ПМ):</span>
          <div className="text-3xl font-black text-emerald-400 my-1">
            {result.average} кг
          </div>
          <div className="flex justify-center gap-4 text-[11px] text-slate-400 mt-2">
            <span>Эпли: {result.epley} кг</span>
            <span>•</span>
            <span>Бжицки: {result.brzycki} кг</span>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-2">
        <Button variant="accent" size="lg" className="w-full font-bold" onClick={handleApply}>
          <span>Применить {result.average} кг в 1ПМ</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Dialog>
  );
}
