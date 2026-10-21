import { NextResponse } from "next/server";

// Next.js Serverless Route: Direct Coach Workout Report
// Delivers workout reports directly to Coach's Telegram without opening any browser tabs!

interface CoachReportBody {
  traineeName?: string;
  traineeUsername?: string;
  workoutNumber: number;
  microcycle: number;
  week?: number;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore?: {
    score: number;
    tierKey?: string;
    tierLabel?: string;
  };
  latestMeasurement?: {
    weightKg?: number;
    waistCm?: number;
    bicepsCm?: number;
  };
  exercises?: Array<{
    name: string;
    weight: number;
    reps: number;
    setsCount: number;
    supersetLabel?: string;
  }>;
  notes?: string;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const rawChannel = process.env.TELEGRAM_CHALLENGE_CHANNEL_ID || "@smt_challenge";
const CHANNEL_ID = rawChannel.startsWith("@") || rawChannel.startsWith("-") ? rawChannel : `@${rawChannel}`;
const COACH_CHAT_ID = process.env.COACH_TELEGRAM_CHAT_ID;
const COACH_USERNAME = (process.env.NEXT_PUBLIC_COACH_USERNAME || "OnyshchenkoSergey").replace(/^@/, "");

function resolveTierTitle(scoreObj?: CoachReportBody["athleticScore"]): string {
  if (!scoreObj) return "Активний Атлет";
  if (scoreObj.tierLabel && scoreObj.tierLabel !== "undefined") {
    return scoreObj.tierLabel;
  }
  const key = scoreObj.tierKey;
  switch (key) {
    case "titan":
      return "ТИТАН СИЛИ ⚡";
    case "iron_pro":
      return "Залізний Профі 🦾";
    case "power_master":
      return "Майстер Потужності 💥";
    case "active":
    default:
      return "Активний Атлет 🏋️‍♂️";
  }
}

export async function POST(req: Request) {
  try {
    const body: CoachReportBody = await req.json();

    const {
      traineeName,
      traineeUsername,
      workoutNumber,
      microcycle,
      durationSeconds,
      tonnageKg,
      powerKgPerMin,
      athleticScore,
      latestMeasurement,
      exercises,
      notes,
    } = body;

    const athleteDisplay = traineeName || (traineeUsername ? `@${traineeUsername.replace(/^@/, "")}` : "Підопічний атлет");
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    const tierTitle = resolveTierTitle(athleticScore);

    const lines = [
      `👑 <b>НОВИЙ ЗВІТ ДЛЯ ТРЕНЕРА!</b>`,
      ``,
      `👤 <b>Підопічний:</b> ${athleteDisplay} ${traineeUsername ? `(@${traineeUsername.replace(/^@/, "")})` : ""}`,
      `📅 <b>Тренування:</b> #${workoutNumber} (МКЦ-${microcycle})`,
      `⏱ <b>Час:</b> ${timeFormatted} (паузи суворо 30с)`,
      `📦 <b>Тоннаж:</b> ${tonnageKg.toLocaleString()} кг`,
      `⚡ <b>Потужність:</b> ${powerKgPerMin} кг/хв`,
      athleticScore ? `🏆 <b>Індекс:</b> ${athleticScore.score} / 100 [<b>${tierTitle}</b>]` : "",
    ];

    if (latestMeasurement?.weightKg) {
      const waistStr = latestMeasurement.waistCm ? ` | Талія: ${latestMeasurement.waistCm} см` : "";
      lines.push(`⚖️ <b>Вага атлета:</b> ${latestMeasurement.weightKg} кг${waistStr}`);
    }

    if (exercises && exercises.length > 0) {
      lines.push(``);
      lines.push(`📋 <b>Виконані ваги:</b>`);
      for (const ex of exercises) {
        lines.push(`• <b>${ex.name}:</b> ${ex.weight} кг × ${ex.reps} (${ex.setsCount} підх)`);
      }
    }

    if (notes) {
      lines.push(``);
      lines.push(`💬 <i>"${notes}"</i>`);
    }

    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`💬 <i>Відповісти атлету:</i> ${traineeUsername ? `https://t.me/${traineeUsername.replace(/^@/, "")}` : "в особисті повідомлення"}`);

    const messageText = lines.filter(Boolean).join("\n");

    if (!BOT_TOKEN) {
      console.log("[Coach Report Mock (no BOT_TOKEN)]: \n", messageText);
      return NextResponse.json({
        ok: true,
        mock: true,
        message: "Coach report simulated (no BOT_TOKEN configured)",
      });
    }

    // Determine target recipient chat_id:
    // If COACH_CHAT_ID is explicitly set, send to Coach's personal Telegram chat
    // Otherwise fallback to CHANNEL_ID so reports are never lost
    const targetChatId = COACH_CHAT_ID || CHANNEL_ID;

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
    if (!data.ok) {
      console.error("[Coach Report API] Telegram API error:", data);
      return NextResponse.json(
        { ok: false, error: data.description || "Telegram API error" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: data.result?.message_id,
      deliveredTo: targetChatId,
    });
  } catch (error) {
    console.error("[Coach Report API] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
