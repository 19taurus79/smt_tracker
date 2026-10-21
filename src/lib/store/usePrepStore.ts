import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { calculateSmtStartingWeights, CalculatedSmtWeights } from "@/lib/smt/prepCalculator";

export interface PrepSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface PrepExercise {
  id: "bench" | "pull" | "squat";
  name: string;
  sets: PrepSet[];
}

export interface PrepSession {
  id: string;
  number: number;
  targetRestSeconds: number;
  completed: boolean;
  completedAt?: string;
  durationSeconds?: number;
  exercises: PrepExercise[];
}

interface PrepStore {
  sessions: PrepSession[];
  activeSessionId: string | null;
  prepWidgetDismissed: boolean;
  hasAppliedPrepWeights: boolean;
  isWeightsConfirmed: boolean;
  
  // Actions
  setActiveSessionId: (id: string | null) => void;
  setPrepWidgetDismissed: (dismissed: boolean) => void;
  setHasAppliedPrepWeights: (applied: boolean) => void;
  setIsWeightsConfirmed: (confirmed: boolean) => void;
  updateSet: (sessionId: string, exerciseId: "bench" | "pull" | "squat", setIndex: number, patch: Partial<PrepSet>) => void;
  updateSessionExerciseWeights: (sessionId: string, weights: { bench: number; pull: number; squat: number }) => void;
  applyWeightsToUpcomingSessions: (fromNumber: number, weights: { bench: number; pull: number; squat: number }) => void;
  completeSession: (sessionId: string, durationSeconds: number) => void;
  resetPrepSessions: () => void;
  getAverageWeights: () => { benchWeight: number; pullWeight: number; squatWeight: number };
  getSuggestedSmtWeights: (weightStep?: number) => CalculatedSmtWeights;
  areAllSessionsCompleted: () => boolean;
}

const DEFAULT_REST_PROTOCOL = [90, 75, 60, 45, 30, 30];

function createDefaultSessions(): PrepSession[] {
  return [1, 2, 3, 4, 5, 6].map((num) => {
    const targetRestSeconds = DEFAULT_REST_PROTOCOL[num - 1] || 30;
    return {
      id: `prep-${num}`,
      number: num,
      targetRestSeconds,
      completed: false,
      exercises: [
        {
          id: "bench",
          name: "Жим штанги або гантелей лежачи",
          sets: [
            { id: "b1", weight: 50, reps: 10, completed: false },
            { id: "b2", weight: 50, reps: 10, completed: false },
            { id: "b3", weight: 50, reps: 10, completed: false },
            { id: "b4", weight: 50, reps: 10, completed: false },
          ],
        },
        {
          id: "pull",
          name: "Підтягування або тяга верхнього блоку",
          sets: [
            { id: "p1", weight: 45, reps: 10, completed: false },
            { id: "p2", weight: 45, reps: 10, completed: false },
            { id: "p3", weight: 45, reps: 10, completed: false },
            { id: "p4", weight: 45, reps: 10, completed: false },
          ],
        },
        {
          id: "squat",
          name: "Присідання або жим платформи ногами",
          sets: [
            { id: "s1", weight: 60, reps: 10, completed: false },
            { id: "s2", weight: 60, reps: 10, completed: false },
            { id: "s3", weight: 60, reps: 10, completed: false },
            { id: "s4", weight: 60, reps: 10, completed: false },
          ],
        },
      ],
    };
  });
}

export const usePrepStore = create<PrepStore>()(
  persist(
    (set, get) => ({
      sessions: createDefaultSessions(),
      activeSessionId: null,
      prepWidgetDismissed: false,
      hasAppliedPrepWeights: false,
      isWeightsConfirmed: false,

      setActiveSessionId: (id) => set({ activeSessionId: id }),
      setPrepWidgetDismissed: (dismissed) => set({ prepWidgetDismissed: dismissed }),
      setHasAppliedPrepWeights: (applied) => set({ hasAppliedPrepWeights: applied }),
      setIsWeightsConfirmed: (confirmed) => set({ isWeightsConfirmed: confirmed }),

      updateSet: (sessionId, exerciseId, setIndex, patch) => {
        set((state) => ({
          sessions: state.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            return {
              ...sess,
              exercises: sess.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                const newSets = [...ex.sets];
                if (newSets[setIndex]) {
                  newSets[setIndex] = { ...newSets[setIndex], ...patch };
                }
                return { ...ex, sets: newSets };
              }),
            };
          }),
        }));
      },

      updateSessionExerciseWeights: (sessionId, weights) => {
        set((state) => ({
          sessions: state.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            return {
              ...sess,
              exercises: sess.exercises.map((ex) => {
                const targetWeight =
                  ex.id === "bench"
                    ? weights.bench
                    : ex.id === "pull"
                    ? weights.pull
                    : weights.squat;
                return {
                  ...ex,
                  sets: ex.sets.map((s) => ({ ...s, weight: targetWeight })),
                };
              }),
            };
          }),
        }));
      },

      applyWeightsToUpcomingSessions: (fromNumber, weights) => {
        set((state) => ({
          sessions: state.sessions.map((sess) => {
            if (sess.number >= fromNumber) {
              return {
                ...sess,
                exercises: sess.exercises.map((ex) => {
                  const targetWeight =
                    ex.id === "bench"
                      ? weights.bench
                      : ex.id === "pull"
                      ? weights.pull
                      : weights.squat;
                  return {
                    ...ex,
                    sets: ex.sets.map((s) => ({ ...s, weight: targetWeight })),
                  };
                }),
              };
            }
            return sess;
          }),
        }));
      },

      completeSession: (sessionId, durationSeconds) => {
        set((state) => ({
          activeSessionId: null,
          sessions: state.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            return {
              ...sess,
              completed: true,
              completedAt: new Date().toISOString(),
              durationSeconds,
            };
          }),
        }));
      },

      resetPrepSessions: () => {
        set({
          sessions: createDefaultSessions(),
          activeSessionId: null,
          prepWidgetDismissed: false,
          hasAppliedPrepWeights: false,
          isWeightsConfirmed: false,
        });
      },

      getAverageWeights: () => {
        const { sessions } = get();
        const completedSessions = sessions.filter((s) => s.completed);
        const targetSession = completedSessions.length > 0
          ? completedSessions[completedSessions.length - 1]
          : sessions[0];

        const getExWeight = (exId: "bench" | "pull" | "squat", fallback: number) => {
          const ex = targetSession?.exercises.find((e) => e.id === exId);
          if (!ex) return fallback;
          const completedSets = ex.sets.filter((s) => s.completed);
          if (completedSets.length > 0) {
            const sum = completedSets.reduce((acc, s) => acc + (s.weight || 0), 0);
            return Math.round(sum / completedSets.length);
          }
          return ex.sets[0]?.weight || fallback;
        };

        return {
          benchWeight: getExWeight("bench", 50),
          pullWeight: getExWeight("pull", 45),
          squatWeight: getExWeight("squat", 60),
        };
      },

      getSuggestedSmtWeights: (weightStep: number = 2.5) => {
        const avg = get().getAverageWeights();
        return calculateSmtStartingWeights(avg, weightStep);
      },

      areAllSessionsCompleted: () => {
        const { sessions } = get();
        return sessions.every((s) => s.completed);
      },
    }),
    {
      name: "smt_prep_store_v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
