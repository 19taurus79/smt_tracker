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

export type AppLanguage = "uk" | "en" | "ru";

export type UserRole = "coach" | "trainee" | "guest";

export interface LinkedTelegramAccount {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate: number;
  isCoach?: boolean;
}

export interface AppSettings {
  language: AppLanguage;      // default: "uk"
  defaultRestSeconds: number; // e.g. 30
  weightIncrementKg: number;  // e.g. 2.5
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: "telegram" | "dark" | "light";
  showForecastInAnalytics?: boolean; // toggle forecast on charts
  keepScreenAwake?: boolean; // держать экран включенным во время тренировки
  coachTelegramUsername?: string; // ник тренера в Telegram (@coach_alex)
  traineeName?: string; // имя подопечного для отчетов тренеру
  gender?: "male" | "female"; // для точного индекса атлетичности
  userAge?: number;
  storyBotUsername?: string; // ник бота/канала для виральной плашки в Stories
  linkedTelegramUser?: LinkedTelegramAccount | null;
  userRole?: UserRole;
}

