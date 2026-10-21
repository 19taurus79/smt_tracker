import { NextResponse } from "next/server";
import { isCoachAccount } from "@/lib/auth/roles";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const rawChannel = process.env.TELEGRAM_CHALLENGE_CHANNEL_ID || "@smt_challenge";
const CHANNEL_ID = rawChannel.startsWith("@") || rawChannel.startsWith("-") ? rawChannel : `@${rawChannel}`;
const COACH_CHAT_ID = process.env.COACH_TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, telegramUserId } = body;

    const cleanUsername = (username || "").replace(/^@/, "");

    // Skip notifying if the user is the coach himself
    if (isCoachAccount(cleanUsername, telegramUserId)) {
      return NextResponse.json({ ok: true, isCoach: true });
    }

    const athleteDisplay = name || (cleanUsername ? `@${cleanUsername}` : "Новий користувач");
    const now = new Date();
    const timeFormatted = now.toLocaleDateString("uk-UA", {
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

    const targetChatId = COACH_CHAT_ID || CHANNEL_ID;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Lead Register API] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
