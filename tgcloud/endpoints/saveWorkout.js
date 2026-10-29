import { api, db } from 'sdk';
import { trainees, workoutLogs } from 'schema';
import { eq, sql } from 'sdk/db';

const COACH_CHAT_ID = (typeof process !== 'undefined' && process.env?.COACH_CHAT_ID) || '548019148';

export default async function (input, context) {
  const userId = context?.userId || input?.telegramId;
  if (!userId) {
    throw new Error('Unauthorized: missing userId');
  }

  const now = Date.now();
  const {
    workoutNumber = 1,
    microcycle = 1,
    durationSeconds = 0,
    tonnageKg = 0,
    powerKgPerMin = 0,
    athleticScore = 70,
    exercises = [],
    notes = '',
    weightKg = 80,
    name = 'Атлет',
    username = '',
  } = input;

  // 1. Record workout log in SQLite
  await db.insert(workoutLogs).values({
    traineeTelegramId: userId,
    workoutNumber,
    microcycle,
    durationSeconds,
    tonnageKg,
    powerKgPerMin,
    athleticScore,
    exercisesJson: JSON.stringify(exercises),
    notes,
    createdAt: now,
  }).run();

  // 2. Upsert trainee profile in SQLite
  await db.insert(trainees).values({
    telegramId: userId,
    username: username.replace(/^@/, ''),
    firstName: name,
    coachId: COACH_CHAT_ID,
    currentMicrocycle: microcycle,
    currentWorkout: workoutNumber,
    totalWorkouts: 1,
    weightKg,
    athleticScore,
    status: 'active',
    updatedAt: now,
    createdAt: now,
  }).onConflictDoUpdate({
    target: trainees.telegramId,
    set: {
      currentMicrocycle: microcycle,
      currentWorkout: workoutNumber,
      totalWorkouts: sql`${trainees.totalWorkouts} + 1`,
      weightKg,
      athleticScore,
      status: 'active',
      updatedAt: now,
    },
  }).run();

  // 3. Send Telegram report directly to coach PM
  try {
    const cleanUsername = username.replace(/^@/, '');
    const athleteTag = cleanUsername ? `@${cleanUsername}` : name;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const lines = [
      `👑 <b>НОВИЙ ЗВІТ ДЛЯ ТРЕНЕРА!</b>`,
      ``,
      `👤 <b>Підопічний:</b> ${athleteTag}`,
      `📅 <b>Тренування:</b> #${workoutNumber} (МКЦ-${microcycle})`,
      `⏱ <b>Час:</b> ${timeFormatted} (паузи суворо 30с)`,
      `📦 <b>Тоннаж:</b> ${tonnageKg.toLocaleString()} кг`,
      `⚡ <b>Потужність:</b> ${powerKgPerMin} кг/хв`,
      `🏆 <b>Індекс:</b> ${athleticScore} / 100`,
    ];

    if (notes) {
      lines.push(``, `💬 <i>"${notes}"</i>`);
    }

    lines.push(``, `━━━━━━━━━━━━━━━━━━`);
    if (cleanUsername) {
      lines.push(`💬 <i>Написати:</i> https://t.me/${cleanUsername}`);
    }

    await api.sendMessage({
      chat_id: COACH_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  } catch (e) {
    console.warn('Coach notification warning:', e);
  }

  return { ok: true, savedAt: now };
}
