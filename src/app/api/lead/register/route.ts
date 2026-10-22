import { NextResponse } from "next/server";
import { isCoachAccount, MASTER_COACH_CHAT_ID } from "@/lib/auth/roles";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const COACH_CHAT_ID = process.env.COACH_TELEGRAM_CHAT_ID || MASTER_COACH_CHAT_ID;

// In-memory cache to deduplicate lead alerts across requests in a warm serverless instance
const recentLeads = new Map<string, number>();
const LEAD_DEDUPE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, telegramUserId } = body;

    const cleanUsername = (username || "").replace(/^@/, "").trim();

    // Skip notifying if the user is the coach himself
    if (isCoachAccount(cleanUsername, telegramUserId)) {
      return NextResponse.json({ ok: true, isCoach: true });
    }

    const dedupeKey = (telegramUserId ? `id:${telegramUserId}` : `u:${cleanUsername.toLowerCase()}`) || `name:${name}`;
    const now = Date.now();

    // Clean up old entries if map gets too large
    if (recentLeads.size > 2000) {
      recentLeads.clear();
    }

    if (recentLeads.has(dedupeKey)) {
      const prevTime = recentLeads.get(dedupeKey) || 0;
      if (now - prevTime < LEAD_DEDUPE_TTL_MS) {
        return NextResponse.json({ ok: true, duplicate: true, message: "Lead already notified" });
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

    const lines = [
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
      return NextResponse.json({ ok: true, mock: true });
    }

    // Lead alerts MUST be sent strictly to Coach's personal chat
    const targetChatId = COACH_CHAT_ID;
    if (!targetChatId) {
      console.warn("[Lead Register] No COACH_CHAT_ID available, skipping send to avoid spamming public channels.");
      return NextResponse.json({ ok: false, error: "Coach Chat ID not configured" }, { status: 400 });
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
    return NextResponse.json({ ok: Boolean(data?.ok), deliveredTo: targetChatId });
  } catch (error) {
    console.error("[Lead Register API] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
