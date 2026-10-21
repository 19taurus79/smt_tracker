import { NextResponse } from "next/server";

// Next.js Serverless Route: Publish Workout to Challenge Channel
// ZERO external database required!

interface PublishWorkoutBody {
  workoutNumber: number;
  microcycle: number;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore?: {
    score: number;
    tier: string;
    tierLabel: string;
  };
  athleteName?: string;
  athleteUsername?: string;
  notes?: string;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const rawChannel = process.env.TELEGRAM_CHALLENGE_CHANNEL_ID || "@smt_challenge";
const CHANNEL_ID = rawChannel.startsWith("@") || rawChannel.startsWith("-") ? rawChannel : `@${rawChannel}`;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "athletic_smt_bot";

export async function POST(req: Request) {
  try {
    const body: PublishWorkoutBody = await req.json();

    const {
      workoutNumber,
      microcycle,
      durationSeconds,
      tonnageKg,
      powerKgPerMin,
      athleticScore,
      athleteName,
      athleteUsername,
      notes,
    } = body;

    const athleteDisplay = athleteName || (athleteUsername ? `@${athleteUsername}` : "Атлет SMT");
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    const scoreDisplay = athleticScore
      ? `🏆 <b>ІНДЕКС АТЛЕТИЧНОСТІ:</b> ${athleticScore.score} / 100 [<b>${athleticScore.tierLabel}</b>]`
      : `⚡️ <b>Щільність:</b> ${powerKgPerMin} кг/хв`;

    const channelPost = [
      `🔥 <b>НОВИЙ РЕЗУЛЬТАТ У SMT CHALLENGE!</b>`,
      ``,
      `👤 <b>Атлет:</b> ${athleteDisplay} ${athleteUsername ? `(@${athleteUsername.replace("@", "")})` : ""}`,
      `🏋️‍♂️ <b>Програма:</b> СМТ-1 (Майк Казаков / Steelfactor)`,
      `📅 <b>Тренування:</b> #${workoutNumber} (МКЦ-${microcycle})`,
      `⏱ <b>Час:</b> ${timeFormatted} (відпочинок суворо 30с)`,
      `📦 <b>Тоннаж:</b> ${tonnageKg.toLocaleString()} кг`,
      `⚡️ <b>Щільність роботи:</b> ${powerKgPerMin} кг/хв`,
      ``,
      scoreDisplay,
      notes ? `\n💬 <i>"${notes}"</i>` : "",
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `🚀 <i>Приєднуйся до челенджу та забирай трекер:</i> @${BOT_USERNAME.replace("@", "")}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (!BOT_TOKEN) {
      console.log("[Challenge Publish Mock (no BOT_TOKEN)]: \n", channelPost);
      return NextResponse.json({
        ok: true,
        mock: true,
        message: "Bot token not configured, simulated publish successfully",
      });
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: channelPost,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[Challenge Publish] Telegram API error:", data);
      return NextResponse.json(
        { ok: false, error: data.description || "Telegram API error" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: data.result?.message_id,
    });
  } catch (error) {
    console.error("[Challenge Publish] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
