import { WorkoutSession } from "@/types/smt";
import { BodyMeasurement, AppLanguage } from "@/types/body";
import { formatTime, formatDate } from "@/lib/utils";
import { getLocalizedExerciseName, formatWorkoutTitle } from "@/lib/i18n/exercises";
import { calculateAthleticScore } from "@/lib/scoring/athleticScore";

export interface CoachReportPayload {
  workout: WorkoutSession;
  traineeName?: string;
  weightIncrement?: number;
  latestMeasurement?: BodyMeasurement;
  language?: AppLanguage;
  gender?: "male" | "female";
  userAge?: number;
}

export function generateWorkoutCoachMessage({
  workout,
  traineeName,
  weightIncrement = 2.5,
  latestMeasurement,
  language = "uk",
  gender,
  userAge,
}: CoachReportPayload): string {
  const localeStr = language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";
  const dateStr = workout.completedAt
    ? new Date(workout.completedAt).toLocaleDateString(localeStr, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString(localeStr);

  const durationStr = formatTime(workout.durationSeconds || 0);
  const kgUnit = language === "en" ? "kg" : "кг";
  const minUnit = language === "en" ? "min" : "хв";
  const cmUnit = language === "en" ? "cm" : "см";
  const setsUnit = language === "en" ? "sets" : language === "ru" ? "подх" : "підх";

  const tonnageStr = workout.tonnageKg ? `${workout.tonnageKg.toLocaleString(localeStr)} ${kgUnit}` : "—";
  const powerStr = workout.powerKgPerMin ? `${workout.powerKgPerMin} ${kgUnit}/${minUnit}` : "—";
  const workoutTitleStr = formatWorkoutTitle(workout.workoutNumber, workout.microcycle, workout.week, language);

  const headerTitle =
    language === "en"
      ? "🔥 *SMT: WORKOUT REPORT*"
      : language === "ru"
      ? "🔥 *СМТ: ОТЧЕТ О ТРЕНИРОВКЕ*"
      : "🔥 *СМТ: ЗВІТ ПРО ТРЕНУВАННЯ*";

  const athleteLabel = language === "en" ? "👤 *Athlete:*" : language === "ru" ? "👤 *Атлет:*" : "👤 *Атлет:*";
  const dateLabel = language === "en" ? "📅 *Date:*" : language === "ru" ? "📅 *Дата:*" : "📅 *Дата:*";
  const sessionLabel = language === "en" ? "🏋️ *Session:*" : language === "ru" ? "🏋️ *Тренировка:*" : "🏋️ *Тренування:*";
  const timeLabel = language === "en" ? "⏱ *Duration:*" : language === "ru" ? "⏱ *Время:*" : "⏱ *Час:*";
  const tonnageLabel = language === "en" ? "⚡ *Tonnage:*" : language === "ru" ? "⚡ *Тоннаж:*" : "⚡ *Тоннаж:*";
  const powerLabel = language === "en" ? "*Power:*" : language === "ru" ? "*Мощность:*" : "*Потужність:*";
  const weightsLabel =
    language === "en"
      ? "📋 *Executed Weights:*"
      : language === "ru"
      ? "📋 *Выполненные веса:*"
      : "📋 *Виконані ваги:*";

  const scoreResult = calculateAthleticScore({
    tonnageKg: workout.tonnageKg || 0,
    durationSeconds: workout.durationSeconds || 45 * 60,
    bodyWeightKg: latestMeasurement?.weightKg || 80,
    gender: gender || "male",
    age: userAge || 28,
    workout,
  });

  const tierName =
    language === "en"
      ? (scoreResult.tierKey === "titan" ? "ELITE TITAN" : scoreResult.tierKey === "iron_pro" ? "Iron Pro" : scoreResult.tierKey === "power_master" ? "Power Master" : "Active Athlete")
      : language === "ru"
      ? (scoreResult.tierKey === "titan" ? "ТИТАН СИЛЫ" : scoreResult.tierKey === "iron_pro" ? "Железный Профи" : scoreResult.tierKey === "power_master" ? "Мастер Мощности" : "Активный Атлет")
      : (scoreResult.tierKey === "titan" ? "ТИТАН СИЛИ" : scoreResult.tierKey === "iron_pro" ? "Залізний Профі" : scoreResult.tierKey === "power_master" ? "Майстер Потужності" : "Активний Атлет");

  const scoreLabel = language === "en" ? "🏆 *Athletic Score:*" : language === "ru" ? "🏆 *Индекс Атлетичности:*" : "🏆 *Індекс Атлетичності:*";

  const lines: string[] = [
    headerTitle,
    traineeName ? `${athleteLabel} ${traineeName}` : "",
    `${dateLabel} ${dateStr}`,
    `${sessionLabel} ${workoutTitleStr}`,
    `${scoreLabel} ${scoreResult.score}/100 (${tierName})`,
    `${timeLabel} ${durationStr}`,
    `${tonnageLabel} ${tonnageStr} | ${powerLabel} ${powerStr}`,
    "",
    weightsLabel,
  ];

  for (const ss of workout.supersets) {
    if (ss.exercises.length === 1) {
      const ex = ss.exercises[0];
      const exName = getLocalizedExerciseName(ex.exerciseId || ex.name, language, false);
      const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
      const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
      const setsCount = ex.sets.filter((s) => s.completed).length || ex.sets.length;
      lines.push(`• *${exName}:* ${weight} ${kgUnit} × ${reps} (${setsCount} ${setsUnit})`);
    } else {
      const ssNum = ss.label.replace(/[^0-9]/g, "");
      const ssLabel = language === "en" ? `Superset ${ssNum}` : ss.label;
      lines.push(`• *${ssLabel}:*`);
      for (const ex of ss.exercises) {
        const exName = getLocalizedExerciseName(ex.exerciseId || ex.name, language, false);
        const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
        const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
        lines.push(`   └ ${exName}: ${weight} ${kgUnit} × ${reps}`);
      }
    }
  }

  if (weightIncrement > 0) {
    const incLabel =
      language === "en"
        ? `📈 *Auto-increment next cycle:* +${weightIncrement} ${kgUnit}`
        : language === "ru"
        ? `📈 *Авто-прибавка на следующий цикл:* +${weightIncrement} ${kgUnit}`
        : `📈 *Авто-прибавка на наступний цикл:* +${weightIncrement} ${kgUnit}`;
    lines.push("");
    lines.push(incLabel);
  }

  if (latestMeasurement) {
    const bodyHeader =
      language === "en"
        ? "📏 *Athlete Current Measurements:*"
        : language === "ru"
        ? "📏 *Текущие замеры атлета:*"
        : "📏 *Поточні заміри атлета:*";
    const weightLabel = language === "en" ? "• Body Weight:" : language === "ru" ? "• Вес тела:" : "• Вага тіла:";
    const waistLabel = language === "en" ? "• Waist:" : language === "ru" ? "• Талия:" : "• Талія:";
    const bicepsLabel = language === "en" ? "• Biceps:" : language === "ru" ? "• Бицепс:" : "• Біцепс:";

    lines.push("");
    lines.push(bodyHeader);
    lines.push(`${weightLabel} ${latestMeasurement.weightKg} ${kgUnit}`);
    if (latestMeasurement.waistCm) lines.push(`${waistLabel} ${latestMeasurement.waistCm} ${cmUnit}`);
    if (latestMeasurement.bicepsCm) lines.push(`${bicepsLabel} ${latestMeasurement.bicepsCm} ${cmUnit}`);
  }

  if (workout.notes) {
    const commentLabel = language === "en" ? "💬 *Notes:*" : language === "ru" ? "💬 *Комментарий:*" : "💬 *Коментар:*";
    lines.push("");
    lines.push(`${commentLabel} ${workout.notes}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function generateMeasurementCoachMessage(
  measurement: BodyMeasurement,
  previous?: BodyMeasurement,
  traineeName?: string,
  language: AppLanguage = "uk"
): string {
  const localeStr = language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";
  const dateStr = formatDate(measurement.date);
  const kgUnit = language === "en" ? "kg" : "кг";
  const cmUnit = language === "en" ? "cm" : "см";

  const headerTitle =
    language === "en"
      ? "📏 *SMT: BODY MEASUREMENTS REPORT*"
      : language === "ru"
      ? "📏 *СМТ: ОТЧЕТ О ЗАМЕРАХ ТЕЛА*"
      : "📏 *СМТ: ЗВІТ ПРО ЗАМІРИ ТІЛА*";

  const athleteLabel = language === "en" ? "👤 *Athlete:*" : language === "ru" ? "👤 *Атлет:*" : "👤 *Атлет:*";
  const dateLabel = language === "en" ? "📅 *Date:*" : language === "ru" ? "📅 *Дата:*" : "📅 *Дата:*";
  const weightLabel = language === "en" ? "⚖️ *Body Weight:*" : language === "ru" ? "⚖️ *Вес тела:*" : "⚖️ *Вага тіла:*";
  const waistLabel = language === "en" ? "🎯 *Waist:*" : language === "ru" ? "🎯 *Талия:*" : "🎯 *Талія:*";
  const chestLabel = language === "en" ? "💪 *Chest:*" : language === "ru" ? "💪 *Грудь:*" : "💪 *Груди:*";
  const bicepsLabel = language === "en" ? "💪 *Biceps:*" : language === "ru" ? "💪 *Бицепс:*" : "💪 *Біцепс:*";
  const thighLabel = language === "en" ? "🦵 *Thigh:*" : language === "ru" ? "🦵 *Бедро:*" : "🦵 *Стегно:*";
  const noteLabel = language === "en" ? "💬 *Notes:*" : language === "ru" ? "💬 *Заметка:*" : "💬 *Нотатка:*";

  const lines: string[] = [
    headerTitle,
    traineeName ? `${athleteLabel} ${traineeName}` : "",
    `${dateLabel} ${dateStr}`,
    "",
  ];

  const weightDelta =
    previous && previous.weightKg
      ? Math.round((measurement.weightKg - previous.weightKg) * 10) / 10
      : null;
  const weightDeltaStr =
    weightDelta !== null ? (weightDelta > 0 ? ` (+${weightDelta} ${kgUnit})` : ` (${weightDelta} ${kgUnit})`) : "";
  lines.push(`${weightLabel} ${measurement.weightKg} ${kgUnit}${weightDeltaStr}`);

  if (measurement.waistCm) {
    const waistDelta =
      previous && previous.waistCm
        ? Math.round((measurement.waistCm - previous.waistCm) * 10) / 10
        : null;
    const waistDeltaStr =
      waistDelta !== null ? (waistDelta > 0 ? ` (+${waistDelta} ${cmUnit})` : ` (${waistDelta} ${cmUnit})`) : "";
    lines.push(`${waistLabel} ${measurement.waistCm} ${cmUnit}${waistDeltaStr}`);
  }

  if (measurement.chestCm) {
    lines.push(`${chestLabel} ${measurement.chestCm} ${cmUnit}`);
  }

  if (measurement.bicepsCm) {
    lines.push(`${bicepsLabel} ${measurement.bicepsCm} ${cmUnit}`);
  }

  if (measurement.thighCm) {
    lines.push(`${thighLabel} ${measurement.thighCm} ${cmUnit}`);
  }

  if (measurement.notes) {
    lines.push("");
    lines.push(`${noteLabel} ${measurement.notes}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function shareToTelegramCoach(text: string, coachTelegramUsername?: string): void {
  if (typeof window === "undefined") return;

  // Copy to clipboard first as a guaranteed backup
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const encodedText = encodeURIComponent(text);
  const cleanUsername = coachTelegramUsername?.trim().replace(/^@/, "");

  const targetUrl = cleanUsername
    ? `https://t.me/${cleanUsername}?text=${encodedText}`
    : `https://t.me/share/url?url=&text=${encodedText}`;

  // 1. Inside Telegram Mini App: use native openTelegramLink
  const tgWebApp = window.Telegram?.WebApp as any;
  if (tgWebApp?.openTelegramLink) {
    tgWebApp.openTelegramLink(targetUrl);
    return;
  }

  // 2. On Mobile (iOS / Android): try deep link into Telegram app directly
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const deepLink = cleanUsername
      ? `tg://resolve?domain=${cleanUsername}&text=${encodedText}`
      : `tg://msg_url?url=&text=${encodedText}`;

    window.location.href = deepLink;
    setTimeout(() => {
      window.open(targetUrl, "_blank");
    }, 1500);
    return;
  }

  // 3. Desktop browser: open official Telegram gateway
  window.open(targetUrl, "_blank");
}

export async function sendDirectCoachReport(payload: {
  traineeName?: string;
  traineeUsername?: string;
  telegramUserId?: string | number;
  workoutNumber: number;
  microcycle: number;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore?: {
    score: number;
    tierKey?: string;
    tierLabel?: string;
  };
  latestMeasurement?: any;
  exercises?: any[];
  notes?: string;
}): Promise<boolean> {
  const { syncWorkout } = await import("@/lib/tma/sync");
  return syncWorkout({
    ...payload,
    name: payload.traineeName,
    username: payload.traineeUsername,
    telegramId: payload.telegramUserId ? Number(payload.telegramUserId) : undefined,
  });
}
