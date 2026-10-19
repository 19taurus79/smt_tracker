import {
  ExerciseDefinition,
  Superset,
  WorkoutExercise,
  WorkoutSession,
  SetRecord,
} from "@/types/smt";
import { getMicrocycleParams, roundToWeightStep } from "./calculator";

/**
 * Классическая схема СМТ-1:
 * 1. Жим лежа (все 4 подхода) — одиночный блок (Базовое, 40%, 4x10)
 * 2. Жим лежа узким хватом (все 4 подхода) — одиночный блок (Базовое, 40%, 4x10)
 * 3. Суперсет 1:
 *    - Подтягивания (Основное, 40%, 10 повт) -> вес 1 (например 32.5 кг)
 *    - Штанга на бицепс (Подсобка, 30%, 15 повт) -> вес 2 (например 12.5 кг)
 * 4. Суперсет 2:
 *    - Приседания (Основное, 40%, 10 повт) -> вес 1 (например 40 кг)
 *    - Армейский жим (Подсобка, 30%, 15 повт) -> вес 2 (например 17.5 кг)
 */
export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  {
    id: "bench_press",
    name: "Жим штанги лежа",
    category: "main",
    oneRepMax: 90,
    startingPercentage: 0.40,
    blockType: "single",
    blockGroup: "block-bench",
    notes: "Базовое движение для груди. Все 4 подхода выполняются подряд с отдыхом 30 сек.",
  },
  {
    id: "close_grip_bench",
    name: "Жим лежа узким хватом",
    category: "main",
    oneRepMax: 75,
    startingPercentage: 0.40,
    blockType: "single",
    blockGroup: "block-close-grip",
    notes: "Базовое движение для трицепса. Все 4 подхода выполняются подряд с отдыхом 30 сек.",
  },
  {
    id: "pull_ups",
    name: "Подтягивания (или тяга)",
    category: "main", // Базовое: 40% от 1ПМ, 10 повторений
    oneRepMax: 80,
    startingPercentage: 0.40,
    blockType: "superset",
    blockGroup: "ss-back-biceps",
    notes: "Основное упражнение суперсета 1 (спина). 40% от 1ПМ (10 повт).",
  },
  {
    id: "biceps_curl",
    name: "Штанга на бицепс",
    category: "accessory", // Подсобка: 30% от 1ПМ, 15 повторений
    oneRepMax: 40,
    startingPercentage: 0.30,
    blockType: "superset",
    blockGroup: "ss-back-biceps",
    notes: "Подсобное упражнение суперсета 1 (руки). 30% от 1ПМ (15 повт).",
  },
  {
    id: "squat",
    name: "Приседания со штангой",
    category: "main", // Базовое: 40% от 1ПМ, 10 повторений
    oneRepMax: 100,
    startingPercentage: 0.40,
    blockType: "superset",
    blockGroup: "ss-legs-shoulders",
    notes: "Основное упражнение суперсета 2 (ноги). 40% от 1ПМ (10 повт).",
  },
  {
    id: "ohp",
    name: "Армейский жим (Жим стоя)",
    category: "accessory", // Подсобка в суперсете к ногам: 30% от 1ПМ, 15 повторений
    oneRepMax: 60,
    startingPercentage: 0.30,
    blockType: "superset",
    blockGroup: "ss-legs-shoulders",
    notes: "Подсобное упражнение суперсета 2 (плечи). 30% от 1ПМ (15 повт).",
  },
];

export const DEFAULT_WARMUP_LIST = [
  {
    id: "w1",
    title: "Вращения шеи и плечевого пояса",
    description: "Плавные круговые движения по 10-15 раз в каждую сторону.",
    completed: false,
  },
  {
    id: "w2",
    title: "Локтевые и лучезапястные суставы",
    description: "Разогрев суставов рук, вращения, легкие растяжки сухожилий.",
    completed: false,
  },
  {
    id: "w3",
    title: "Повороты корпуса и наклоны",
    description: "Мягкая мобилизация позвоночника и мышц кора (15-20 раз).",
    completed: false,
  },
  {
    id: "w4",
    title: "Тазобедренные и коленные суставы",
    description: "Вращения коленями, выпады без веса, вращения бедрами.",
    completed: false,
  },
  {
    id: "w5",
    title: "Голеностоп и приседания с собственным весом",
    description: "15 глубоких контролируемых приседаний с фиксацией внизу.",
    completed: false,
  },
];

/**
 * Создает набор тренировочных блоков (одиночных упражнений и суперсетов)
 * для тренировки с учетом микроцикла и текущих весов
 */
export function createSupersetsForWorkout(
  exercises: ExerciseDefinition[],
  microcycle: 1 | 2 | 3 | 4,
  workoutIdxInMkc: number, // 0 to 8
  weightStep: number = 2.5
): Superset[] {
  const params = getMicrocycleParams(microcycle);

  const getTargetWeight = (ex: ExerciseDefinition) => {
    const isMain = ex.category === "main";
    const baseWeight = ex.oneRepMax * (isMain ? params.main.percent : params.accessory.percent);
    const progressionBonus = Math.floor(workoutIdxInMkc / 3) * weightStep;
    return Math.max(roundToWeightStep(baseWeight + progressionBonus, weightStep), weightStep);
  };

  const createWorkoutExercise = (
    ex: ExerciseDefinition,
    order: number
  ): WorkoutExercise => {
    const isMain = ex.category === "main";
    const reps = isMain ? params.main.reps : params.accessory.reps;
    const setsCount = isMain ? params.main.sets : params.accessory.sets;
    const targetWeight = getTargetWeight(ex);

    const sets: SetRecord[] = Array.from({ length: setsCount }, (_, i) => ({
      id: `${ex.id}-set-${i + 1}`,
      setNumber: i + 1,
      targetWeight,
      targetReps: reps,
      completed: false,
    }));

    return {
      id: `we-${ex.id}`,
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      order,
      sets,
    };
  };

  // Группируем упражнения по blockGroup или blockType
  const groupsMap = new Map<string, ExerciseDefinition[]>();

  exercises.forEach((ex, idx) => {
    const groupId = ex.blockGroup || (ex.blockType === "single" ? `single-${ex.id}` : `group-${Math.floor(idx / 2)}`);
    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, []);
    }
    groupsMap.get(groupId)!.push(ex);
  });

  const supersets: Superset[] = [];
  let blockIndex = 1;
  let supersetIndex = 1;

  groupsMap.forEach((groupExercises, groupId) => {
    const isSingle = groupExercises.length === 1;

    let label: string;
    let description: string;

    if (isSingle) {
      const ex = groupExercises[0];
      label = `Блок ${blockIndex}: ${ex.name}`;
      description = "Одиночное упражнение — все подходы подряд, отдых 30 сек";
      blockIndex++;
    } else {
      label = `Суперсет ${supersetIndex}: ${groupExercises.map((e) => e.name).join(" + ")}`;
      description = "Чередование: Основное (40%) + Подсобка (30%), отдых 30 сек";
      supersetIndex++;
    }

    supersets.push({
      id: groupId,
      label,
      type: isSingle ? "single" : "superset",
      description,
      exercises: groupExercises.map((ex, o) => createWorkoutExercise(ex, o + 1)),
    });
  });

  return supersets;
}

/**
 * Генерирует полную сетку программы СМТ-1:
 * 36 тренировок (4 микроцикла по 9 тренировок / 12 недель)
 */
export function generateFullProgram(
  exercises: ExerciseDefinition[] = DEFAULT_EXERCISES,
  weightStep: number = 2.5
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];

  for (let num = 1; num <= 36; num++) {
    const microcycle = (Math.floor((num - 1) / 9) + 1) as 1 | 2 | 3 | 4;
    const week = Math.floor((num - 1) / 3) + 1;
    const workoutIdxInMkc = (num - 1) % 9;

    const supersets = createSupersetsForWorkout(
      exercises,
      microcycle,
      workoutIdxInMkc,
      weightStep
    );

    sessions.push({
      id: `smt-workout-${num}`,
      workoutNumber: num,
      microcycle,
      week,
      title: `Тренировка #${num} (МКЦ-${microcycle}, Неделя ${week})`,
      supersets,
      status: num === 1 ? "upcoming" : "upcoming",
    });
  }

  return sessions;
}
