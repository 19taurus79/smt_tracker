import { WorkoutSession } from "@/types/smt";
import { BodyMeasurement } from "@/types/body";
import { formatTime, formatDate } from "@/lib/utils";

export interface CoachReportPayload {
  workout: WorkoutSession;
  traineeName?: string;
  weightIncrement?: number;
  latestMeasurement?: BodyMeasurement;
}

export function generateWorkoutCoachMessage({
  workout,
  traineeName,
  weightIncrement = 2.5,
  latestMeasurement,
}: CoachReportPayload): string {
  const dateStr = workout.completedAt
    ? formatDate(workout.completedAt)
    : new Date().toLocaleDateString("ru-RU");

  const durationStr = formatTime(workout.durationSeconds || 0);
  const tonnageStr = workout.tonnageKg ? `${workout.tonnageKg.toLocaleString("ru-RU")} кг` : "—";
  const powerStr = workout.powerKgPerMin ? `${workout.powerKgPerMin} кг/мин` : "—";

  const lines: string[] = [
    "🔥 *СМТ-1: ОТЧЕТ О ТРЕНИРОВКЕ*",
    traineeName ? `👤 *Атлет:* ${traineeName}` : "",
    `📅 *Дата:* ${dateStr}`,
    `🏋️ *Тренировка:* #${workout.workoutNumber} (МКЦ-${workout.microcycle}, Неделя ${workout.week})`,
    `⏱ *Время:* ${durationStr}`,
    `⚡ *Тоннаж:* ${tonnageStr} | *Мощность:* ${powerStr}`,
    "",
    "📋 *Выполненные веса:*",
  ];

  for (const ss of workout.supersets) {
    if (ss.exercises.length === 1) {
      const ex = ss.exercises[0];
      const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
      const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
      const setsCount = ex.sets.filter((s) => s.completed).length || ex.sets.length;
      lines.push(`• *${ex.name}:* ${weight} кг × ${reps} (${setsCount} подх)`);
    } else {
      lines.push(`• *${ss.label}:*`);
      for (const ex of ss.exercises) {
        const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
        const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
        lines.push(`   └ ${ex.name}: ${weight} кг × ${reps}`);
      }
    }
  }

  if (weightIncrement > 0) {
    lines.push("");
    lines.push(`📈 *Авто-прибавка на следующий цикл:* +${weightIncrement} кг`);
  }

  if (latestMeasurement) {
    lines.push("");
    lines.push("📏 *Текущие замеры атлета:*");
    lines.push(`• Вес тела: ${latestMeasurement.weightKg} кг`);
    if (latestMeasurement.waistCm) lines.push(`• Талия: ${latestMeasurement.waistCm} см`);
    if (latestMeasurement.bicepsCm) lines.push(`• Бицепс: ${latestMeasurement.bicepsCm} см`);
  }

  if (workout.notes) {
    lines.push("");
    lines.push(`💬 *Комментарий:* ${workout.notes}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function generateMeasurementCoachMessage(
  measurement: BodyMeasurement,
  previous?: BodyMeasurement,
  traineeName?: string
): string {
  const dateStr = formatDate(measurement.date);
  const lines: string[] = [
    "📏 *СМТ-1: ОТЧЕТ О ЗАМЕРАХ ТЕЛА*",
    traineeName ? `👤 *Атлет:* ${traineeName}` : "",
    `📅 *Дата:* ${dateStr}`,
    "",
  ];

  const weightDelta =
    previous && previous.weightKg
      ? Math.round((measurement.weightKg - previous.weightKg) * 10) / 10
      : null;
  const weightDeltaStr =
    weightDelta !== null ? (weightDelta > 0 ? ` (+${weightDelta} кг)` : ` (${weightDelta} кг)`) : "";
  lines.push(`⚖️ *Вес тела:* ${measurement.weightKg} кг${weightDeltaStr}`);

  if (measurement.waistCm) {
    const waistDelta =
      previous && previous.waistCm
        ? Math.round((measurement.waistCm - previous.waistCm) * 10) / 10
        : null;
    const waistDeltaStr =
      waistDelta !== null ? (waistDelta > 0 ? ` (+${waistDelta} см)` : ` (${waistDelta} см)`) : "";
    lines.push(`🎯 *Талия:* ${measurement.waistCm} см${waistDeltaStr}`);
  }

  if (measurement.chestCm) {
    lines.push(`💪 *Грудь:* ${measurement.chestCm} см`);
  }

  if (measurement.bicepsCm) {
    lines.push(`💪 *Бицепс:* ${measurement.bicepsCm} см`);
  }

  if (measurement.thighCm) {
    lines.push(`🦵 *Бедро:* ${measurement.thighCm} см`);
  }

  if (measurement.notes) {
    lines.push("");
    lines.push(`💬 *Заметка:* ${measurement.notes}`);
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

  let targetUrl: string;
  if (coachTelegramUsername && coachTelegramUsername.trim().length > 0) {
    const cleanUsername = coachTelegramUsername.trim().replace(/^@/, "");
    targetUrl = `https://t.me/${cleanUsername}?text=${encodedText}`;
  } else {
    // Open Telegram contact/share picker
    targetUrl = `https://t.me/share/url?url=&text=${encodedText}`;
  }

  window.open(targetUrl, "_blank");
}
