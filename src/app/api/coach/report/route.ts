import { NextResponse } from "next/server";
import { MASTER_COACH_CHAT_ID } from "@/lib/auth/roles";
import { recordWorkoutForTrainee } from "@/lib/server/traineeStorage";

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
const COACH_CHAT_ID = process.env.COACH_TELEGRAM_CHAT_ID || MASTER_COACH_CHAT_ID;

// Deduplication cache to prevent multiple notifications if trainee double-taps or triggers report twice
const recentReports = new Map<string, number>();
const REPORT_DEDUPE_TTL_MS = 3 * 60 * 1000; // 3 minutes

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

    const cleanUsername = (traineeUsername || "").replace(/^@/, "").trim();

    // Record workout report to server trainee storage
    try {
      recordWorkoutForTrainee({
        traineeName,
        traineeUsername: cleanUsername,
        workoutNumber,
        microcycle,
        durationSeconds,
        tonnageKg,
        powerKgPerMin,
        athleticScore,
        latestMeasurement,
        exercises,
        notes,
      });
    } catch (saveErr) {
      console.error("[Coach Report API] Error saving trainee report:", saveErr);
    }
    const athleteDisplay = traineeName || (cleanUsername ? `@${cleanUsername}` : "Підопічний атлет");
    const athleteKey = (cleanUsername || traineeName || "athlete").toLowerCase();
    const dedupeKey = `${athleteKey}_w${workoutNumber}_m${microcycle}`;
    const now = Date.now();

    // Clean up cache if map grows large
    if (recentReports.size > 2000) {
      recentReports.clear();
    }

    if (recentReports.has(dedupeKey)) {
      const prevTime = recentReports.get(dedupeKey) || 0;
      if (now - prevTime < REPORT_DEDUPE_TTL_MS) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          message: "Workout report already delivered to coach recently",
        });
      }
    }
    recentReports.set(dedupeKey, now);

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    const tierTitle = resolveTierTitle(athleticScore);

    const lines = [
      `👑 <b>НОВИЙ ЗВІТ ДЛЯ ТРЕНЕРА!</b>`,
      ``,
      `👤 <b>Підопічний:</b> ${athleteDisplay} ${cleanUsername ? `(@${cleanUsername})` : ""}`,
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
    lines.push(`💬 <i>Відповісти атлету:</i> ${cleanUsername ? `https://t.me/${cleanUsername}` : "в особисті повідомлення"}`);

    const messageText = lines.filter(Boolean).join("\n");

    if (!BOT_TOKEN) {
      console.log("[Coach Report Mock (no BOT_TOKEN)]: \n", messageText);
      return NextResponse.json({
        ok: true,
        mock: true,
        message: "Coach report simulated (no BOT_TOKEN configured)",
      });
    }

    // Reports MUST go strictly to the Coach's private Telegram chat
    const targetChatId = COACH_CHAT_ID;
    if (!targetChatId) {
      console.error("[Coach Report API] No COACH_CHAT_ID defined!");
      return NextResponse.json({ ok: false, error: "Coach chat ID not configured" }, { status: 400 });
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
