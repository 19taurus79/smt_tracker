import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ ok: true, service: "challenge-publish" });
}

// Next.js Serverless Route: Publish Workout to Challenge Channel
// ZERO external database required!

interface PublishWorkoutBody {
  workoutNumber?: number;
  microcycle?: number;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin?: number;
  athleticScore?: {
    score: number;
    tierKey?: "active" | "power_master" | "iron_pro" | "titan";
    tier?: string;
    tierLabel?: string;
  };
  athleteName?: string;
  athleteUsername?: string;
  notes?: string;

  // Prep Adaptation fields
  isPrep?: boolean;
  prepSessionNumber?: number;
  targetRestSeconds?: number;
  completedSetsCount?: number;
  totalSetsCount?: number;
  isFinalGraduation?: boolean;
  suggestedWeightsSummary?: string;
}

function resolveTierTitle(scoreObj?: PublishWorkoutBody["athleticScore"]): string {
  if (!scoreObj) return "Активний Атлет";
  if (scoreObj.tierLabel && scoreObj.tierLabel !== "undefined") {
    return scoreObj.tierLabel;
  }
  const key = scoreObj.tierKey || scoreObj.tier;
  switch (key) {
    case "titan":
      return "ТИТАН СИЛИ";
    case "iron_pro":
      return "Залізний Профі";
    case "power_master":
      return "Майстер Потужності";
    case "active":
    default:
      return "Активний Атлет";
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const rawChannel = process.env.TELEGRAM_CHALLENGE_CHANNEL_ID || "@smt_challenge";
const CHANNEL_ID = rawChannel.startsWith("@") || rawChannel.startsWith("-") ? rawChannel : `@${rawChannel}`;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "athletic_smt_bot";

export async function POST(req: Request) {
  try {
    const body: PublishWorkoutBody = await req.json();

    const {
      workoutNumber = 1,
      microcycle = 1,
      durationSeconds,
      tonnageKg,
      powerKgPerMin = 0,
      athleticScore,
      athleteName,
      athleteUsername,
      notes,
      isPrep,
      prepSessionNumber = 1,
      targetRestSeconds = 30,
      completedSetsCount,
      totalSetsCount,
      isFinalGraduation,
      suggestedWeightsSummary,
    } = body;

    const athleteDisplay = athleteName || (athleteUsername ? `@${athleteUsername.replace("@", "")}` : "Атлет SMT");
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    let channelPost: string;

    if (isPrep && (isFinalGraduation || prepSessionNumber === 6)) {
      // 🎓 Graduation from adaptation cycle
      channelPost = [
        `🎓 <b>ВИПУСКНИК АДАПТАЦІЇ! ГОТОВИЙ ДО СМТ-1</b>`,
        ``,
        `👤 <b>Атлет:</b> ${athleteDisplay} ${athleteUsername ? `(@${athleteUsername.replace("@", "")})` : ""}`,
        `🏆 <b>Результат:</b> Всі 6 вводних тренувань успішно пройдено!`,
        `⏱ <b>Паузи відпочинку:</b> 30 секунд підкорено`,
        `📦 <b>Тоннаж фінальної сесії:</b> ${tonnageKg.toLocaleString()} кг`,
        suggestedWeightsSummary ? `⚖️ <b>Стартові ваги СМТ-1:</b> ${suggestedWeightsSummary}` : "",
        ``,
        `💡 <i>Серце, судини та зв'язки повністю адаптовані до екстремальної щільності. Атлет офіційно розпочинає 12-тижневий цикл СМТ-1!</i>`,
        notes ? `\n💬 <i>"${notes}"</i>` : "",
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `🚀 <i>Приєднуйся до челенджу та забирай трекер:</i> @${BOT_USERNAME.replace("@", "")}`,
      ]
        .filter(Boolean)
        .join("\n");
    } else if (isPrep) {
      // 🌱 Regular prep session (1–5)
      channelPost = [
        `🌱 <b>АДАПТАЦІЯ ДО СМТ-1 | КРОК #${prepSessionNumber}/6</b>`,
        ``,
        `👤 <b>Атлет:</b> ${athleteDisplay} ${athleteUsername ? `(@${athleteUsername.replace("@", "")})` : ""}`,
        `📅 <b>Вводне тренування:</b> #${prepSessionNumber} із 6`,
        `⏱ <b>Час роботи:</b> ${timeFormatted}`,
        `⏳ <b>Цільовий відпочинок:</b> ${targetRestSeconds}с (витримано!)`,
        `📦 <b>Тоннаж сесії:</b> ${tonnageKg.toLocaleString()} кг`,
        completedSetsCount && totalSetsCount
          ? `✅ <b>Закрито підходів:</b> ${completedSetsCount}/${totalSetsCount}`
          : "",
        notes ? `\n💬 <i>"${notes}"</i>` : "",
        ``,
        `💡 <i>Підготовка серцево-судинної системи та зв'язок перед стартом 12-тижневої програми.</i>`,
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `🚀 <i>Приєднуйся до челенджу та забирай трекер:</i> @${BOT_USERNAME.replace("@", "")}`,
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      // 🔥 Standard SMT-1 workout
      const tierTitle = resolveTierTitle(athleticScore);
      const scoreDisplay = athleticScore
        ? `🏆 <b>ІНДЕКС АТЛЕТИЧНОСТІ:</b> ${athleticScore.score} / 100 [<b>${tierTitle}</b>]`
        : `⚡️ <b>Щільність:</b> ${powerKgPerMin} кг/хв`;

      channelPost = [
        `🔥 <b>НОВИЙ РЕЗУЛЬТАТ У SMT CHALLENGE!</b>`,
        ``,
        `👤 <b>Атлет:</b> ${athleteDisplay} ${athleteUsername ? `(@${athleteUsername.replace("@", "")})` : ""}`,
        `🏋️‍♂️ <b>Програма:</b> СМТ-1 (High-Density Training)`,
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
    }

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
