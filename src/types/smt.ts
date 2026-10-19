export type ExerciseCategory = "main" | "accessory";

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: ExerciseCategory;
  oneRepMax: number; // 1ПМ в кг
  startingPercentage: number; // 0.40 для базы, 0.30 для подсобки
  customStartWeight?: number; // Заданный пользователем стартовый вес для МКЦ-1
  notes?: string;
  // К какому блоку относится и как выполняется
  blockType?: "single" | "superset";
  blockGroup?: string; // id группы для суперсета, например 'block-1', 'block-2', 'superset-1'
}

export interface SetRecord {
  id: string;
  setNumber: number;
  targetWeight: number; // Плановый вес (кг)
  targetReps: number;   // Плановое количество повторений
  actualWeight?: number; // Фактический вес
  actualReps?: number;   // Фактические повторения
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  order: number;
  sets: SetRecord[];
}

export interface Superset {
  id: string;
  label: string; // e.g. "Блок 1: Жим лежа", "Суперсет 1: Подтягивания + Бицепс"
  type?: "single" | "superset";
  description?: string;
  exercises: WorkoutExercise[];
}

export type WorkoutStatus = "upcoming" | "in_progress" | "completed" | "skipped";

export interface WorkoutSession {
  id: string;
  workoutNumber: number; // 1 - 36
  microcycle: 1 | 2 | 3 | 4; // 1, 2, 3, 4
  week: number; // 1 - 12
  title: string;
  supersets: Superset[];
  status: WorkoutStatus;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  tonnageKg?: number;
  powerKgPerMin?: number;
  notes?: string;
}

export interface WarmupItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}
