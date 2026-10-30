"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";

interface ExerciseCardRowProps {
  exercise: ExerciseDefinition;
  index: number;
  totalCount: number;
  weightIncrementKg: number;
  onUpdate: (updated: ExerciseDefinition) => void;
  onDelete: (id: string) => void;
  onOpenCalc: (id: string, name: string) => void;
}

function ExerciseCardRow({
  exercise,
  index,
  totalCount,
  weightIncrementKg,
  onUpdate,
  onDelete,
  onOpenCalc,
}: ExerciseCardRowProps) {
  const { t, language } = useTranslation();
  const pct = exercise.startingPercentage || (exercise.category === "main" ? 0.40 : 0.30);

  const defaultCalculatedStart = roundToWeightStep(
    exercise.oneRepMax * pct,
    weightIncrementKg
  );

  const currentStartWeight =
    exercise.customStartWeight !== undefined
      ? exercise.customStartWeight
      : defaultCalculatedStart;

  const [startWeightStr, setStartWeightStr] = useState<string>(String(currentStartWeight));
  const [oneRepMaxStr, setOneRepMaxStr] = useState<string>(String(exercise.oneRepMax));

  const isStartFocused = useRef(false);
  const is1RMFocused = useRef(false);

  useEffect(() => {
    if (!isStartFocused.current) {
      setStartWeightStr(String(currentStartWeight));
    }
  }, [currentStartWeight]);

  useEffect(() => {
    if (!is1RMFocused.current) {
      setOneRepMaxStr(String(exercise.oneRepMax));
    }
  }, [exercise.oneRepMax]);

  const handleStartWeightChange = (val: string) => {
    setStartWeightStr(val);

    const clean = val.replace(",", ".").trim();
    if (clean === "") return;

    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed >= 0) {
      const new1RM = pct > 0 ? Math.round((parsed / pct) * 10) / 10 : parsed;
      if (!is1RMFocused.current) {
        setOneRepMaxStr(String(new1RM));
      }
      onUpdate({
        ...exercise,
        customStartWeight: parsed,
        oneRepMax: new1RM,
      });
    }
  };

  const handleStartWeightBlur = () => {
    isStartFocused.current = false;
    const clean = startWeightStr.replace(",", ".").trim();
    const parsed = parseFloat(clean);
    if (clean === "" || isNaN(parsed) || parsed < 0) {
      const fallback = defaultCalculatedStart;
      setStartWeightStr(String(fallback));
      onUpdate({
        ...exercise,
        customStartWeight: fallback,
      });
    } else {
      setStartWeightStr(String(parsed));
    }
  };

  const handle1RMChange = (val: string) => {
    setOneRepMaxStr(val);

    const clean = val.replace(",", ".").trim();
    if (clean === "") return;

    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed >= 0) {
      const newStart = roundToWeightStep(parsed * pct, weightIncrementKg);
      if (!isStartFocused.current) {
        setStartWeightStr(String(newStart));
      }
      onUpdate({
        ...exercise,
        oneRepMax: parsed,
        customStartWeight: newStart,
      });
    }
  };

  const handle1RMBlur = () => {
    is1RMFocused.current = false;
    const clean = oneRepMaxStr.replace(",", ".").trim();
    const parsed = parseFloat(clean);
    if (clean === "" || isNaN(parsed) || parsed < 0) {
      const fallback = 60;
      setOneRepMaxStr(String(fallback));
      const newStart = roundToWeightStep(fallback * pct, weightIncrementKg);
      setStartWeightStr(String(newStart));
      onUpdate({
        ...exercise,
        oneRepMax: fallback,
        customStartWeight: newStart,
      });
    } else {
      setOneRepMaxStr(String(parsed));
    }
  };

  const handleCategoryChange = (category: ExerciseCategory) => {
    const newPct = category === "main" ? 0.40 : 0.30;
    const newStart = roundToWeightStep(exercise.oneRepMax * newPct, weightIncrementKg);
    setStartWeightStr(String(newStart));
    onUpdate({
      ...exercise,
      category,
      startingPercentage: newPct,
      customStartWeight: newStart,
    });
  };

  const handleBlockGroupChange = (blockGroup: string) => {
    const isSingle = blockGroup.startsWith("single-");
    onUpdate({
      ...exercise,
      blockGroup,
      blockType: isSingle ? "single" : "superset",
    });
  };

  const displayName = getLocalizedExerciseName(exercise.name, language, false);

  const formatOptions =
    language === "uk"
      ? [
          { val: `single-${exercise.id}`, label: "Одиночний блок (усі підходи поспіль)" },
          { val: "ss-back-biceps", label: "Суперсет 1: Спина + Біцепс" },
          { val: "ss-legs-shoulders", label: "Суперсет 2: Ноги + Плечі" },
          { val: "ss-custom-1", label: "Суперсет: Своя група 1" },
        ]
      : language === "en"
      ? [
          { val: `single-${exercise.id}`, label: "Single block (all sets consecutive)" },
          { val: "ss-back-biceps", label: "Superset 1: Back + Biceps" },
          { val: "ss-legs-shoulders", label: "Superset 2: Legs + Shoulders" },
          { val: "ss-custom-1", label: "Superset: Custom Group 1" },
        ]
      : [
          { val: `single-${exercise.id}`, label: "Одиночный блок (все подходы подряд)" },
          { val: "ss-back-biceps", label: "Суперсет 1: Спина + Бицепс" },
          { val: "ss-legs-shoulders", label: "Суперсет 2: Ноги + Плечи" },
          { val: "ss-custom-1", label: "Суперсет: Своя группа 1" },
        ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 space-y-2.5">
      {/* Exercise Name and Delete */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-slate-400">
          #{index + 1}
        </span>

        <Input
          type="text"
          value={displayName}
          onChange={(e) => onUpdate({ ...exercise, name: e.target.value })}
          placeholder="Назва вправи"
          className="h-8 font-bold text-xs sm:text-sm bg-slate-950/70 border-white/10 text-white flex-1"
        />

        {totalCount > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-rose-400 shrink-0"
            onClick={() => onDelete(exercise.id)}
            title={t.common.reset}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Formats and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 font-medium block mb-1">
            {language === "uk" ? "Формат виконання" : language === "en" ? "Execution format" : "Формат выполнения"}
          </label>
          <select
            value={exercise.blockGroup || (exercise.blockType === "single" ? `single-${exercise.id}` : "ss-1")}
            onChange={(e) => handleBlockGroupChange(e.target.value)}
            className="w-full h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 truncate"
          >
            {formatOptions.map((opt) => (
              <option key={opt.val} value={opt.val}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-medium block mb-1">
            {language === "uk" ? "Категорія навантаження" : language === "en" ? "Load category" : "Категория нагрузки"}
          </label>
          <select
            value={exercise.category}
            onChange={(e) => handleCategoryChange(e.target.value as ExerciseCategory)}
            className="w-full h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 truncate"
          >
            <option value="main">
              {language === "uk" ? "Базове (40% • 4x10)" : language === "en" ? "Main (40% • 4x10)" : "Базовое (40% • 4x10)"}
            </option>
            <option value="accessory">
              {language === "uk" ? "Підсобне (30% • 4x15)" : language === "en" ? "Accessory (30% • 4x15)" : "Подсобное (30% • 4x15)"}
            </option>
          </select>
        </div>
      </div>

      {/* Starting weight & 1RM dual synchronized inputs */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
        <div className="bg-black/30 p-2 rounded-xl border border-white/5 space-y-1">
          <label className="text-[10px] text-emerald-400 font-semibold block">
            {language === "uk" ? "Стартова вага (МКЦ-1)" : language === "en" ? "Starting weight (MC-1)" : "Стартовый вес (МКЦ-1)"}
          </label>
          <div className="flex items-center gap-1">
            <Input
              type="text"
              inputMode="decimal"
              value={startWeightStr}
              onChange={(e) => handleStartWeightChange(e.target.value)}
              onFocus={(e) => {
                isStartFocused.current = true;
                e.target.select();
              }}
              onBlur={handleStartWeightBlur}
              placeholder="30"
              className="h-8 text-center font-bold text-xs bg-slate-950 text-emerald-300 border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-500">{t.common.kg}</span>
          </div>
        </div>

        <div className="bg-black/30 p-2 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-400 font-semibold block">
              {language === "uk" ? "Базовий 1ПМ" : language === "en" ? "Base 1RM" : "Базовый 1ПМ"}
            </label>
            <button
              type="button"
              onClick={() => onOpenCalc(exercise.id, exercise.name)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
            >
              <Calculator className="h-3 w-3" />
              <span>{language === "uk" ? "розрахунок" : language === "en" ? "calc" : "расчет"}</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="text"
              inputMode="decimal"
              value={oneRepMaxStr}
              onChange={(e) => handle1RMChange(e.target.value)}
              onFocus={(e) => {
                is1RMFocused.current = true;
                e.target.select();
              }}
              onBlur={handle1RMBlur}
              placeholder="80"
              className="h-8 text-center font-bold text-xs bg-slate-950 text-white border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <span className="text-[10px] text-slate-500">{t.common.kg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InitialSetupModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function InitialSetupModal({
  open: propOpen,
  isOpen: propIsOpen,
  onOpenChange,
  onClose,
}: InitialSetupModalProps) {
  const isModalOpen = propOpen ?? propIsOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const { exercises, initializeProgram } = useWorkoutStore();
  const { weightIncrementKg } = useSettingsStore();
  const { t, language } = useTranslation();

  const [localExercises, setLocalExercises] = useState<ExerciseDefinition[]>(exercises);

  useEffect(() => {
    if (isModalOpen) {
      setLocalExercises(exercises);
    }
  }, [isModalOpen, exercises]);

  const [calcModalExercise, setCalcModalExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleUpdateExercise = (updated: ExerciseDefinition) => {
    setLocalExercises((prev) =>
      prev.map((ex) => (ex.id === updated.id ? updated : ex))
    );
  };

  const handleAddExercise = () => {
    const newId = `ex-${Date.now()}`;
    const newEx: ExerciseDefinition = {
      id: newId,
      name: language === "uk" ? "Нова вправа" : language === "en" ? "New Exercise" : "Новое упражнение",
      category: "main",
      oneRepMax: 60,
      startingPercentage: 0.40,
      customStartWeight: roundToWeightStep(60 * 0.40, weightIncrementKg),
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
        prev.map((ex) => {
          if (ex.id !== calcModalExercise.id) return ex;
          const pct = ex.startingPercentage || (ex.category === "main" ? 0.40 : 0.30);
          const newStart = roundToWeightStep(calculated1RM * pct, weightIncrementKg);
          return {
            ...ex,
            oneRepMax: calculated1RM,
            customStartWeight: newStart,
          };
        })
      );
    }
  };

  const handleGenerate = () => {
    initializeProgram(localExercises, weightIncrementKg);
    handleClose();
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose} className="max-w-lg">
        <DialogHeader className="shrink-0 mb-1">
          <DialogTitle onClose={handleClose}>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{t.dashboard.setup1pm}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {t.dashboard.setup1pmDesc}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable list with fixed footer */}
        <div className="space-y-3 my-1 overflow-y-auto overscroll-contain pr-1 flex-1 min-h-0">
          {localExercises.map((ex, idx) => (
            <ExerciseCardRow
              key={ex.id}
              exercise={ex}
              index={idx}
              totalCount={localExercises.length}
              weightIncrementKg={weightIncrementKg}
              onUpdate={handleUpdateExercise}
              onDelete={handleDeleteExercise}
              onOpenCalc={(id, name) => setCalcModalExercise({ id, name })}
            />
          ))}

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
              <span>{language === "uk" ? "Додати вправу" : language === "en" ? "Add Exercise" : "Добавить"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToClassic}
              className="text-xs text-slate-400 hover:text-white h-7"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span>{language === "uk" ? "Скинути до СМТ" : language === "en" ? "Reset to SMT" : "Сбросить к СМТ-1"}</span>
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
            <span>
              {language === "uk" ? "Сформувати 36 тренувань" : language === "en" ? "Generate 36 Workouts" : "Сформировать 36 тренировок"}
            </span>
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
