import { db, api, EndpointError } from "sdk";
import { eq, sql } from "sdk/db";
import { trainees } from "../schema.js";

const COACH_CHAT_ID = 548019148;

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user || !user.id) {
    throw new EndpointError("Unauthorized: Telegram user data missing", { code: "UNAUTHORIZED" });
  }

  const tgId = user.id;
  const username = (user.username || input.username || "").replace(/^@/, "");
  const name = user.first_name ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}` : (input.name || "Атлет");

  // Check if exists
  const existing = await db.select().from(trainees).where(eq(trainees.tgId, tgId)).get();

  if (existing) {
    await db.update(trainees)
      .set({
        name,
        username,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(trainees.tgId, tgId));
    return { ok: true, trainee: { ...existing, name, username } };
  }

  // Insert new lead
  await db.insert(trainees).values({
    tgId,
    username,
    name,
    status: "new_lead",
    tierKey: "lead",
    tierLabel: "НОВИЙ ЛІД 🔥",
    coachNotes: "Підписався на канал та відкрив трекер у Telegram.",
  });

  // Notify coach if caller is not the coach
  if (tgId !== COACH_CHAT_ID && username.toLowerCase() !== "onyshchenkosergey") {
    const alertMsg = [
      "🎯 <b>НОВИЙ ЛІД У ВАШУ КОМАНДУ СМТ!</b>",
      "",
      `👤 <b>Атлет:</b> ${name} ${username ? `(@${username})` : ""}`,
      "⚡ <b>Статус:</b> Запустив Mini App у Telegram!",
      "━━━━━━━━━━━━━━━━━━",
      username ? `💬 <i>Написати:</i> https://t.me/${username}` : "",
    ].filter(Boolean).join("\n");

    try {
      await api.sendMessage({
        chat_id: COACH_CHAT_ID,
        text: alertMsg,
        parse_mode: "HTML",
      });
    } catch (e) {
      console.warn("Failed to send coach notification:", e);
    }
  }

  return { ok: true, registered: true };
}
