import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ExerciseDefinition,
  WorkoutSession,
  WarmupItem,
} from "@/types/smt";
import {
  generateFullProgram,
  DEFAULT_EXERCISES,
  DEFAULT_WARMUP_LIST,
} from "../smt/generator";
import {
  calculateWorkoutTonnage,
  calculateWorkoutPower,
  roundToWeightStep,
} from "../smt/calculator";
import { getDemoProgram } from "../mock/demoData";
import { soundPlayer } from "../audio/sound";
import { triggerHaptic, setWorkoutActiveMode } from "../tma/telegram";

interface WorkoutState {
  exercises: ExerciseDefinition[];
  workouts: WorkoutSession[];
  activeWorkoutId: string | null;
  viewingWorkoutId: string | null;
  workoutElapsedSeconds: number;
  isStopwatchRunning: boolean;
  
  // Разминка
  isWarmupModalOpen: boolean;
  warmupItems: WarmupItem[];
  
  // Таймер отдыха
  isRestTimerActive: boolean;
  restTimerSeconds: number;
  restTimerMaxSeconds: number;

  // Флаг гидратации для SSR Next.js
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  // Actions
  initializeProgram: (exercises: ExerciseDefinition[], weightStep?: number) => void;
  updateExercise1RM: (exerciseId: string, oneRepMax: number) => void;
  setViewingWorkoutId: (workoutId: string | null) => void;
  startWorkout: (workoutId: string) => void;
  restartWorkout: (workoutId: string) => void;
  resetWorkout: (workoutId: string) => void;
  pauseStopwatch: () => void;
  resumeStopwatch: () => void;
  tickStopwatch: () => void;
  
  openWarmupModal: () => void;
  closeWarmupModal: () => void;
  toggleWarmupItem: (itemId: string) => void;
  completeWarmupAndStart: () => void;

  startRestTimer: (durationSeconds?: number) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;

  updateSet: (
    workoutId: string,
    supersetId: string,
    exerciseId: string,
    setNumber: number,
    data: { actualWeight?: number; actualReps?: number; completed?: boolean }
  ) => void;

  toggleSetCompletion: (
    workoutId: string,
    supersetId: string,
    exerciseId: string,
    setNumber: number,
    restDuration?: number,
    soundEnabled?: boolean,
    hapticsEnabled?: boolean
  ) => void;

  completeSupersetRound: (
    workoutId: string,
    supersetId: string,
    roundNumber: number,
    restDuration?: number,
    soundEnabled?: boolean,
    hapticsEnabled?: boolean
  ) => void;

  finishWorkout: (
    notes?: string,
    exerciseIncrements?: Record<string, number>,
    weightStep?: number,
    soundEnabled?: boolean,
    hapticsEnabled?: boolean,
    overrideDurationSeconds?: number,
    targetWorkoutId?: string
  ) => { tonnage: number; power: number; progressed: boolean };

  cancelWorkout: () => void;
  loadDemoData: () => void;
  resetAllWorkouts: () => void;
  setWorkouts: (workouts: WorkoutSession[]) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      exercises: DEFAULT_EXERCISES,
      workouts: generateFullProgram(DEFAULT_EXERCISES, 2.5),
      activeWorkoutId: null,
      viewingWorkoutId: null,
      workoutElapsedSeconds: 0,
      isStopwatchRunning: false,

      isWarmupModalOpen: false,
      warmupItems: DEFAULT_WARMUP_LIST,

      isRestTimerActive: false,
      restTimerSeconds: 30,
      restTimerMaxSeconds: 30,

      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),

      initializeProgram: (exercises, weightStep = 2.5) => {
        const workouts = generateFullProgram(exercises, weightStep);
        set({
          exercises,
          workouts,
          activeWorkoutId: null,
          viewingWorkoutId: null,
          workoutElapsedSeconds: 0,
          isStopwatchRunning: false,
        });
      },

      updateExercise1RM: (exerciseId, oneRepMax) => {
        set((state) => ({
          exercises: state.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, oneRepMax } : ex
          ),
        }));
      },

      setViewingWorkoutId: (workoutId) => set({ viewingWorkoutId: workoutId }),

      startWorkout: (workoutId) => {
        const { workouts } = get();
        const workout = workouts.find((w) => w.id === workoutId);
        if (!workout) return;

        // Если тренировка уже завершена, НЕ перезапускаем её в in_progress и не включаем таймер!
        if (workout.status === "completed") {
          set({
            viewingWorkoutId: workoutId,
            isStopwatchRunning: false,
          });
          return;
        }

        set({
          activeWorkoutId: workoutId,
          viewingWorkoutId: workoutId,
          workoutElapsedSeconds: workout.durationSeconds || 0,
          isStopwatchRunning: true,
        });
        setWorkoutActiveMode(true);
        set({
          workouts: workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  status: "in_progress",
                  startedAt: w.startedAt || new Date().toISOString(),
                }
              : w
          ),
        });
      },

      resetWorkout: (workoutId) => {
        const { workouts, activeWorkoutId } = get();
        const workout = workouts.find((w) => w.id === workoutId);
        if (!workout) return;

        const isActive = activeWorkoutId === workoutId;
        if (isActive) setWorkoutActiveMode(false);

        set({
          activeWorkoutId: isActive ? null : activeWorkoutId,
          workoutElapsedSeconds: isActive ? 0 : get().workoutElapsedSeconds,
          isStopwatchRunning: isActive ? false : get().isStopwatchRunning,
          isRestTimerActive: isActive ? false : get().isRestTimerActive,
          workouts: workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              status: "upcoming" as const,
              startedAt: undefined,
              completedAt: undefined,
              durationSeconds: 0,
              tonnageKg: undefined,
              powerKgPerMin: undefined,
              notes: undefined,
              supersets: w.supersets.map((ss) => ({
                ...ss,
                exercises: ss.exercises.map((ex) => ({
                  ...ex,
                  sets: ex.sets.map((s) => ({
                    ...s,
                    completed: false,
                    actualWeight: undefined,
                    actualReps: undefined,
                    completedAt: undefined,
                  })),
                })),
              })),
            };
          }),
        });
      },

      restartWorkout: (workoutId) => {
        get().resetWorkout(workoutId);
        get().startWorkout(workoutId);
      },

      pauseStopwatch: () => set({ isStopwatchRunning: false }),
      resumeStopwatch: () => set({ isStopwatchRunning: true }),
      tickStopwatch: () => {
        const { isStopwatchRunning, workoutElapsedSeconds } = get();
        if (isStopwatchRunning) {
          set({ workoutElapsedSeconds: workoutElapsedSeconds + 1 });
        }
      },

      openWarmupModal: () => set({ isWarmupModalOpen: true }),
      closeWarmupModal: () => set({ isWarmupModalOpen: false }),
      toggleWarmupItem: (itemId) =>
        set((state) => ({
          warmupItems: state.warmupItems.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        })),
      completeWarmupAndStart: () => {
        const { activeWorkoutId, viewingWorkoutId, startWorkout, workouts } = get();
        set({ isWarmupModalOpen: false });
        const targetId = viewingWorkoutId || activeWorkoutId;
        const targetWorkout = workouts.find((w) => w.id === targetId);
        if (targetWorkout && targetWorkout.status !== "completed") {
          startWorkout(targetWorkout.id);
        } else if (activeWorkoutId) {
          set({ isStopwatchRunning: true });
        } else {
          const nextUpcoming =
            workouts.find((w) => w.status === "in_progress") ||
            workouts.find((w) => w.status === "upcoming") ||
            workouts[0];
          if (nextUpcoming) {
            startWorkout(nextUpcoming.id);
          }
        }
      },

      startRestTimer: (duration = 30) => {
        set({
          isRestTimerActive: true,
          restTimerSeconds: duration,
          restTimerMaxSeconds: duration,
        });
      },

      adjustRestTimer: (delta) => {
        set((state) => {
          const newSeconds = Math.max(0, state.restTimerSeconds + delta);
          return {
            restTimerSeconds: newSeconds,
            restTimerMaxSeconds: Math.max(state.restTimerMaxSeconds, newSeconds),
            isRestTimerActive: newSeconds > 0,
          };
        });
      },

      stopRestTimer: () => set({ isRestTimerActive: false, restTimerSeconds: 0 }),

      tickRestTimer: () => {
        const { isRestTimerActive, restTimerSeconds } = get();
        if (!isRestTimerActive) return;

        if (restTimerSeconds <= 1) {
          // Таймер окончен!
          set({ isRestTimerActive: false, restTimerSeconds: 0 });
          soundPlayer.playRestComplete();
          triggerHaptic("heavy");
        } else {
          // Звук тика на последних 3 секундах
          if (restTimerSeconds <= 4) {
            soundPlayer.playTick();
            triggerHaptic("selection");
          }
          set({ restTimerSeconds: restTimerSeconds - 1 });
        }
      },

      updateSet: (workoutId, supersetId, exerciseId, setNumber, data) => {
        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              supersets: w.supersets.map((ss) => {
                if (ss.id !== supersetId) return ss;
                return {
                  ...ss,
                  exercises: ss.exercises.map((ex) => {
                    if (ex.exerciseId !== exerciseId) return ex;
                    return {
                      ...ex,
                      sets: ex.sets.map((s) => {
                        if (s.setNumber !== setNumber) return s;
                        return { ...s, ...data };
                      }),
                    };
                  }),
                };
              }),
            };
          }),
        }));
      },

      toggleSetCompletion: (
        workoutId,
        supersetId,
        exerciseId,
        setNumber,
        restDuration = 30,
        soundEnabled = true,
        hapticsEnabled = true
      ) => {
        const { workouts, startRestTimer } = get();
        const workout = workouts.find((w) => w.id === workoutId);
        if (!workout || workout.status !== "in_progress") return;

        const ss = workout.supersets.find((s) => s.id === supersetId);
        const ex = ss?.exercises.find((e) => e.exerciseId === exerciseId);
        const s = ex?.sets.find((set) => set.setNumber === setNumber);
        if (!s) return;

        const willBeCompleted = !s.completed;

        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              supersets: w.supersets.map((superSet) => {
                if (superSet.id !== supersetId) return superSet;
                return {
                  ...superSet,
                  exercises: superSet.exercises.map((exercise) => {
                    if (exercise.exerciseId !== exerciseId) return exercise;
                    return {
                      ...exercise,
                      sets: exercise.sets.map((item) => {
                        if (item.setNumber !== setNumber) return item;
                        return {
                          ...item,
                          completed: willBeCompleted,
                          actualWeight: item.actualWeight ?? item.targetWeight,
                          actualReps: item.actualReps ?? item.targetReps,
                          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
                        };
                      }),
                    };
                  }),
                };
              }),
            };
          }),
        }));

        if (willBeCompleted) {
          if (hapticsEnabled) triggerHaptic("impact");
          if (soundEnabled) soundPlayer.playBeep(600, 0.1, "sine");
          // Автостарт таймера отдыха
          startRestTimer(restDuration);
        }
      },

      completeSupersetRound: (
        workoutId,
        supersetId,
        roundNumber,
        restDuration = 30,
        soundEnabled = true,
        hapticsEnabled = true
      ) => {
        let willBeCompleted = false;

        set((state) => {
          const workout = state.workouts.find((w) => w.id === workoutId);
          if (!workout || workout.status !== "in_progress") return state;

          const ss = workout.supersets.find((s) => s.id === supersetId);
          if (!ss) return state;

          const allRoundSetsCompleted = ss.exercises.every((ex) => {
            const s = ex.sets.find((set) => set.setNumber === roundNumber);
            return s ? s.completed : false;
          });

          willBeCompleted = !allRoundSetsCompleted;

          const updatedWorkouts = state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              supersets: w.supersets.map((s) => {
                if (s.id !== supersetId) return s;
                return {
                  ...s,
                  exercises: s.exercises.map((ex) => ({
                    ...ex,
                    sets: ex.sets.map((set) => {
                      if (set.setNumber !== roundNumber) return set;
                      return {
                        ...set,
                        completed: willBeCompleted,
                        actualWeight: set.actualWeight ?? set.targetWeight,
                        actualReps: set.actualReps ?? set.targetReps,
                      };
                    }),
                  })),
                };
              }),
            };
          });

          return { workouts: updatedWorkouts };
        });

        if (willBeCompleted) {
          if (hapticsEnabled) triggerHaptic("success");
          if (soundEnabled) soundPlayer.playBeep(600, 0.15, "sine");
          // Отдых 30 сек запускается ТОЛЬКО после завершения всего круга
          get().startRestTimer(restDuration);
        }
      },

      finishWorkout: (
        notes,
        exerciseIncrements,
        weightStep = 2.5,
        soundEnabled = true,
        hapticsEnabled = true,
        overrideDurationSeconds,
        targetWorkoutId
      ) => {
        const { activeWorkoutId, workouts, workoutElapsedSeconds } = get();
        const workoutIdToFinish =
          targetWorkoutId ||
          activeWorkoutId ||
          workouts.find((w) => w.status === "in_progress")?.id ||
          workouts.find((w) => w.status === "upcoming")?.id ||
          workouts[0]?.id;

        if (!workoutIdToFinish) return { tonnage: 0, power: 0, progressed: false };

        const currentWorkout = workouts.find((w) => w.id === workoutIdToFinish);
        if (!currentWorkout) return { tonnage: 0, power: 0, progressed: false };

        const effectiveDuration =
          overrideDurationSeconds !== undefined && overrideDurationSeconds > 0
            ? overrideDurationSeconds
            : (currentWorkout.durationSeconds || workoutElapsedSeconds);

        const tonnage = calculateWorkoutTonnage(currentWorkout.supersets);
        const power = calculateWorkoutPower(tonnage, effectiveDuration);

        // Проверяем, все ли подходы успешно закрыты
        let allSetsCompleted = true;
        for (const ss of currentWorkout.supersets) {
          for (const ex of ss.exercises) {
            for (const s of ex.sets) {
              if (!s.completed || (s.actualReps && s.actualReps < s.targetReps)) {
                allSetsCompleted = false;
              }
            }
          }
        }

        // Обновляем последующие тренировки
        const updatedWorkouts = workouts.map((w) => {
          if (w.id === workoutIdToFinish) {
            return {
              ...w,
              status: "completed" as const,
              completedAt: new Date().toISOString(),
              durationSeconds: effectiveDuration,
              tonnageKg: tonnage,
              powerKgPerMin: power,
              notes: notes || w.notes,
            };
          }

          if (w.workoutNumber > currentWorkout.workoutNumber) {
            // Если переданы предложенные пользователем прибавки весов:
            if (exerciseIncrements && Object.keys(exerciseIncrements).length > 0) {
              return {
                ...w,
                supersets: w.supersets.map((ss) => ({
                  ...ss,
                  exercises: ss.exercises.map((ex) => {
                    const inc = exerciseIncrements[ex.exerciseId] || 0;
                    if (inc === 0) return ex;
                    return {
                      ...ex,
                      sets: ex.sets.map((s) => ({
                        ...s,
                        targetWeight: roundToWeightStep(s.targetWeight + inc, 1.25),
                      })),
                    };
                  }),
                })),
              };
            } else if (allSetsCompleted && w.microcycle === currentWorkout.microcycle) {
              // Авто-прибавка по умолчанию для текущего микроцикла
              return {
                ...w,
                supersets: w.supersets.map((ss) => ({
                  ...ss,
                  exercises: ss.exercises.map((ex) => ({
                    ...ex,
                    sets: ex.sets.map((s) => ({
                      ...s,
                      targetWeight: roundToWeightStep(s.targetWeight + weightStep, weightStep),
                    })),
                  })),
                })),
              };
            }
          }

          return w;
        });

        set({
          workouts: updatedWorkouts,
          activeWorkoutId: null,
          workoutElapsedSeconds: 0,
          isStopwatchRunning: false,
          isRestTimerActive: false,
        });

        if (soundEnabled) soundPlayer.playWorkoutComplete();
        if (hapticsEnabled) triggerHaptic("success");

        return { tonnage, power, progressed: allSetsCompleted };
      },

      cancelWorkout: () => {
        const { activeWorkoutId, workouts } = get();
        if (!activeWorkoutId) return;

        set({
          activeWorkoutId: null,
          workoutElapsedSeconds: 0,
          isStopwatchRunning: false,
          isRestTimerActive: false,
          workouts: workouts.map((w) =>
            w.id === activeWorkoutId && w.status === "in_progress"
              ? { ...w, status: "upcoming" }
              : w
          ),
        });
      },

      loadDemoData: () => {
        set({
          workouts: getDemoProgram(),
          activeWorkoutId: null,
          workoutElapsedSeconds: 0,
          isStopwatchRunning: false,
          isRestTimerActive: false,
        });
      },

      resetAllWorkouts: () => {
        const { exercises } = get();
        set({
          workouts: generateFullProgram(exercises, 2.5),
          activeWorkoutId: null,
          workoutElapsedSeconds: 0,
          isStopwatchRunning: false,
          isRestTimerActive: false,
        });
      },

      setWorkouts: (workouts) => set({ workouts }),
    }),
    {
      name: "smt_workouts_v2",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
