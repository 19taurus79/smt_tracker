import { table, integer, text, real } from 'sdk/db';

/**
 * Trainees roster table (SQLite)
 */
export const trainees = table('trainees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: integer('telegram_id').notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  coachId: text('coach_id').default('548019148'),
  currentMicrocycle: integer('current_microcycle').default(1),
  currentWorkout: integer('current_workout').default(1),
  totalWorkouts: integer('total_workouts').default(0),
  weightKg: real('weight_kg').default(80.0),
  athleticScore: integer('athletic_score').default(70),
  status: text('status').default('new_lead'),
  updatedAt: integer('updated_at'),
  createdAt: integer('created_at'),
});

/**
 * Workouts log table (SQLite)
 */
export const workoutLogs = table('workout_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  traineeTelegramId: integer('trainee_telegram_id').notNull(),
  workoutNumber: integer('workout_number').notNull(),
  microcycle: integer('microcycle').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  tonnageKg: integer('tonnage_kg').notNull(),
  powerKgPerMin: integer('power_kg_min').notNull(),
  athleticScore: integer('athletic_score').notNull(),
  exercisesJson: text('exercises_json'),
  notes: text('notes'),
  createdAt: integer('created_at'),
});
