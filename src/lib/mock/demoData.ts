import { generateFullProgram, DEFAULT_EXERCISES } from "../smt/generator";
import { WorkoutSession } from "@/types/smt";
import { calculateWorkoutTonnage, calculateWorkoutPower } from "../smt/calculator";

/**
 * Генерирует демонстрационные данные с несколькими уже пройденными тренировками
 * для немедленного отображения графиков и прогресса.
 */
export function getDemoProgram(): WorkoutSession[] {
  const workouts = generateFullProgram(DEFAULT_EXERCISES, 2.5);

  // Симулируем 4 пройденные тренировки (МКЦ 1)
  const completedCounts = 4;
  const now = Date.now();

  for (let i = 0; i < completedCounts; i++) {
    const w = workouts[i];
    w.status = "completed";
    w.startedAt = new Date(now - (completedCounts - i) * 2 * 24 * 3600 * 1000).toISOString();
    w.durationSeconds = 2400 + i * 90; // ~40 - 45 минут
    w.completedAt = new Date(new Date(w.startedAt).getTime() + w.durationSeconds * 1000).toISOString();

    // Отмечаем все подходы как выполненные
    for (const ss of w.supersets) {
      for (const ex of ss.exercises) {
        for (const s of ex.sets) {
          s.completed = true;
          s.actualWeight = s.targetWeight;
          s.actualReps = s.targetReps;
        }
      }
    }

    w.tonnageKg = calculateWorkoutTonnage(w.supersets);
    w.powerKgPerMin = calculateWorkoutPower(w.tonnageKg, w.durationSeconds);
    w.notes = `Отличный темп. Отдых 30 сек соблюден.`;
  }

  return workouts;
}
