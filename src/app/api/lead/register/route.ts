import { NextResponse } from "next/server";
import { isCoachAccount, MASTER_COACH_CHAT_ID } from "@/lib/auth/roles";
import { registerOrUpdateLead } from "@/lib/server/traineeStorage";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ ok: true, service: "lead-register" });
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const COACH_CHAT_ID = process.env.COACH_TELEGRAM_CHAT_ID || MASTER_COACH_CHAT_ID;

// In-memory cache to deduplicate lead alerts across requests in a warm serverless instance
const recentLeads = new Map<string, number>();
const LEAD_DEDUPE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      username,
      telegramUserId,
      isTransfer,
      totalWorkouts,
      currentMicrocycle,
      weightKg,
      totalTonnageKg,
      workoutHistory,
      silent,
    } = body;

    const cleanUsername = (username || "").replace(/^@/, "").trim();
    const isTransferBool = Boolean(isTransfer);
    const isSilent = Boolean(silent);
    const workoutsCount = Number(totalWorkouts) || 0;
    const microcycleNum = Number(currentMicrocycle) || 1;
    const weightNum = Number(weightKg) || 80;
    const tonnageNum = Number(totalTonnageKg) || 0;

    // 1. Always record/update trainee in persistent server storage!
    const trainee = registerOrUpdateLead({
      name,
      username: cleanUsername,
      telegramUserId,
      totalWorkouts: isTransferBool ? workoutsCount : undefined,
      currentMicrocycle: isTransferBool ? microcycleNum : undefined,
      weightKg: isTransferBool && weightNum > 0 ? weightNum : undefined,
      status: isTransferBool && workoutsCount > 0 ? "active" : "new_lead",
      tierKey: isTransferBool && workoutsCount >= 10 ? "titan" : "active",
      tierLabel: isTransferBool && workoutsCount >= 10 ? "ТИТАН СИЛИ ⚡" : isTransferBool ? "Активний Атлет 🏋️‍♂️" : "НОВИЙ ЛІД 🔥",
      coachNotes: isTransferBool
        ? `Атлет переніс ${workoutsCount} тренувань з PWA-версії. Загальний тоннаж: ${tonnageNum.toLocaleString()} кг.`
        : "Підписався на канал і запустив трекер.",
      workoutHistory: Array.isArray(workoutHistory) ? workoutHistory : undefined,
    });

    // If silent sync requested, don't ping Telegram bot
    if (isSilent) {
      return NextResponse.json({ ok: true, silent: true, trainee });
    }

    // Skip Telegram notification if the user is the coach himself
    if (isCoachAccount(cleanUsername, telegramUserId)) {
      return NextResponse.json({ ok: true, isCoach: true, trainee });
    }

    // Persistent deduplication: if athlete already had transfer notified, never send transfer message again!
    if (isTransferBool && trainee.transferNotified) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        message: "Athlete transfer already notified previously",
        trainee,
      });
    }

    const dedupeKey = isTransferBool
      ? `transfer:${telegramUserId || cleanUsername.toLowerCase()}`
      : (telegramUserId ? `id:${telegramUserId}` : `u:${cleanUsername.toLowerCase()}`) || `name:${name}`;
    const now = Date.now();

    // Clean up old entries if map gets too large
    if (recentLeads.size > 2000) {
      recentLeads.clear();
    }

    if (recentLeads.has(dedupeKey)) {
      const prevTime = recentLeads.get(dedupeKey) || 0;
      if (now - prevTime < LEAD_DEDUPE_TTL_MS) {
        return NextResponse.json({ ok: true, duplicate: true, message: "Lead already notified", trainee });
      }
    }
    recentLeads.set(dedupeKey, now);

    const athleteDisplay = name || (cleanUsername ? `@${cleanUsername}` : "Новий користувач");
    const nowDate = new Date();
    const timeFormatted = nowDate.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const lines = isTransferBool
      ? [
          `⚡️ <b>АТЛЕТ УСПІШНО ПЕРЕНІС ДАНІ В TELEGRAM!</b>`,
          ``,
          `👤 <b>Атлет:</b> ${athleteDisplay} ${cleanUsername ? `(@${cleanUsername})` : ""}`,
          `📅 <b>Дата:</b> ${timeFormatted}`,
          `📊 <b>Перенесено тренувань:</b> ${workoutsCount} (поточний МКЦ-${microcycleNum})`,
          tonnageNum > 0 ? `📦 <b>Загальний тоннаж:</b> ${tonnageNum.toLocaleString()} кг` : "",
          weightNum > 0 ? `⚖️ <b>Вага атлета:</b> ${weightNum} кг` : "",
          `✅ <i>Атлет приєднаний до вас у TMA і готовий тренуватися!</i>`,
          ``,
          `━━━━━━━━━━━━━━━━━━`,
          cleanUsername
            ? `💬 <i>Написати атлету:</i> https://t.me/${cleanUsername}`
            : `💬 <i>Атлет поки не має публічного @username</i>`,
        ].filter(Boolean)
      : [
          `🎯 <b>НОВИЙ ЛІД У ВАШУ КОМАНДУ СМТ!</b>`,
          ``,
          `👤 <b>Атлет:</b> ${athleteDisplay} ${cleanUsername ? `(@${cleanUsername})` : ""}`,
          `📅 <b>Дата:</b> ${timeFormatted}`,
          `⚡ <b>Статус:</b> Підписався на канал та відкрив трекер!`,
          ``,
          `━━━━━━━━━━━━━━━━━━`,
          cleanUsername
            ? `💬 <i>Написати атлету:</i> https://t.me/${cleanUsername}`
            : `💬 <i>Атлет поки не має публічного @username</i>`,
        ];

    const messageText = lines.join("\n");

    if (!BOT_TOKEN) {
      console.log("[Lead Register Mock (no BOT_TOKEN)]:\n", messageText);
      return NextResponse.json({ ok: true, mock: true, trainee });
    }

    const targetChatId = COACH_CHAT_ID;
    if (!targetChatId) {
      console.warn("[Lead Register] No COACH_CHAT_ID available, skipping send to avoid spamming public channels.");
      return NextResponse.json({ ok: true, error: "Coach Chat ID not configured", trainee });
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (data?.ok && isTransferBool) {
      registerOrUpdateLead({
        name,
        username: cleanUsername,
        telegramUserId,
        transferNotified: true,
      });
    }
    return NextResponse.json({ ok: Boolean(data?.ok), deliveredTo: targetChatId, trainee });
  } catch (error) {
    console.error("[Lead Register API] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
