import { roundToWeightStep, calculateOneRepMax } from "./calculator";
import { ExerciseDefinition } from "@/types/smt";

export interface PrepInputWeights {
  benchWeight: number; // Жим лежа (10-12 повт)
  benchReps?: number;
  pullWeight: number; // Тяга / Подтягивания (10-12 повт)
  pullReps?: number;
  squatWeight: number; // Присед / Жим ногами (10-12 повт)
  squatReps?: number;
}

export interface CalculatedSmtWeights {
  benchPress: { oneRepMax: number; startWeight: number; pct: number };
  closeGripBench: { oneRepMax: number; startWeight: number; pct: number };
  pullUps: { oneRepMax: number; startWeight: number; pct: number };
  bicepsCurl: { oneRepMax: number; startWeight: number; pct: number };
  squat: { oneRepMax: number; startWeight: number; pct: number };
  ohp: { oneRepMax: number; startWeight: number; pct: number };
}

/**
 * Рассчитывает 1ПМ и стартовые веса СМТ-1 на основании 3 базовых упражнений
 * подготовительной программы (выполненных на 10-12 повторений).
 */
export function calculateSmtStartingWeights(
  input: PrepInputWeights,
  weightStep: number = 2.5
): CalculatedSmtWeights {
  const benchReps = input.benchReps || 10;
  const pullReps = input.pullReps || 10;
  const squatReps = input.squatReps || 10;

  // 1. Рассчитываем 1ПМ для 3 ключевых движений
  const bench1RM = calculateOneRepMax(input.benchWeight, benchReps).average;
  const pull1RM = calculateOneRepMax(input.pullWeight, pullReps).average;
  const squat1RM = calculateOneRepMax(input.squatWeight, squatReps).average;

  // 2. Рассчитываем производные 1ПМ по физиологическим пропорциям
  // Жим узким хватом ≈ 85% от классического жима
  const closeGrip1RM = roundToWeightStep(bench1RM * 0.85, 0.5);

  // Бицепс штангой ≈ 48% от тяги/подтягиваний
  const biceps1RM = roundToWeightStep(pull1RM * 0.48, 0.5);

  // Армейский жим плечами ≈ 60% от жима лежа
  const ohp1RM = roundToWeightStep(bench1RM * 0.60, 0.5);

  // 3. Стартовые веса МКЦ-1: Базовые = 40% 1RM, Подсобные = 30% 1RM
  const benchStart = roundToWeightStep(bench1RM * 0.40, weightStep);
  const closeGripStart = roundToWeightStep(closeGrip1RM * 0.40, weightStep);
  const pullStart = roundToWeightStep(pull1RM * 0.40, weightStep);
  const bicepsStart = roundToWeightStep(biceps1RM * 0.30, weightStep);
  const squatStart = roundToWeightStep(squat1RM * 0.40, weightStep);
  const ohpStart = roundToWeightStep(ohp1RM * 0.30, weightStep);

  return {
    benchPress: { oneRepMax: bench1RM, startWeight: Math.max(benchStart, weightStep), pct: 0.40 },
    closeGripBench: { oneRepMax: closeGrip1RM, startWeight: Math.max(closeGripStart, weightStep), pct: 0.40 },
    pullUps: { oneRepMax: pull1RM, startWeight: Math.max(pullStart, weightStep), pct: 0.40 },
    bicepsCurl: { oneRepMax: biceps1RM, startWeight: Math.max(bicepsStart, weightStep), pct: 0.30 },
    squat: { oneRepMax: squat1RM, startWeight: Math.max(squatStart, weightStep), pct: 0.40 },
    ohp: { oneRepMax: ohp1RM, startWeight: Math.max(ohpStart, weightStep), pct: 0.30 },
  };
}
