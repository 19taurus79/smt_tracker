import { db } from 'sdk';
import { trainees, workoutLogs } from '../schema.js';
import { eq } from 'sdk/db';

export default async function (input, context) {
  const telegramId = 487406242;
  const username = 'serebankhic';
  const firstName = 'Андрей';
  const coachId = '548019148';

  // 1. Clean existing logs for this trainee to prevent duplicates
  await db.delete(workoutLogs).where(eq(workoutLogs.traineeTelegramId, telegramId)).run();

  const workouts = [
    {
      traineeTelegramId: telegramId,
      workoutNumber: 1,
      microcycle: 1,
      durationSeconds: 2600,
      tonnageKg: 8200,
      powerKgPerMin: 189,
      athleticScore: 75,
      createdAt: new Date('2026-10-19T12:00:00.000Z').getTime(),
      notes: 'Стартове тренування #1 циклу СМТ-1 (перенесено)',
      exercisesJson: JSON.stringify([
        { name: 'Жим штанги лежачи', weight: 45, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 35, reps: 10, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 35, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 15, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 45, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 15, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ]),
    },
    {
      traineeTelegramId: telegramId,
      workoutNumber: 2,
      microcycle: 1,
      durationSeconds: 2520,
      tonnageKg: 8600,
      powerKgPerMin: 204,
      athleticScore: 78,
      createdAt: new Date('2026-10-21T12:00:00.000Z').getTime(),
      notes: 'Тренування #2 виконано в PWA (перенесено)',
      exercisesJson: JSON.stringify([
        { name: 'Жим штанги лежачи', weight: 47.5, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 37.5, reps: 10, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 37.5, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 15, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 47.5, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 15, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ]),
    },
    {
      traineeTelegramId: telegramId,
      workoutNumber: 3,
      microcycle: 1,
      durationSeconds: 2400,
      tonnageKg: 9050,
      powerKgPerMin: 226,
      athleticScore: 80,
      createdAt: new Date('2026-10-23T12:00:00.000Z').getTime(),
      notes: 'Тренування #3 виконано в Telegram Mini App, перенесено без втрати даних.',
      exercisesJson: JSON.stringify([
        { name: 'Жим штанги лежачи', weight: 50, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 40, reps: 10, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 40, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 17.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 50, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 17.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ]),
    },
    {
      traineeTelegramId: telegramId,
      workoutNumber: 4,
      microcycle: 1,
      durationSeconds: 2340,
      tonnageKg: 9500,
      powerKgPerMin: 243,
      athleticScore: 82,
      createdAt: new Date('2026-10-25T12:00:00.000Z').getTime(),
      notes: 'Тренування #4 циклу СМТ-1. Прогресія +2.5 кг зафіксована у всіх блоках.',
      exercisesJson: JSON.stringify([
        { name: 'Жим штанги лежачи', weight: 52.5, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 42.5, reps: 10, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 42.5, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 20, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 52.5, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 20, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ]),
    },
    {
      traineeTelegramId: telegramId,
      workoutNumber: 5,
      microcycle: 1,
      durationSeconds: 2280,
      tonnageKg: 9950,
      powerKgPerMin: 261,
      athleticScore: 84,
      createdAt: new Date('2026-10-28T12:00:00.000Z').getTime(),
      notes: 'Тренування #5 циклу СМТ-1. Відмінна швидкість виконання та стабільні паузи 30с.',
      exercisesJson: JSON.stringify([
        { name: 'Жим штанги лежачи', weight: 55, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 45, reps: 10, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 45, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 22.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 55, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 22.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ]),
    },
    {
      traineeTelegramId: telegramId,
      workoutNumber: 6,
      microcycle: 1,
      durationSeconds: 1726,
      tonnageKg: 9230,
      powerKgPerMin: 321,
      athleticScore: 69,
      createdAt: new Date('2026-10-31T12:46:00.000Z').getTime(),
      notes: 'Втома: 2/5 (Норм, RPE 7) • Розгиб ног 35х15',
      exercisesJson: JSON.stringify([
        { name: 'Жим штанги лежачи', weight: 37.5, reps: 10, setsCount: 4, supersetLabel: 'Блок 1' },
        { name: 'Жим лежачи вузьким хватом', weight: 22.5, reps: 15, setsCount: 4, supersetLabel: 'Блок 2' },
        { name: 'Підтягування (або тяга)', weight: 40, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Штанга на біцепс', weight: 15.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 1' },
        { name: 'Присідання зі штангою', weight: 70, reps: 10, setsCount: 4, supersetLabel: 'Суперсет 2' },
        { name: 'Армійський жим (стоячи)', weight: 17.5, reps: 15, setsCount: 4, supersetLabel: 'Суперсет 2' },
      ]),
    },
  ];

  for (const w of workouts) {
    await db.insert(workoutLogs).values(w).run();
  }

  // 2. Upsert Trainee Profile
  const now = Date.now();
  await db.insert(trainees).values({
    telegramId,
    username,
    firstName,
    coachId,
    currentMicrocycle: 1,
    currentWorkout: 7,
    totalWorkouts: 6,
    weightKg: 76.0,
    athleticScore: 69,
    status: 'active',
    updatedAt: now,
    createdAt: new Date('2026-10-19T12:00:00.000Z').getTime(),
  }).onConflictDoUpdate({
    target: trainees.telegramId,
    set: {
      username,
      firstName,
      coachId,
      currentMicrocycle: 1,
      currentWorkout: 7,
      totalWorkouts: 6,
      weightKg: 76.0,
      athleticScore: 69,
      status: 'active',
      updatedAt: now,
    },
  }).run();

  return { ok: true, seededWorkouts: workouts.length, athlete: username };
}

