import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppSettings } from "@/types/body";

interface SettingsState extends AppSettings {
  setDefaultRestSeconds: (seconds: number) => void;
  setWeightIncrementKg: (step: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTheme: (theme: "telegram" | "dark" | "light") => void;
  setShowForecastInAnalytics: (show: boolean) => void;
  setKeepScreenAwake: (keep: boolean) => void;
  setCoachTelegramUsername: (username: string) => void;
  setTraineeName: (name: string) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  defaultRestSeconds: 30,
  weightIncrementKg: 2.5,
  soundEnabled: true,
  hapticsEnabled: true,
  theme: "telegram",
  showForecastInAnalytics: true,
  keepScreenAwake: true,
  coachTelegramUsername: "",
  traineeName: "",
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
      setShowForecastInAnalytics: (show) => set({ showForecastInAnalytics: show }),
      setKeepScreenAwake: (keep) => set({ keepScreenAwake: keep }),
      setCoachTelegramUsername: (username) => set({ coachTelegramUsername: username }),
      setTraineeName: (name) => set({ traineeName: name }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "smt_settings_v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
