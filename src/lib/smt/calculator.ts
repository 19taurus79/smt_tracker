import { Superset } from "@/types/smt";

/**
 * Округление веса до заданного шага (по умолчанию 2.5 кг)
 */
export function roundToWeightStep(weight: number, step: number = 2.5): number {
  if (weight <= 0) return 0;
  return Math.round(weight / step) * step;
}

/**
 * Калькулятор 1ПМ (Одноповторного максимума)
 */
export function calculateOneRepMax(weight: number, reps: number): {
  epley: number;
  brzycki: number;
  average: number;
} {
  if (reps <= 0 || weight <= 0) {
    return { epley: 0, brzycki: 0, average: 0 };
  }
  if (reps === 1) {
    return { epley: weight, brzycki: weight, average: weight };
  }

  // Формула Эпли: 1RM = W * (1 + r / 30)
  const epley = weight * (1 + reps / 30);

  // Формула Бжицки: 1RM = W * (36 / (37 - r))
  const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley;

  const average = roundToWeightStep((epley + brzycki) / 2, 0.5);

  return {
    epley: roundToWeightStep(epley, 0.5),
    brzycki: roundToWeightStep(brzycki, 0.5),
    average,
  };
}

/**
 * Расчет суммарного тоннажа тренировки (кг)
 */
export function calculateWorkoutTonnage(supersets: Superset[]): number {
  let total = 0;
  for (const superset of supersets) {
    for (const exercise of superset.exercises) {
      for (const set of exercise.sets) {
        if (set.completed) {
          const weight = set.actualWeight ?? set.targetWeight;
          const reps = set.actualReps ?? set.targetReps;
          total += weight * reps;
        }
      }
    }
  }
  return Math.round(total * 10) / 10;
}

/**
 * Расчет плотности / мощности тренировки (кг/мин)
 */
export function calculateWorkoutPower(tonnageKg: number, durationSeconds: number): number {
  if (durationSeconds <= 0 || tonnageKg <= 0) return 0;
  const minutes = durationSeconds / 60;
  return Math.round((tonnageKg / minutes) * 10) / 10;
}

/**
 * Параметры микроцикла СМТ-1:
 * МКЦ 1 (1–9): 4x10 (40% 1RM) / 4x15 (30% 1RM)
 * МКЦ 2 (10–18): 4x8 / 4x12
 * МКЦ 3 (19–27): 4x6 / 4x9
 * МКЦ 4 (28–36): 4x4 / 4x6
 */
export function getMicrocycleParams(microcycle: 1 | 2 | 3 | 4) {
  switch (microcycle) {
    case 1:
      return {
        main: { sets: 4, reps: 10, percent: 0.40 },
        accessory: { sets: 4, reps: 15, percent: 0.30 },
      };
    case 2:
      return {
        main: { sets: 4, reps: 8, percent: 0.48 },
        accessory: { sets: 4, reps: 12, percent: 0.36 },
      };
    case 3:
      return {
        main: { sets: 4, reps: 6, percent: 0.56 },
        accessory: { sets: 4, reps: 9, percent: 0.42 },
      };
    case 4:
      return {
        main: { sets: 4, reps: 4, percent: 0.65 },
        accessory: { sets: 4, reps: 6, percent: 0.50 },
      };
  }
}
