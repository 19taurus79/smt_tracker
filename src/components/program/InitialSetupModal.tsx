"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Calculator,
  Sparkles,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { ExerciseDefinition, ExerciseCategory } from "@/types/smt";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { DEFAULT_EXERCISES } from "@/lib/smt/generator";
import { roundToWeightStep } from "@/lib/smt/calculator";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OneRepMaxModal } from "./OneRepMaxModal";

interface InitialSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InitialSetupModal({ open, onOpenChange }: InitialSetupModalProps) {
  const { exercises, initializeProgram } = useWorkoutStore();
  const { weightIncrementKg } = useSettingsStore();

  const [localExercises, setLocalExercises] = useState<ExerciseDefinition[]>(exercises);

  useEffect(() => {
    if (open) {
      setLocalExercises(exercises);
    }
  }, [open, exercises]);

  const [calcModalExercise, setCalcModalExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleNameChange = (id: string, name: string) => {
    setLocalExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, name } : ex))
    );
  };

  const handle1RMChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setLocalExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, oneRepMax: num } : ex))
    );
  };

  const handleStartWeightChange = (id: string, val: string) => {
    const startWeight = parseFloat(val) || 0;
    setLocalExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const pct = ex.startingPercentage || (ex.category === "main" ? 0.40 : 0.30);
        const calculated1RM = pct > 0 ? Math.round((startWeight / pct) * 10) / 10 : startWeight;
        return {
          ...ex,
          oneRepMax: calculated1RM,
        };
      })
    );
  };

  const handleCategoryChange = (id: string, category: ExerciseCategory) => {
    setLocalExercises((prev) =>
      prev.map((ex) =>
        ex.id === id
          ? {
              ...ex,
              category,
              startingPercentage: category === "main" ? 0.40 : 0.30,
            }
          : ex
      )
    );
  };

  const handleBlockGroupChange = (id: string, blockGroup: string) => {
    setLocalExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const isSingle = blockGroup.startsWith("single-");
        return {
          ...ex,
          blockGroup,
          blockType: isSingle ? "single" : "superset",
        };
      })
    );
  };

  const handleAddExercise = () => {
    const newId = `ex-${Date.now()}`;
    const newEx: ExerciseDefinition = {
      id: newId,
      name: "Новое упражнение",
      category: "main",
      oneRepMax: 60,
      startingPercentage: 0.40,
      blockType: "single",
      blockGroup: `single-${newId}`,
    };
    setLocalExercises((prev) => [...prev, newEx]);
  };

  const handleDeleteExercise = (id: string) => {
    if (localExercises.length <= 1) return;
    setLocalExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleResetToClassic = () => {
    setLocalExercises(DEFAULT_EXERCISES);
  };

  const handleApply1RMFromCalc = (calculated1RM: number) => {
    if (calcModalExercise) {
      setLocalExercises((prev) =>
        prev.map((ex) =>
          ex.id === calcModalExercise.id ? { ...ex, oneRepMax: calculated1RM } : ex
        )
      );
    }
  };

  const handleGenerate = () => {
    initializeProgram(localExercises, weightIncrementKg);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle onClose={() => onOpenChange(false)}>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
              <span>Конструктор программы СМТ-1</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Настройка упражнений, формата выполнения и 1ПМ.
            Старт: <strong className="text-emerald-400">40%</strong> (база 4x10) и{" "}
            <strong className="text-cyan-400">30%</strong> (подсобка 4x15).
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable list with fixed footer */}
        <div className="space-y-3 my-1 overflow-y-auto pr-1 flex-1 max-h-[58vh]">
          {localExercises.map((ex, idx) => {
            const startWeight = roundToWeightStep(
              ex.oneRepMax * ex.startingPercentage,
              weightIncrementKg
            );

            return (
              <div
                key={ex.id}
                className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 space-y-2.5"
              >
                {/* Exercise Name and Delete */}
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </span>

                  <Input
                    type="text"
                    value={ex.name}
                    onChange={(e) => handleNameChange(ex.id, e.target.value)}
                    placeholder="Название упражнения"
                    className="h-8 font-bold text-xs sm:text-sm bg-slate-950/70 border-white/10 text-white flex-1"
                  />

                  {localExercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-rose-400 shrink-0"
                      onClick={() => handleDeleteExercise(ex.id)}
                      title="Удалить упражнение"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Formats and Category (Stack on mobile, row on tablet) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">
                      Формат выполнения
                    </label>
                    <select
                      value={ex.blockGroup || (ex.blockType === "single" ? `single-${ex.id}` : "ss-1")}
                      onChange={(e) => handleBlockGroupChange(ex.id, e.target.value)}
                      className="w-full h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 truncate"
                    >
                      <option value={`single-${ex.id}`}>Одиночный блок (все подходы подряд)</option>
                      <option value="ss-back-biceps">Суперсет 1: Спина + Бицепс</option>
                      <option value="ss-legs-shoulders">Суперсет 2: Ноги + Плечи</option>
                      <option value="ss-custom-1">Суперсет: Своя группа 1</option>
                      <option value="ss-custom-2">Суперсет: Своя группа 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">
                      Категория нагрузки
                    </label>
                    <select
                      value={ex.category}
                      onChange={(e) =>
                        handleCategoryChange(ex.id, e.target.value as ExerciseCategory)
                      }
                      className="w-full h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 truncate"
                    >
                      <option value="main">Базовое (40% • 4x10)</option>
                      <option value="accessory">Подсобное (30% • 4x15)</option>
                    </select>
                  </div>
                </div>

                {/* Starting weight & 1RM dual synchronized inputs */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5 space-y-1">
                    <label className="text-[10px] text-emerald-400 font-semibold block">
                      Стартовый вес (МКЦ-1)
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.5"
                        value={startWeight}
                        onChange={(e) => handleStartWeightChange(ex.id, e.target.value)}
                        className="h-7 text-center font-bold text-xs bg-slate-950 text-emerald-300"
                        title="Рабочий вес для первой тренировки"
                      />
                      <span className="text-[10px] text-slate-500">кг</span>
                    </div>
                  </div>

                  <div className="bg-black/30 p-2 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 font-semibold block">
                        Базовый 1ПМ
                      </label>
                      <button
                        type="button"
                        onClick={() => setCalcModalExercise({ id: ex.id, name: ex.name })}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                        title="Калькулятор по повторениям"
                      >
                        <Calculator className="h-3 w-3" />
                        <span>расчет</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="2.5"
                        value={ex.oneRepMax}
                        onChange={(e) => handle1RMChange(ex.id, e.target.value)}
                        className="h-7 text-center font-bold text-xs bg-slate-950 text-white"
                        title="Разовый максимум 1ПМ (кг)"
                      />
                      <span className="text-[10px] text-slate-500">кг</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddExercise}
              className="text-xs font-semibold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              <span>Добавить</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToClassic}
              className="text-xs text-slate-400 hover:text-white h-7"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span>Сбросить к СМТ-1</span>
            </Button>
          </div>
        </div>

        {/* Modal Sticky Bottom Action */}
        <div className="pt-3 border-t border-white/10 shrink-0">
          <Button
            variant="accent"
            size="lg"
            className="w-full font-bold flex items-center justify-center gap-2 h-11 text-xs sm:text-sm"
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4" />
            <span>Сформировать 36 тренировок</span>
          </Button>
        </div>
      </Dialog>

      {/* 1RM Helper Modal */}
      {calcModalExercise && (
        <OneRepMaxModal
          open={Boolean(calcModalExercise)}
          onOpenChange={(open) => !open && setCalcModalExercise(null)}
          exerciseName={calcModalExercise.name}
          onApply={handleApply1RMFromCalc}
        />
      )}
    </>
  );
}
