"use client";

import React, { useState, useEffect } from "react";
import {
  Calculator,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  Scale,
  RefreshCw,
  Info,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePrepStore } from "@/lib/store/usePrepStore";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";
import { calculateSmtStartingWeights } from "@/lib/smt/prepCalculator";
import { DEFAULT_EXERCISES } from "@/lib/smt/generator";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";

interface PrepCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
}

export function PrepCalculatorModal({
  open,
  onOpenChange,
  onApplied,
}: PrepCalculatorModalProps) {
  const { language } = useTranslation();
  const { getAverageWeights } = usePrepStore();
  const { exercises, initializeProgram } = useWorkoutStore();
  const { weightIncrementKg } = useSettingsStore();

  const [benchWeight, setBenchWeight] = useState("60");
  const [pullWeight, setPullWeight] = useState("55");
  const [squatWeight, setSquatWeight] = useState("70");
  const [isSuccess, setIsSuccess] = useState(false);

  // При открытии подставляем средние веса из завершенных подготовительных тренировок
  useEffect(() => {
    if (open) {
      const avg = getAverageWeights();
      setBenchWeight(String(avg.benchWeight || 60));
      setPullWeight(String(avg.pullWeight || 55));
      setSquatWeight(String(avg.squatWeight || 70));
      setIsSuccess(false);
    }
  }, [open]);

  const numBench = parseFloat(benchWeight.replace(",", ".")) || 0;
  const numPull = parseFloat(pullWeight.replace(",", ".")) || 0;
  const numSquat = parseFloat(squatWeight.replace(",", ".")) || 0;

  const calculated = calculateSmtStartingWeights(
    {
      benchWeight: numBench,
      pullWeight: numPull,
      squatWeight: numSquat,
    },
    weightIncrementKg || 2.5
  );

  const handleApplyToProgram = () => {
    // Обновляем текущие ExerciseDefinition с новыми 1RM и starting custom weights
    const baseList = exercises.length > 0 ? exercises : DEFAULT_EXERCISES;

    const mapping: Record<string, { oneRepMax: number; startWeight: number }> = {
      bench_press: calculated.benchPress,
      close_grip_bench: calculated.closeGripBench,
      pull_ups: calculated.pullUps,
      biceps_curl: calculated.bicepsCurl,
      squat: calculated.squat,
      ohp: calculated.ohp,
    };

    const updatedExercises = baseList.map((ex) => {
      const target = mapping[ex.id];
      if (target) {
        return {
          ...ex,
          oneRepMax: target.oneRepMax,
          customStartWeight: target.startWeight,
        };
      }
      return ex;
    });

    initializeProgram(updatedExercises, weightIncrementKg || 2.5);
    setIsSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
      if (onApplied) onApplied();
    }, 900);
  };

  const exerciseRows = [
    {
      id: "bench_press",
      title: language === "uk" ? "Жим штанги лежачи" : language === "en" ? "Bench Press" : "Жим штанги лежа",
      category: language === "uk" ? "Базова • Блок 1" : language === "en" ? "Compound • Block 1" : "Базовое • Блок 1",
      data: calculated.benchPress,
      badgeColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
    {
      id: "close_grip_bench",
      title: language === "uk" ? "Жим вузьким хватом" : language === "en" ? "Close-Grip Bench" : "Жим узким хватом",
      category: language === "uk" ? "Базова • Блок 2" : language === "en" ? "Compound • Block 2" : "Базовое • Блок 2",
      data: calculated.closeGripBench,
      badgeColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
    {
      id: "pull_ups",
      title: language === "uk" ? "Підтягування (або тяга)" : language === "en" ? "Pull-ups / Pulldown" : "Подтягивания (или тяга)",
      category: language === "uk" ? "Базова • Суперсет 1" : language === "en" ? "Compound • Superset 1" : "Базовое • Суперсет 1",
      data: calculated.pullUps,
      badgeColor: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    },
    {
      id: "biceps_curl",
      title: language === "uk" ? "Штанга на біцепс" : language === "en" ? "Biceps Curl" : "Штанга на бицепс",
      category: language === "uk" ? "Підсобна • Суперсет 1" : language === "en" ? "Accessory • Superset 1" : "Подсобка • Суперсет 1",
      data: calculated.bicepsCurl,
      badgeColor: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    },
    {
      id: "squat",
      title: language === "uk" ? "Присідання (або жим ногами)" : language === "en" ? "Squats / Leg Press" : "Приседания (или жим ногами)",
      category: language === "uk" ? "Базова • Суперсет 2" : language === "en" ? "Compound • Superset 2" : "Базовое • Суперсет 2",
      data: calculated.squat,
      badgeColor: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    },
    {
      id: "ohp",
      title: language === "uk" ? "Армійський жим стоячи" : language === "en" ? "Military Press (OHP)" : "Армейский жим стоя",
      category: language === "uk" ? "Підсобна • Суперсет 2" : language === "en" ? "Accessory • Superset 2" : "Подсобка • Суперсет 2",
      data: calculated.ohp,
      badgeColor: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <span>
              {language === "uk"
                ? "Калькулятор стартових ваг СМТ-1"
                : language === "en"
                ? "SMT-1 Starting Weights Calculator"
                : "Калькулятор стартовых весов СМТ-1"}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {language === "uk"
            ? "Введіть робочі ваги з підготовчого циклу (на 10–12 повторень). Система розрахує 1ПМ і виставить 40% для базових та 30% для підсобних вправ."
            : language === "en"
            ? "Enter your 10–12 rep loads from the prep cycle. The calculator estimates 1RM and sets 40% for compound and 30% for accessory exercises."
            : "Введите рабочие веса из вводного цикла (на 10–12 повторений). Система рассчитает 1ПМ и выставит 40% для базовых и 30% для подсобных упражнений."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[70vh] overflow-y-auto pr-1">
        {/* Input Cards: 3 Compound Prep Exercises */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>
              {language === "uk"
                ? "1. Ваги з підготовчої програми (10 повторів):"
                : language === "en"
                ? "1. Prep Working Weights (10 reps):"
                : "1. Веса из подготовительной программы (10 повт):"}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">Автопідстановка</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
              <label className="text-[11px] text-slate-400 block font-medium">
                {language === "uk" ? "Жим лежачи" : language === "en" ? "Bench Press" : "Жим лежа"}
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="2.5"
                  value={benchWeight}
                  onChange={(e) => setBenchWeight(e.target.value)}
                  className="h-8 text-xs font-bold"
                />
                <span className="text-xs text-slate-400">кг</span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
              <label className="text-[11px] text-slate-400 block font-medium">
                {language === "uk" ? "Підтягування / тяга" : language === "en" ? "Pull / Pulldown" : "Тяга / подтягивания"}
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="2.5"
                  value={pullWeight}
                  onChange={(e) => setPullWeight(e.target.value)}
                  className="h-8 text-xs font-bold"
                />
                <span className="text-xs text-slate-400">кг</span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
              <label className="text-[11px] text-slate-400 block font-medium">
                {language === "uk" ? "Присідання / платформа" : language === "en" ? "Squat / Leg Press" : "Присед / платформа"}
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="2.5"
                  value={squatWeight}
                  onChange={(e) => setSquatWeight(e.target.value)}
                  className="h-8 text-xs font-bold"
                />
                <span className="text-xs text-slate-400">кг</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Results Table for SMT-1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>
              {language === "uk"
                ? "2. Розраховані стартові ваги СМТ-1 (МКЦ-1):"
                : language === "en"
                ? "2. Deduced SMT-1 Starting Loads (MC-1):"
                : "2. Рассчитанные стартовые веса СМТ-1 (МКЦ-1):"}
            </span>
            <span className="text-[11px] text-slate-400">Крок {weightIncrementKg || 2.5} кг</span>
          </div>

          <div className="space-y-1.5">
            {exerciseRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/70 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm">{row.title}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${row.badgeColor}`}>
                      {row.category}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Розрахунковий 1ПМ: <strong className="text-slate-300">{row.data.oneRepMax} кг</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-emerald-400">
                    {row.data.startWeight} кг
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {Math.round(row.data.pct * 100)}% від 1ПМ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] text-cyan-200/90 leading-relaxed flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <span>
            {language === "uk"
              ? "Після застосування всі 36 тренувань програми СМТ-1 буде автоматично перераховано з прогресією для 4 мікроциклів."
              : language === "en"
              ? "Applying these values will automatically calibrate all 36 workouts of the SMT-1 cycle across all 4 microcycles."
              : "После применения все 36 тренировок программы СМТ-1 будут автоматически пересчитаны с прогрессией для 4 микроциклов."}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
        <Button
          variant="accent"
          size="lg"
          className="flex-1 font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950"
          onClick={handleApplyToProgram}
          disabled={isSuccess}
        >
          {isSuccess ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-slate-950" />
              <span>
                {language === "uk" ? "Ваги застосовано!" : language === "en" ? "Weights Applied!" : "Веса применены!"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>
                {language === "uk"
                  ? "Застосувати ваги до СМТ-1"
                  : language === "en"
                  ? "Apply Weights to SMT-1"
                  : "Применить веса к СМТ-1"}
              </span>
            </div>
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="border-white/20 text-xs"
          onClick={() => onOpenChange(false)}
        >
          {language === "uk" ? "Закрити" : language === "en" ? "Close" : "Закрыть"}
        </Button>
      </div>
    </Dialog>
  );
}
