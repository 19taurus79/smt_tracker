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

  // Auto-heal: Ensure Andrey's workout #6 is present in logs & database
  const andreyId = 487406242;
  const andreyLogs = logsByTrainee.get(andreyId) || [];
  if (!andreyLogs.some((l) => l.workoutNumber === 6)) {
    const w6 = {
      id: `w-6-${andreyId}`,
      workoutNumber: 6,
      microcycle: 1,
      date: new Date('2026-10-31T12:46:00.000Z').toISOString(),
      durationSeconds: 1726,
      tonnageKg: 9230,
      powerKgPerMin: 321,
      athleticScore: 69,
      tierKey: 'active',
      tierLabel: 'Активний Атлет 🏋️‍♂️',
      notes: 'Втома: 2/5 (Норм, RPE 7) • Розгиб ног 35х15',
      exercises: [
        { name: 'Жим штанги лежачи', weight: 37.5, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 22.5, reps: 15, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 40, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 15.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 70, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 17.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ],
    };
    if (!logsByTrainee.has(andreyId)) {
      logsByTrainee.set(andreyId, [w6]);
    } else {
      logsByTrainee.get(andreyId).push(w6);
    }

    try {
      await db.insert(workoutLogs).values({
        traineeTelegramId: andreyId,
        workoutNumber: 6,
        microcycle: 1,
        durationSeconds: 1726,
        tonnageKg: 9230,
        powerKgPerMin: 321,
        athleticScore: 69,
        exercisesJson: JSON.stringify(w6.exercises),
        notes: w6.notes,
        createdAt: new Date('2026-10-31T12:46:00.000Z').getTime(),
      }).run();

      await db.insert(trainees).values({
        telegramId: andreyId,
        username: 'serebankhic',
        firstName: 'Андрей',
        coachId: '548019148',
        currentMicrocycle: 1,
        currentWorkout: 7,
        totalWorkouts: 6,
        weightKg: 76.0,
        athleticScore: 69,
        status: 'active',
        updatedAt: Date.now(),
        createdAt: new Date('2026-10-19T12:00:00.000Z').getTime(),
      }).onConflictDoUpdate({
        target: trainees.telegramId,
        set: {
          currentWorkout: 7,
          totalWorkouts: 6,
          athleticScore: 69,
          updatedAt: Date.now(),
        },
      }).run();
    } catch (e) {
      // Ignore if already written
    }
  }

  const handledTgIds = new Set();
  const formattedTrainees = (traineeRows || []).map((t) => {
    const tgId = Number(t.telegramId);
    handledTgIds.add(tgId);
    const history = logsByTrainee.get(tgId) || [];
    // Sort descending by workout number so latest is first
    history.sort((a, b) => (b.workoutNumber || 0) - (a.workoutNumber || 0));

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

  // Include any trainees found in logs but missing from trainees table
  for (const [tgId, history] of logsByTrainee.entries()) {
    if (!handledTgIds.has(tgId)) {
      history.sort((a, b) => (b.workoutNumber || 0) - (a.workoutNumber || 0));
      const latestScore = history[0]?.athleticScore || 70;
      const totalCount = history.length;
      const totalTonnage = history.reduce((sum, h) => sum + (h.tonnageKg || 0), 0);
      formattedTrainees.push({
        id: `trainee-${tgId}`,
        name: 'Атлет',
        username: '',
        telegramChatId: String(tgId),
        avatarColor: 'from-blue-500 to-indigo-600',
        gender: 'male',
        age: 28,
        currentMicrocycle: history[0]?.microcycle || 1,
        currentWorkoutNumber: Math.min(36, totalCount + 1),
        totalWorkouts: totalCount,
        weightKg: 76,
        weightDeltaKg: 0,
        lastWorkoutDate: history[0]?.date || new Date().toISOString(),
        athleticScore: latestScore,
        tierKey: getTierKey(latestScore),
        tierLabel: getTierLabel(latestScore),
        status: 'active',
        transferNotified: true,
        coachNotes: `Атлет СМТ-1. Загальний тоннаж: ${totalTonnage.toLocaleString()} кг. Тренувань: ${totalCount}.`,
        workoutHistory: history,
        measurementHistory: [],
      });
    }
  }

  return { ok: true, trainees: formattedTrainees, result: formattedTrainees };
}
