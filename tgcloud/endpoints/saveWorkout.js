import { db, api, EndpointError } from "sdk";
import { eq, sql } from "sdk/db";
import { trainees, workoutReports } from "../schema.js";

const COACH_CHAT_ID = 548019148;

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user || !user.id) {
    throw new EndpointError("Unauthorized: Telegram user data missing", { code: "UNAUTHORIZED" });
  }

  const tgId = user.id;
  const username = (user.username || input.traineeUsername || "").replace(/^@/, "");
  const name = user.first_name ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}` : (input.traineeName || "Атлет");

  const workoutNumber = Number(input.workoutNumber) || 1;
  const microcycle = Number(input.microcycle) || 1;
  const durationSeconds = Number(input.durationSeconds) || 0;
  const tonnageKg = Number(input.tonnageKg) || 0;
  const powerKgPerMin = Number(input.powerKgPerMin) || 0;
  const athleticScore = Number(input.athleticScore?.score) || 75;
  const tierLabel = input.athleticScore?.tierLabel || "Активний Атлет";
  const notes = input.notes || "";
  const exercises = input.exercises || [];

  // 1. Insert report
  await db.insert(workoutReports).values({
    traineeTgId: tgId,
    workoutNumber,
    microcycle,
    durationSeconds,
    tonnageKg,
    powerKgPerMin,
    athleticScore,
    tierLabel,
    notes,
    exercises,
  });

  // 2. Upsert trainee in SQLite
  const existing = await db.select().from(trainees).where(eq(trainees.tgId, tgId)).get();

  if (existing) {
    await db.update(trainees)
      .set({
        name,
        username,
        currentWorkoutNumber: workoutNumber,
        currentMicrocycle: microcycle,
        totalWorkouts: (existing.totalWorkouts || 0) + 1,
        weightKg: Number(input.latestMeasurement?.weightKg) || existing.weightKg,
        athleticScore,
        tierKey: input.athleticScore?.tierKey || existing.tierKey,
        tierLabel,
        status: existing.status === "blocked" ? "blocked" : "active",
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(trainees.tgId, tgId));
  } else {
    await db.insert(trainees).values({
      tgId,
      username,
      name,
      currentWorkoutNumber: workoutNumber,
      currentMicrocycle: microcycle,
      totalWorkouts: 1,
      weightKg: Number(input.latestMeasurement?.weightKg) || 80.0,
      athleticScore,
      tierKey: input.athleticScore?.tierKey || "active",
      tierLabel,
      status: "active",
      coachNotes: "Виконав перше тренування в трекері.",
    });
  }

  // 3. Send Telegram report to Coach
  const durationMin = Math.floor(durationSeconds / 60);
  const durationSec = durationSeconds % 60;
  const durationFormatted = `${durationMin}хв ${durationSec < 10 ? "0" : ""}${durationSec}с`;

  const lines = [
    `🏋️‍♂️ <b>ЗВІТ ПРО ТРЕНУВАННЯ СМТ-1</b>`,
    ``,
    `👤 <b>Атлет:</b> ${name} ${username ? `(@${username})` : ""}`,
    `⚡ <b>Тренування:</b> #${workoutNumber} (Мікроцикл ${microcycle})`,
    `⏱ <b>Тривалість:</b> ${durationFormatted}`,
    `💪 <b>Тоннаж:</b> ${Math.round(tonnageKg)} кг`,
    `⚡ <b>Щільність:</b> ${Math.round(powerKgPerMin)} кг/хв`,
    `🏆 <b>Індекс Атлетичності:</b> ${athleticScore} (${tierLabel})`,
  ];

  if (notes) {
    lines.push(``);
    lines.push(`💬 <i>"${notes}"</i>`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`💬 <i>Відповісти:</i> ${username ? `https://t.me/${username}` : "в особисті повідомлення"}`);

  try {
    await api.sendMessage({
      chat_id: COACH_CHAT_ID,
      text: lines.join("\n"),
      parse_mode: "HTML",
    });
  } catch (err) {
    console.warn("Error sending telegram report to coach:", err);
  }

  return { ok: true, saved: true };
}
