import { NextResponse } from "next/server";

// Serverless API route to send high-res generated story image directly to athlete's Telegram chat
// This bypasses Android/iOS WebView download & share restrictions completely!

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || process.env.NEXT_PUBLIC_BOT_USERNAME || "athletic_smt_bot";

interface ShareStoryBody {
  chatId?: number | string;
  photoBase64: string;
  caption?: string;
  workoutNumber?: number;
  template?: string;
}

export async function POST(req: Request) {
  try {
    const body: ShareStoryBody = await req.json();
    const { chatId, photoBase64, caption, workoutNumber = 1, template = "power" } = body;

    if (!photoBase64) {
      return NextResponse.json(
        { ok: false, error: "photoBase64 is required" },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { ok: false, error: "chatId is required to send to Telegram chat" },
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

    const cleanBotName = BOT_USERNAME.replace("@", "");
    const cleanCaption =
      caption ||
      `🔥 <b>Ваша історія SMT-1 готова!</b>\n\n` +
      `🏋️‍♂️ <i>Тренування #${workoutNumber} (${template})</i>\n\n` +
      `📌 <b>Як опублікувати:</b>\n` +
      `1. ✈️ <b>В Telegram Stories:</b> Відкрийте це фото та натисніть значок «В історію» вгорі.\n` +
      `2. 📸 <b>В Instagram Stories:</b> Натисніть «Зберегти в галерею» 📲 та опублікуйте в Instagram!`;

    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("caption", cleanCaption);
    formData.append("parse_mode", "HTML");
    formData.append("photo", imageBlob, `smt_story_${workoutNumber}_${Date.now()}.png`);

    // Add inline keyboard with direct links
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "🚀 Відкрити SMT Трекер",
            url: `https://t.me/${cleanBotName}`,
          },
          {
            text: "📸 В Instagram",
            url: "https://instagram.com",
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
