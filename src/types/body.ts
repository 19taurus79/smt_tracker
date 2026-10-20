export interface BodyMeasurement {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  weightKg: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighCm?: number;
  notes?: string;
}

export interface AppSettings {
  defaultRestSeconds: number; // e.g. 30
  weightIncrementKg: number;  // e.g. 2.5
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: "telegram" | "dark" | "light";
  showForecastInAnalytics?: boolean; // toggle forecast on charts
}
