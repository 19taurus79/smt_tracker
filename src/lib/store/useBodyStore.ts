import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BodyMeasurement } from "@/types/body";

export const initialDemoMeasurements: BodyMeasurement[] = [
  {
    id: "m-1",
    date: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString().split("T")[0],
    weightKg: 82.5,
    chestCm: 104,
    waistCm: 86,
    hipsCm: 99,
    bicepsCm: 37.5,
    thighCm: 59,
    notes: "Старт программы СМТ-1",
  },
  {
    id: "m-2",
    date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split("T")[0],
    weightKg: 81.8,
    chestCm: 104.5,
    waistCm: 84.5,
    hipsCm: 98.5,
    bicepsCm: 38.0,
    thighCm: 59.5,
    notes: "Конец МКЦ-1. Талия уменьшилась на 1.5 см, бицепс подрос.",
  },
  {
    id: "m-3",
    date: new Date().toISOString().split("T")[0],
    weightKg: 81.2,
    chestCm: 105.0,
    waistCm: 83.0,
    hipsCm: 98.0,
    bicepsCm: 38.5,
    thighCm: 60.0,
    notes: "Середина МКЦ-2. Рельеф улучшается, силовые растут.",
  },
];

interface BodyState {
  measurements: BodyMeasurement[];
  addMeasurement: (measurement: Omit<BodyMeasurement, "id">) => void;
  updateMeasurement: (id: string, measurement: Partial<BodyMeasurement>) => void;
  deleteMeasurement: (id: string) => void;
  setMeasurements: (measurements: BodyMeasurement[]) => void;
  clearMeasurements: () => void;
  loadDemoMeasurements: () => void;
}

export const useBodyStore = create<BodyState>()(
  persist(
    (set) => ({
      measurements: [],
      addMeasurement: (measurement) =>
        set((state) => ({
          measurements: [
            {
              ...measurement,
              id: `m-${Date.now()}`,
            },
            ...state.measurements,
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        })),
      updateMeasurement: (id, updated) =>
        set((state) => ({
          measurements: state.measurements.map((m) =>
            m.id === id ? { ...m, ...updated } : m
          ),
        })),
      deleteMeasurement: (id) =>
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== id),
        })),
      setMeasurements: (measurements) => set({ measurements }),
      clearMeasurements: () => set({ measurements: [] }),
      loadDemoMeasurements: () => set({ measurements: initialDemoMeasurements }),
    }),
    {
      name: "smt_body_v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
