import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ ok: true, service: "story-share" });
}

// Serverless API route to send high-res generated story image directly to athlete's Telegram chat
// This bypasses Android/iOS WebView download & share restrictions completely!

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || process.env.NEXT_PUBLIC_BOT_USERNAME || "athletic_smt_bot";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app8814128552.tgcloud.ai";

interface ShareStoryBody {
  chatId?: number | string;
  photoBase64: string;
  caption?: string;
  workoutNumber?: number;
  template?: string;
  language?: string;
}

export async function POST(req: Request) {
  try {
    const body: ShareStoryBody = await req.json();
    const { chatId, photoBase64, caption, workoutNumber = 1, template = "power", language = "uk" } = body;

    if (!photoBase64) {
      return NextResponse.json(
        { ok: false, error: "photoBase64 is required" },
        { status: 400 }
      );
    }

    const targetChatId = chatId;

    if (!targetChatId) {
      return NextResponse.json(
        { ok: false, error: "chatId is required to send to athlete's Telegram chat" },
        { status: 400 }
      );
    }

    if (!BOT_TOKEN) {
      console.warn("[Story Share] TELEGRAM_BOT_TOKEN not configured. Mocking success.");
      return NextResponse.json({
        ok: true,
        mock: true,
        message: "Bot token not configured; mock success",
      });
    }

    // Clean base64 header if present
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });

    const isUk = language === "uk";
    const cleanCaption =
      caption ||
      (isUk
        ? `📸 <b>Ваша картка для Instagram Stories готова!</b>\n\n` +
          `🏋️‍♂️ <i>Тренування #${workoutNumber}</i>\n\n` +
          `📌 <b>Як опублікувати за 5 секунд:</b>\n` +
          `1️⃣ Натисніть на це фото, щоб відкрити його на весь екран\n` +
          `2️⃣ Вгорі праворуч натисніть три крапки <b>⋮</b> → <b>«Поділитися»</b>\n` +
          `3️⃣ Оберіть <b>Instagram Stories</b> (або «Зберегти в галерею»)\n\n` +
          `⚡️ <i>Щоб повернутися до трекера, натисніть кнопку нижче:</i>`
        : `📸 <b>Ваша карточка для Instagram Stories готова!</b>\n\n` +
          `🏋️‍♂️ <i>Тренировка #${workoutNumber}</i>\n\n` +
          `📌 <b>Как опубликовать за 5 секунд:</b>\n` +
          `1️⃣ Нажмите на это фото, чтобы открыть его на весь экран\n` +
          `2️⃣ Вверху справа нажмите три точки <b>⋮</b> → <b>«Поделиться»</b>\n` +
          `3️⃣ Выберите <b>Instagram Stories</b> (или «Сохранить в галерею»)\n\n` +
          `⚡️ <i>Чтобы вернуться в трекер, нажмите кнопку ниже:</i>`);

    const formData = new FormData();
    formData.append("chat_id", String(targetChatId));
    formData.append("caption", cleanCaption);
    formData.append("parse_mode", "HTML");
    formData.append("photo", imageBlob, `smt_story_${workoutNumber}_${Date.now()}.png`);

    // Add inline keyboard with direct Mini App launcher to return immediately
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: isUk ? "⚡️ Повернутися до трекера" : "⚡️ Вернуться в трекер",
            web_app: {
              url: APP_URL,
            },
          },
        ],
      ],
    };
    formData.append("reply_markup", JSON.stringify(inlineKeyboard));

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    const data = await tgRes.json();

    if (!data.ok) {
      console.error("[Story Share] Telegram Bot API error:", data);
      return NextResponse.json(
        { ok: false, error: data.description || "Telegram API error" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: data.result?.message_id,
      chatId: data.result?.chat?.id,
    });
  } catch (err: any) {
    console.error("[Story Share] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
