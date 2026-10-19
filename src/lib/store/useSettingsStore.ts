import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppSettings } from "@/types/body";

interface SettingsState extends AppSettings {
  setDefaultRestSeconds: (seconds: number) => void;
  setWeightIncrementKg: (step: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTheme: (theme: "telegram" | "dark" | "light") => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  defaultRestSeconds: 30,
  weightIncrementKg: 2.5,
  soundEnabled: true,
  hapticsEnabled: true,
  theme: "telegram",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setDefaultRestSeconds: (seconds) => set({ defaultRestSeconds: seconds }),
      setWeightIncrementKg: (step) => set({ weightIncrementKg: step }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "smt_settings_v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
