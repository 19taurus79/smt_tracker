/**
 * SMT Ramp-up & Warm-up Calculator
 * 
 * Calculates physiological warm-up and ramp-up sets before continuous SMT-1 workout.
 * Purpose:
 * 1. Warm up synovial fluid and articulate joints without timer.
 * 2. Neuromuscular activation (PAP - Post-Activation Potentiation).
 * 3. Preserve glycogen and zero lactic acid accumulation before strict 30s rest SMT sets.
 */

import { Superset, WorkoutSession } from "@/types/smt";
import { roundToWeightStep } from "./calculator";

export interface WarmupSetPlan {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  percent: number; // e.g. 20, 50, 75, 90
  purpose: {
    uk: string;
    ru: string;
    en: string;
  };
  isBarbellEmpty?: boolean;
}

export interface ExerciseWarmupPlan {
  exerciseId: string;
  exerciseName: string;
  workingWeight: number;
  workingReps: number;
  workingSets: number;
  supersetLabel?: string;
  isMainCompound: boolean;
  sets: WarmupSetPlan[];
}

function isCompoundBarbell(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("жим") ||
    lower.includes("присід") ||
    lower.includes("тяг") ||
    lower.includes("станов") ||
    lower.includes("штанги") ||
    lower.includes("армійськ") ||
    lower.includes("squat") ||
    lower.includes("bench") ||
    lower.includes("deadlift") ||
    lower.includes("press")
  );
}

export function calculateWarmupSetsForExercise(
  exerciseId: string,
  exerciseName: string,
  workingWeight: number,
  workingReps: number = 10,
  workingSets: number = 4,
  weightStep: number = 2.5,
  supersetLabel?: string
): ExerciseWarmupPlan {
  const isMain = isCompoundBarbell(exerciseName);
  const sets: WarmupSetPlan[] = [];

  // Zero or bodyweight without extra load
  if (workingWeight <= 0) {
    return {
      exerciseId,
      exerciseName,
      workingWeight,
      workingReps,
      workingSets,
      supersetLabel,
      isMainCompound: isMain,
      sets: [
        {
          id: `${exerciseId}-warm-1`,
          setNumber: 1,
          weight: 0,
          reps: 10,
          percent: 0,
          purpose: {
            uk: "Власна вага • розігрів траєкторії",
            ru: "Собственный вес • разогрев траектории",
            en: "Bodyweight • trajectory warmup",
          },
        },
      ],
    };
  }

  // Very light weights (<= 15 kg - e.g. dumbbell lateral raises)
  if (workingWeight <= 15) {
    const w1 = Math.max(roundToWeightStep(workingWeight * 0.5, 1), 2);
    sets.push({
      id: `${exerciseId}-warm-1`,
      setNumber: 1,
      weight: Math.min(w1, Math.max(1, workingWeight - 2)),
      reps: 8,
      percent: 50,
      purpose: {
        uk: "Легкі гантелі • плавний розгін крові",
        ru: "Легкие гантели • плавный разгон крови",
        en: "Light load • blood flow activation",
      },
    });
  }
  // Light to moderate weights (17.5 kg - 45 kg)
  else if (workingWeight <= 45) {
    // Set 1: Empty bar or light dumbbells (approx 20 kg or 50%)
    const w1 = isMain ? 20 : Math.max(roundToWeightStep(workingWeight * 0.5, weightStep), weightStep);
    sets.push({
      id: `${exerciseId}-warm-1`,
      setNumber: 1,
      weight: Math.min(w1, Math.max(10, workingWeight - weightStep)),
      reps: 8,
      percent: Math.round((w1 / workingWeight) * 100),
      isBarbellEmpty: isMain && w1 === 20,
      purpose: {
        uk: isMain ? "Порожній гриф (20 кг) • суглоби та траєкторія" : "Легка вага • розминка зв'язок",
        ru: isMain ? "Пустой гриф (20 кг) • суставы и траектория" : "Легкий вес • разминка связок",
        en: isMain ? "Empty bar (20 kg) • joints & bar path" : "Light weight • tendon warmup",
      },
    });

    // Set 2: ~70%
    const w2 = roundToWeightStep(workingWeight * 0.7, weightStep);
    if (w2 > sets[0].weight && w2 < workingWeight) {
      sets.push({
        id: `${exerciseId}-warm-2`,
        setNumber: 2,
        weight: w2,
        reps: 5,
        percent: 70,
        purpose: {
          uk: "70% ваги • включення цільових волокон без втоми",
          ru: "70% веса • включение волокон без усталости",
          en: "70% load • motor unit recruitment without fatigue",
        },
      });
    }
  }
  // Medium-heavy weights (47.5 kg - 85 kg)
  else if (workingWeight < 87.5) {
    // 1. Empty bar (20 kg) x 10
    sets.push({
      id: `${exerciseId}-warm-1`,
      setNumber: 1,
      weight: 20,
      reps: 10,
      percent: Math.round((20 / workingWeight) * 100),
      isBarbellEmpty: true,
      purpose: {
        uk: "Порожній гриф (20 кг) • синовіальна рідина та суглоби",
        ru: "Пустой гриф (20 кг) • синовиальная смазка суставов",
        en: "Empty bar (20 kg) • synovial fluid & joint lubrication",
      },
    });

    // 2. ~50% x 6
    const w2 = roundToWeightStep(workingWeight * 0.5, weightStep);
    sets.push({
      id: `${exerciseId}-warm-2`,
      setNumber: 2,
      weight: w2,
      reps: 6,
      percent: 50,
      purpose: {
        uk: "50% ваги • нейром'язова синхронізація",
        ru: "50% веса • нейромышечная синхронизация",
        en: "50% load • neuromuscular sync",
      },
    });

    // 3. ~75% x 3
    const w3 = roundToWeightStep(workingWeight * 0.75, weightStep);
    if (w3 > w2 && w3 < workingWeight) {
      sets.push({
        id: `${exerciseId}-warm-3`,
        setNumber: 3,
        weight: w3,
        reps: 3,
        percent: 75,
        purpose: {
          uk: "75% ваги • звикання зв'язок (строго без закислення)",
          ru: "75% веса • адаптация связок (строго без закисления)",
          en: "75% load • tendon adaptation (zero lactic burn)",
        },
      });
    }
  }
  // Heavy weights (>= 87.5 kg) - Full 4-step ramp
  else {
    // 1. Empty bar (20 kg) x 10
    sets.push({
      id: `${exerciseId}-warm-1`,
      setNumber: 1,
      weight: 20,
      reps: 10,
      percent: Math.round((20 / workingWeight) * 100),
      isBarbellEmpty: true,
      purpose: {
        uk: "Порожній гриф (20 кг) • мастило суглобів та траєкторія",
        ru: "Пустой гриф (20 кг) • смазка суставов и траектория",
        en: "Empty bar (20 kg) • joint lubrication & bar path",
      },
    });

    // 2. 50% x 6
    const w2 = roundToWeightStep(workingWeight * 0.5, weightStep);
    sets.push({
      id: `${exerciseId}-warm-2`,
      setNumber: 2,
      weight: w2,
      reps: 6,
      percent: 50,
      purpose: {
        uk: "50% ваги • прогрів робочих м'язових волокон",
        ru: "50% веса • прогрев рабочих мышечных волокон",
        en: "50% load • muscle fiber warmup",
      },
    });

    // 3. 75% x 3
    const w3 = roundToWeightStep(workingWeight * 0.75, weightStep);
    sets.push({
      id: `${exerciseId}-warm-3`,
      setNumber: 3,
      weight: w3,
      reps: 3,
      percent: 75,
      purpose: {
        uk: "75% ваги • відчуття тиску на кістки та зв'язки",
        ru: "75% веса • ощущение давления на кости и связки",
        en: "75% load • pressure adaptation on connective tissue",
      },
    });

    // 4. ~87.5% - 90% x 1-2 (PAP Single - zero fatigue, max neural drive)
    const w4 = roundToWeightStep(workingWeight * 0.875, weightStep);
    if (w4 > w3 && w4 < workingWeight) {
      sets.push({
        id: `${exerciseId}-warm-4`,
        setNumber: 4,
        weight: w4,
        reps: 1,
        percent: 88,
        purpose: {
          uk: "88% ваги (сингл) • активація ЦНС без жодного закислення",
          ru: "88% веса (сингл) • активация ЦНС без единой капли закисления",
          en: "88% load (single) • CNS potentiation with zero fatigue",
        },
      });
    }
  }

  return {
    exerciseId,
    exerciseName,
    workingWeight,
    workingReps,
    workingSets,
    supersetLabel,
    isMainCompound: isMain,
    sets,
  };
}

/**
 * Generates the complete warm-up & ramp-up plan for an entire workout session
 */
export function generateWorkoutWarmupPlan(
  workout: WorkoutSession | null,
  weightStep: number = 2.5
): ExerciseWarmupPlan[] {
  if (!workout || !workout.supersets) return [];

  const plans: ExerciseWarmupPlan[] = [];
  const seenExerciseIds = new Set<string>();

  for (const ss of workout.supersets) {
    for (const ex of ss.exercises) {
      const id = ex.exerciseId || ex.id;
      if (!seenExerciseIds.has(id)) {
        seenExerciseIds.add(id);

        const workingWeight = ex.sets[0]?.targetWeight ?? ex.sets[0]?.actualWeight ?? 0;
        const workingReps = ex.sets[0]?.targetReps ?? 10;
        const workingSets = ex.sets.length || 4;

        const plan = calculateWarmupSetsForExercise(
          id,
          ex.name,
          workingWeight,
          workingReps,
          workingSets,
          weightStep,
          ss.label
        );

        plans.push(plan);
      }
    }
  }

  // Sort so heavy compound movements appear first (e.g. Bench press, Squat)
  return plans.sort((a, b) => {
    if (a.isMainCompound && !b.isMainCompound) return -1;
    if (!a.isMainCompound && b.isMainCompound) return 1;
    return b.workingWeight - a.workingWeight;
  });
}
