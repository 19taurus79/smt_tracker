import { table, integer, text, real, json, index, sql } from "sdk/db";

export const trainees = table("trainees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tgId: integer("tg_id").unique().notNull(),
  username: text("username"),
  name: text("name").notNull(),
  gender: text("gender").default("male"),
  age: integer("age").default(28),
  currentMicrocycle: integer("current_microcycle").default(1),
  currentWorkoutNumber: integer("current_workout_number").default(1),
  totalWorkouts: integer("total_workouts").default(0),
  weightKg: real("weight_kg").default(80.0),
  athleticScore: integer("athletic_score").default(70),
  tierKey: text("tier_key").default("lead"),
  tierLabel: text("tier_label").default("НОВИЙ ЛІД 🔥"),
  status: text("status").default("new_lead"),
  coachNotes: text("coach_notes").default(""),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
}, (t) => ({
  tgIdIdx: index("idx_trainees_tg_id").on(t.tgId),
  statusIdx: index("idx_trainees_status").on(t.status),
}));

export const workoutReports = table("workout_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  traineeTgId: integer("trainee_tg_id").notNull(),
  workoutNumber: integer("workout_number").notNull(),
  microcycle: integer("microcycle").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  tonnageKg: real("tonnage_kg").notNull(),
  powerKgPerMin: real("power_kg_per_min").notNull(),
  athleticScore: integer("athletic_score").notNull(),
  tierLabel: text("tier_label"),
  notes: text("notes"),
  exercises: json("exercises"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
}, (t) => ({
  traineeReportsIdx: index("idx_reports_trainee").on(t.traineeTgId, t.createdAt),
}));
