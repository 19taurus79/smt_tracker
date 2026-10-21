import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface TraineeWorkoutRecord {
  id: string;
  workoutNumber: number;
  microcycle: number;
  date: string; // ISO string
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore: number;
  tierKey: "titan" | "iron_pro" | "power_master" | "active" | "lead";
  tierLabel: string;
  notes?: string;
  exercises: Array<{
    name: string;
    weight: number;
    reps: number;
    setsCount: number;
  }>;
}

export interface TraineeMeasurementRecord {
  id: string;
  date: string; // ISO string
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  bicepsCm?: number;
  thighCm?: number;
}

export interface TraineeProfile {
  id: string;
  name: string;
  username: string; // telegram username without @
  telegramChatId?: string;
  avatarColor: string; // gradient CSS class
  gender: "male" | "female";
  age: number;
  currentMicrocycle: number;
  currentWorkoutNumber: number;
  totalWorkouts: number;
  weightKg: number;
  weightDeltaKg: number;
  lastWorkoutDate: string;
  athleticScore: number;
  tierKey: "titan" | "iron_pro" | "power_master" | "active" | "lead";
  tierLabel: string;
  status: "active" | "resting" | "needs_attention" | "new_lead" | "blocked";
  coachNotes: string;
  workoutHistory: TraineeWorkoutRecord[];
  measurementHistory: TraineeMeasurementRecord[];
}

export type TraineeStatusFilter = "all" | "active" | "needs_attention" | "new_lead" | "blocked";

interface CoachStoreState {
  trainees: TraineeProfile[];
  selectedTraineeId: string | null;
  searchQuery: string;
  statusFilter: TraineeStatusFilter;
  setSelectedTraineeId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: TraineeStatusFilter) => void;
  addTrainee: (trainee: Omit<TraineeProfile, "id">) => void;
  updateTrainee: (id: string, updates: Partial<TraineeProfile>) => void;
  updateCoachNotes: (id: string, notes: string) => void;
  blockTrainee: (id: string) => void;
  unblockTrainee: (id: string) => void;
  deleteTrainee: (id: string) => void;
  clearAllTrainees: () => void;
  registerLead: (lead: { name: string; username?: string; telegramChatId?: string }) => void;
  recordWorkoutForTrainee: (
    identifier: string, // id or username
    workout: Omit<TraineeWorkoutRecord, "id">
  ) => void;
  resetToDefaultTrainees: () => void;
}

const initialTrainees: TraineeProfile[] = [
  {
    id: "trainee-1",
    name: "Олександр Кравченко",
    username: "alex_kravchenko_smt",
    avatarColor: "from-blue-500 to-indigo-600",
    gender: "male",
    age: 29,
    currentMicrocycle: 2,
    currentWorkoutNumber: 15,
    totalWorkouts: 15,
    weightKg: 84.5,
    weightDeltaKg: 1.5,
    lastWorkoutDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    athleticScore: 92,
    tierKey: "titan",
    tierLabel: "ТИТАН СИЛИ ⚡",
    status: "active",
    coachNotes: "Відмінна прогресія у жимі та присіді. Збільшили робочу вагу на МКЦ-2. Слідкувати за відновленням плеча.",
    workoutHistory: [
      {
        id: "w-15",
        workoutNumber: 15,
        microcycle: 2,
        date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        durationSeconds: 42 * 60,
        tonnageKg: 11450,
        powerKgPerMin: 272,
        athleticScore: 92,
        tierKey: "titan",
        tierLabel: "ТИТАН СИЛИ ⚡",
        notes: "Легко зайшли всі 4 підходи на груди, паузи суворо 30 сек.",
        exercises: [
          { name: "Жим штанги лежачи", weight: 95, reps: 10, setsCount: 4 },
          { name: "Розведення гантелей на похилій", weight: 22, reps: 10, setsCount: 4 },
          { name: "Присідання зі штангою", weight: 120, reps: 10, setsCount: 4 },
          { name: "Випади з гантелями", weight: 20, reps: 10, setsCount: 4 },
        ],
      },
      {
        id: "w-14",
        workoutNumber: 14,
        microcycle: 2,
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        durationSeconds: 44 * 60,
        tonnageKg: 10800,
        powerKgPerMin: 245,
        athleticScore: 88,
        tierKey: "iron_pro",
        tierLabel: "Залізний Профі 🦾",
        exercises: [
          { name: "Тяга верхнього блоку", weight: 75, reps: 10, setsCount: 4 },
          { name: "Тяга штанги в нахилі", weight: 80, reps: 10, setsCount: 4 },
        ],
      },
    ],
    measurementHistory: [
      {
        id: "m-1",
        date: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
        weightKg: 84.5,
        waistCm: 81,
        chestCm: 112,
        bicepsCm: 41,
        thighCm: 61,
      },
    ],
  },
  {
    id: "trainee-2",
    name: "Дмитро Мельник",
    username: "dmitry_melnik",
    avatarColor: "from-emerald-500 to-teal-600",
    gender: "male",
    age: 33,
    currentMicrocycle: 1,
    currentWorkoutNumber: 7,
    totalWorkouts: 7,
    weightKg: 78.0,
    weightDeltaKg: -0.8,
    lastWorkoutDate: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    athleticScore: 84,
    tierKey: "iron_pro",
    tierLabel: "Залізний Профі 🦾",
    status: "active",
    coachNotes: "Техніка стабільна. Звернути увагу на темп опускання в суперсеті для спини.",
    workoutHistory: [
      {
        id: "w-7",
        workoutNumber: 7,
        microcycle: 1,
        date: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
        durationSeconds: 46 * 60,
        tonnageKg: 9100,
        powerKgPerMin: 198,
        athleticScore: 84,
        tierKey: "iron_pro",
        tierLabel: "Залізний Профі 🦾",
        exercises: [
          { name: "Жим штанги стоячи (Армійський)", weight: 55, reps: 10, setsCount: 4 },
          { name: "Махи гантелями через сторони", weight: 14, reps: 10, setsCount: 4 },
          { name: "Станова тяга на прямих ногах", weight: 90, reps: 10, setsCount: 4 },
        ],
      },
    ],
    measurementHistory: [
      {
        id: "m-dm-1",
        date: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
        weightKg: 78.0,
        waistCm: 79,
        chestCm: 104,
        bicepsCm: 38.5,
        thighCm: 57,
      },
    ],
  },
  {
    id: "trainee-3",
    name: "Олена Ковальчук",
    username: "elena_koval",
    avatarColor: "from-pink-500 to-rose-600",
    gender: "female",
    age: 26,
    currentMicrocycle: 1,
    currentWorkoutNumber: 4,
    totalWorkouts: 4,
    weightKg: 61.2,
    weightDeltaKg: -1.2,
    lastWorkoutDate: new Date(Date.now() - 76 * 3600 * 1000).toISOString(),
    athleticScore: 78,
    tierKey: "power_master",
    tierLabel: "Майстер Потужності 💥",
    status: "needs_attention",
    coachNotes: "Пропустила тренування у середу. Написати в Telegram та дізнатися про самопочуття.",
    workoutHistory: [
      {
        id: "w-4",
        workoutNumber: 4,
        microcycle: 1,
        date: new Date(Date.now() - 76 * 3600 * 1000).toISOString(),
        durationSeconds: 40 * 60,
        tonnageKg: 5800,
        powerKgPerMin: 145,
        athleticScore: 78,
        tierKey: "power_master",
        tierLabel: "Майстер Потужності 💥",
        exercises: [
          { name: "Присідання кубкові з гантеллю", weight: 24, reps: 10, setsCount: 4 },
          { name: "Сідничний місток зі штангою", weight: 65, reps: 10, setsCount: 4 },
        ],
      },
    ],
    measurementHistory: [
      {
        id: "m-el-1",
        date: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
        weightKg: 61.2,
        waistCm: 65,
        chestCm: 89,
      },
    ],
  },
  {
    id: "trainee-4",
    name: "Максим Бондаренко",
    username: "max_bondarenko",
    avatarColor: "from-amber-500 to-orange-600",
    gender: "male",
    age: 36,
    currentMicrocycle: 3,
    currentWorkoutNumber: 22,
    totalWorkouts: 22,
    weightKg: 91.0,
    weightDeltaKg: 2.1,
    lastWorkoutDate: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    athleticScore: 96,
    tierKey: "titan",
    tierLabel: "ТИТАН СИЛИ ⚡",
    status: "active",
    coachNotes: "Ветеран програми СМТ. Наближається до 36-го тренування. Планувати вихід на пік сили.",
    workoutHistory: [
      {
        id: "w-22",
        workoutNumber: 22,
        microcycle: 3,
        date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        durationSeconds: 38 * 60,
        tonnageKg: 13200,
        powerKgPerMin: 347,
        athleticScore: 96,
        tierKey: "titan",
        tierLabel: "ТИТАН СИЛИ ⚡",
        exercises: [
          { name: "Жим штанги лежачи", weight: 110, reps: 10, setsCount: 4 },
          { name: "Присідання зі штангою", weight: 140, reps: 10, setsCount: 4 },
        ],
      },
    ],
    measurementHistory: [],
  },
];

export const useCoachStore = create<CoachStoreState>()(
  persist(
    (set, get) => ({
      trainees: initialTrainees,
      selectedTraineeId: null,
      searchQuery: "",
      statusFilter: "all",

      setSelectedTraineeId: (id) => set({ selectedTraineeId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setStatusFilter: (filter) => set({ statusFilter: filter }),

      addTrainee: (newTrainee) =>
        set((state) => ({
          trainees: [
            {
              ...newTrainee,
              id: `trainee-${Date.now()}`,
            },
            ...state.trainees,
          ],
        })),

      updateTrainee: (id, updates) =>
        set((state) => ({
          trainees: state.trainees.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      updateCoachNotes: (id, notes) =>
        set((state) => ({
          trainees: state.trainees.map((t) =>
            t.id === id ? { ...t, coachNotes: notes } : t
          ),
        })),

      blockTrainee: (id) =>
        set((state) => ({
          trainees: state.trainees.map((t) =>
            t.id === id ? { ...t, status: "blocked" } : t
          ),
        })),

      unblockTrainee: (id) =>
        set((state) => ({
          trainees: state.trainees.map((t) =>
            t.id === id ? { ...t, status: "active" } : t
          ),
        })),

      deleteTrainee: (id) =>
        set((state) => ({
          trainees: state.trainees.filter((t) => t.id !== id),
          selectedTraineeId: state.selectedTraineeId === id ? null : state.selectedTraineeId,
        })),

      clearAllTrainees: () =>
        set({
          trainees: [],
          selectedTraineeId: null,
        }),

      registerLead: ({ name, username, telegramChatId }) =>
        set((state) => {
          const cleanUsername = (username || "").replace(/^@/, "").toLowerCase();
          const existing = state.trainees.find(
            (t) =>
              (cleanUsername && t.username.toLowerCase() === cleanUsername) ||
              (telegramChatId && t.telegramChatId === telegramChatId)
          );

          if (existing) {
            // Already in roster — make sure not blocked
            return state;
          }

          const colors = [
            "from-blue-500 to-indigo-600",
            "from-emerald-500 to-teal-600",
            "from-purple-500 to-violet-600",
            "from-amber-500 to-orange-600",
            "from-rose-500 to-pink-600",
          ];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];

          const newLead: TraineeProfile = {
            id: `lead-${Date.now()}`,
            name: name || "Новий атлет",
            username: cleanUsername || "",
            telegramChatId,
            avatarColor: randomColor,
            gender: "male",
            age: 28,
            currentMicrocycle: 1,
            currentWorkoutNumber: 1,
            totalWorkouts: 0,
            weightKg: 80,
            weightDeltaKg: 0,
            lastWorkoutDate: new Date().toISOString(),
            athleticScore: 70,
            tierKey: "lead",
            tierLabel: "НОВИЙ ЛІД 🔥",
            status: "new_lead",
            coachNotes: "Атлет підписався на канал та запустив трекер. Зв'язатися для вітання та підбору стартових ваг.",
            workoutHistory: [],
            measurementHistory: [],
          };

          return {
            trainees: [newLead, ...state.trainees],
          };
        }),

      recordWorkoutForTrainee: (identifier, workout) =>
        set((state) => {
          const cleanId = identifier.toLowerCase().replace(/^@/, "");
          const traineeIndex = state.trainees.findIndex(
            (t) => t.id === identifier || t.username.toLowerCase() === cleanId
          );

          if (traineeIndex === -1) return state;

          const target = state.trainees[traineeIndex];
          const newWorkoutRecord: TraineeWorkoutRecord = {
            ...workout,
            id: `w-${Date.now()}`,
          };

          const updatedHistory = [newWorkoutRecord, ...target.workoutHistory];
          const updatedTrainee: TraineeProfile = {
            ...target,
            currentWorkoutNumber: workout.workoutNumber,
            currentMicrocycle: workout.microcycle,
            totalWorkouts: target.totalWorkouts + 1,
            lastWorkoutDate: workout.date,
            athleticScore: workout.athleticScore,
            tierKey: workout.tierKey,
            tierLabel: workout.tierLabel,
            status: target.status === "blocked" ? "blocked" : "active",
            workoutHistory: updatedHistory,
          };

          const updatedList = [...state.trainees];
          updatedList[traineeIndex] = updatedTrainee;

          return { trainees: updatedList };
        }),

      resetToDefaultTrainees: () =>
        set({
          trainees: initialTrainees,
          selectedTraineeId: null,
          searchQuery: "",
          statusFilter: "all",
        }),
    }),
    {
      name: "smt_coach_v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
