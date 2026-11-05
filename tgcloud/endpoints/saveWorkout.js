import { api, db } from 'sdk';
import { trainees, workoutLogs } from '../schema.js';
import { eq } from 'sdk/db';

const COACH_CHAT_ID = (typeof process !== 'undefined' && process.env?.COACH_CHAT_ID) || '548019148';

export default async function (input, context) {
  // 1. Resolve Telegram User ID from context or input
  const rawUserId = context?.initData?.user?.id || context?.userId || input?.telegramUserId || input?.telegramId || input?.userId;
  if (!rawUserId) {
    throw new Error('Unauthorized: missing userId');
  }
  const userId = Number(rawUserId);

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
    name = '',
    username = '',
  } = input || {};

  const cleanTonnage = Math.round(Number(tonnageKg) || 0);
  const cleanPower = Math.round(Number(powerKgPerMin) || 0);
  const cleanScore = Math.round(Number(athleticScore) || 70);

  // 2. Fetch existing trainee to prevent wiping real profile info
  const existingTrainee = await db.select().from(trainees).where(eq(trainees.telegramId, userId)).get();

  const effectiveName = (name && name !== 'Атлет')
    ? name
    : (existingTrainee?.firstName || context?.initData?.user?.first_name || name || 'Атлет');

  const rawUsername = username || context?.initData?.user?.username || existingTrainee?.username || '';
  const effectiveUsername = rawUsername.replace(/^@/, '');

  // 3. Record workout log in SQLite table `workout_logs`
  const exercisesJsonStr = typeof exercises === 'string' ? exercises : JSON.stringify(exercises || []);
  await db.insert(workoutLogs).values({
    traineeTelegramId: userId,
    workoutNumber: Number(workoutNumber),
    microcycle: Number(microcycle),
    durationSeconds: Number(durationSeconds),
    tonnageKg: cleanTonnage,
    powerKgPerMin: cleanPower,
    athleticScore: cleanScore,
    exercisesJson: exercisesJsonStr,
    notes: String(notes || ''),
    createdAt: now,
  }).run();

  // 4. Count total recorded workouts for this trainee
  const allLogs = await db.select().from(workoutLogs).where(eq(workoutLogs.traineeTelegramId, userId)).all();
  const totalCount = allLogs?.length || 1;
  const nextWorkoutNumber = Math.min(36, Math.max(Number(workoutNumber) + 1, totalCount + 1));

  // 5. Upsert trainee profile in SQLite table `trainees`
  await db.insert(trainees).values({
    telegramId: userId,
    username: effectiveUsername,
    firstName: effectiveName,
    coachId: COACH_CHAT_ID,
    currentMicrocycle: Number(microcycle),
    currentWorkout: nextWorkoutNumber,
    totalWorkouts: totalCount,
    weightKg: Number(weightKg) || existingTrainee?.weightKg || 80,
    athleticScore: cleanScore,
    status: 'active',
    updatedAt: now,
    createdAt: existingTrainee?.createdAt || now,
  }).onConflictDoUpdate({
    target: trainees.telegramId,
    set: {
      username: effectiveUsername,
      firstName: effectiveName,
      currentMicrocycle: Number(microcycle),
      currentWorkout: nextWorkoutNumber,
      totalWorkouts: totalCount,
      weightKg: Number(weightKg) || existingTrainee?.weightKg || 80,
      athleticScore: cleanScore,
      status: 'active',
      updatedAt: now,
    },
  }).run();

  // 6. Send instant Telegram report to Coach PM via Bot API
  try {
    const athleteTag = effectiveUsername ? `@${effectiveUsername}` : effectiveName;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const lines = [
      `👑 <b>НОВИЙ ЗВІТ ДЛЯ ТРЕНЕРА!</b>`,
      ``,
      `👤 <b>Підопічний:</b> ${athleteTag}`,
      `📅 <b>Тренування:</b> #${workoutNumber} (МКЦ-${microcycle})`,
      `⏱ <b>Час:</b> ${timeFormatted} (паузи суворо 30с)`,
      `📦 <b>Тоннаж:</b> ${cleanTonnage.toLocaleString()} кг`,
      `⚡ <b>Потужність:</b> ${cleanPower} кг/хв`,
      `🏆 <b>Індекс:</b> ${cleanScore} / 100`,
    ];

    let parsedExercisesList = [];
    try {
      parsedExercisesList = Array.isArray(exercises) ? exercises : JSON.parse(exercisesJsonStr);
    } catch {}

    if (parsedExercisesList.length > 0) {
      lines.push(``, `📋 <b>Виконані ваги:</b>`);
      for (const ex of parsedExercisesList) {
        lines.push(`• <b>${ex.name}:</b> ${ex.weight} кг × ${ex.reps} (${ex.setsCount || 4} підх)`);
      }
    }

    if (notes) {
      lines.push(``, `💬 <i>"${notes}"</i>`);
    }

    lines.push(``, `━━━━━━━━━━━━━━━━━━`);
    if (effectiveUsername) {
      lines.push(`💬 <i>Написати:</i> https://t.me/${effectiveUsername}`);
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

  return { ok: true, savedAt: now, totalWorkouts: totalCount };
}
