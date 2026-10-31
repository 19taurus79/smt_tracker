import { db } from 'sdk';
import { trainees, workoutLogs } from '../schema.js';
import { desc, eq } from 'sdk/db';

function getTierKey(score) {
  if (score >= 90) return 'titan';
  if (score >= 80) return 'power_master';
  if (score >= 70) return 'iron_pro';
  return 'active';
}

function getTierLabel(score) {
  if (score >= 90) return 'ТИТАН СИЛИ ⚡';
  if (score >= 80) return 'Майстер Потужності 💥';
  if (score >= 70) return 'Залізний Профі 🦾';
  return 'Активний Атлет 🏋️‍♂️';
}

export default async function (input, context) {
  const traineeRows = await db.select()
    .from(trainees)
    .orderBy(desc(trainees.updatedAt))
    .all();

  const allLogs = await db.select()
    .from(workoutLogs)
    .orderBy(desc(workoutLogs.createdAt))
    .all();

  // Group workout logs by traineeTelegramId
  const logsByTrainee = new Map();
  for (const log of (allLogs || [])) {
    const key = Number(log.traineeTelegramId);
    if (!logsByTrainee.has(key)) {
      logsByTrainee.set(key, []);
    }

    let parsedExercises = [];
    if (log.exercisesJson) {
      try {
        parsedExercises = typeof log.exercisesJson === 'string'
          ? JSON.parse(log.exercisesJson)
          : log.exercisesJson;
      } catch (e) {
        parsedExercises = [];
      }
    }

    const tierKey = getTierKey(log.athleticScore);
    logsByTrainee.get(key).push({
      id: `w-${log.workoutNumber}-${log.traineeTelegramId}`,
      workoutNumber: log.workoutNumber,
      microcycle: log.microcycle,
      date: new Date(log.createdAt).toISOString(),
      durationSeconds: log.durationSeconds,
      tonnageKg: log.tonnageKg,
      powerKgPerMin: log.powerKgPerMin,
      athleticScore: log.athleticScore,
      tierKey,
      tierLabel: getTierLabel(log.athleticScore),
      notes: log.notes || '',
      exercises: parsedExercises,
    });
  }

  const formattedTrainees = (traineeRows || []).map((t) => {
    const tgId = Number(t.telegramId);
    const history = logsByTrainee.get(tgId) || [];
    const latestScore = history.length > 0 ? history[0].athleticScore : (t.athleticScore || 70);
    const tierKey = getTierKey(latestScore);
    const tierLabel = getTierLabel(latestScore);
    const totalCount = Math.max(t.totalWorkouts || 0, history.length);
    const totalTonnage = history.reduce((sum, h) => sum + (h.tonnageKg || 0), 0);

    return {
      id: `trainee-${t.telegramId}`,
      name: t.firstName || 'Атлет',
      alias: t.username || undefined,
      username: (t.username || '').replace(/^@/, ''),
      telegramChatId: String(t.telegramId),
      avatarColor: 'from-blue-500 to-indigo-600',
      gender: 'male',
      age: 28,
      currentMicrocycle: t.currentMicrocycle || 1,
      currentWorkoutNumber: Math.min(36, totalCount + 1),
      totalWorkouts: totalCount,
      weightKg: t.weightKg || 76,
      weightDeltaKg: 0,
      lastWorkoutDate: history.length > 0
        ? history[0].date
        : new Date(t.updatedAt || Date.now()).toISOString(),
      athleticScore: latestScore,
      tierKey,
      tierLabel,
      status: t.status || 'active',
      transferNotified: true,
      coachNotes: `Атлет СМТ-1. Загальний тоннаж: ${totalTonnage.toLocaleString()} кг. Тренувань: ${totalCount}.`,
      workoutHistory: history,
      measurementHistory: [
        {
          id: `m-1-${t.telegramId}`,
          date: history.length > 0 ? history[0].date : new Date().toISOString(),
          weightKg: t.weightKg || 76,
          waistCm: 82,
          bicepsCm: 37,
        },
      ],
    };
  });

  return { ok: true, trainees: formattedTrainees };
}
