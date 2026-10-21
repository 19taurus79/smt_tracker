import { NextResponse } from "next/server";

// Next.js Serverless Route Handler for Telegram Bot Webhook
// Fully stateless — ZERO external database required!

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const rawChannel = process.env.TELEGRAM_CHALLENGE_CHANNEL_ID || "@smt_challenge";
const CHANNEL_ID = rawChannel.startsWith("@") || rawChannel.startsWith("-") ? rawChannel : `@${rawChannel}`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smt-tracker.vercel.app";

async function tgApi(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) {
    console.warn("[Telegram Webhook] TELEGRAM_BOT_TOKEN is not set");
    return null;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (error) {
    console.error(`[Telegram Webhook] Failed to call ${method}:`, error);
    return null;
  }
}

/**
 * Checks if user is subscribed to the official challenge channel.
 * Uses getChatMember — stateless and real-time.
 */
async function isUserSubscribed(userId: number): Promise<boolean> {
  if (!BOT_TOKEN) return true; // development fallback

  const res = await tgApi("getChatMember", {
    chat_id: CHANNEL_ID,
    user_id: userId,
  });

  if (!res || !res.ok) {
    return false;
  }

  const status = res.result?.status;
  // Allowed statuses: creator, administrator, member
  return status === "creator" || status === "administrator" || status === "member";
}

export async function POST(req: Request) {
  try {
    const update: TelegramUpdate = await req.json();

    // 1. Handle incoming text message (e.g. /start)
    if (update.message?.text) {
      const { text, from, chat } = update.message;
      if (!from) return NextResponse.json({ ok: true });

      const isStart = text.startsWith("/start");
      const lang = from.language_code === "uk" ? "uk" : from.language_code === "ru" ? "ru" : "uk";

      // Handle 1-click PWA Linking from standalone Home Screen app
      if (text.startsWith("/start link_")) {
        const sid = text.replace("/start link_", "").trim();
        const linkUrl = `${APP_URL}/settings?tg_auth=1&id=${from.id}&first_name=${encodeURIComponent(from.first_name)}&username=${encodeURIComponent(from.username || "")}&sid=${sid}`;

        await tgApi("sendMessage", {
          chat_id: chat.id,
          text:
            lang === "uk"
              ? `🔗 <b>Підключення Telegram до вашого PWA на телефоні!</b>\n\nНатисніть кнопку нижче, щоб відкрити PWA-трекер та завершити авторизацію:`
              : `🔗 <b>Подключение Telegram к вашему PWA на телефоне!</b>\n\nНажмите кнопку ниже, чтобы открыть PWA-трекер и завершить авторизацию:`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: lang === "uk" ? "📱 Підтвердити в PWA" : "📱 Подтвердить в PWA",
                  url: linkUrl,
                },
              ],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }

      if (isStart) {
        const isSubscribed = await isUserSubscribed(from.id);

        if (isSubscribed) {
          // User is subscribed -> provide direct WebApp access
          const welcomeMsg =
            lang === "uk"
              ? `🔥 <b>Вітаємо в SMT-1 Tracker!</b>\n\nВи є учасником нашого Челенджу. Тренувальна система <b>Майка Казакова</b> (Steelfactor) налаштована під вас.\n\n⚡️ <i>Правило #1: Відпочинок суворо 30 секунд. 24 підходи = 24-30 хв.</i>\n\nНатисніть кнопку нижче, щоб відкрити персональний щоденник тренувань:`
              : `🔥 <b>Добро пожаловать в SMT-1 Tracker!</b>\n\nВы являетесь участником Челленджа. Тренировочная система <b>Майка Казакова</b> (Steelfactor) готова к старту.\n\n⚡️ <i>Правило #1: Отдых строго 30 секунд. 24 подхода = 24-30 минут.</i>\n\nНажмите кнопку ниже, чтобы открыть персональный дневник:`;

          await tgApi("sendMessage", {
            chat_id: chat.id,
            text: welcomeMsg,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: lang === "uk" ? "🚀 Відкрити SMT-1 Трекер" : "🚀 Открыть SMT-1 Трекер",
                    web_app: { url: APP_URL },
                  },
                ],
                [
                  {
                    text: lang === "uk" ? "📢 Канал Челенджу" : "📢 Канал Челленджа",
                    url: `https://t.me/${CHANNEL_ID.replace("@", "")}`,
                  },
                ],
              ],
            },
          });
        } else {
          // User is NOT subscribed -> prompt to subscribe first
          const gatekeeperMsg =
            lang === "uk"
              ? `🏋️‍♂️ <b>Ласкаво просимо до SMT Челенджу!</b>\n\n<b>СМТ (Надпотужний тренінг)</b> — це легендарна методика натурального тренінгу від <b>Майка Казакова</b> (форум Steelfactor):\n• 36 тренувань (12 тижнів, 4 мікроцикли)\n• Рекомпозиція (спалювання жиру та зростання м'язів)\n• Відпочинок рівно 30 секунд\n\n🔒 <b>Щоб отримати персональний доступ до трекера</b>, підпишіться на наш офіційний канал результатів челенджу:`
              : `🏋️‍♂️ <b>Добро пожаловать в SMT Челлендж!</b>\n\n<b>СМТ (Сверхмощный тренинг)</b> — легендарная методика натурального тренинга от <b>Майка Казакова</b> (форум Steelfactor):\n• 36 тренировок (12 недель, 4 микроцикла)\n• Рекомпозиция (сжигание жира и рост мышц)\n• Отдых ровно 30 секунд\n\n🔒 <b>Чтобы получить доступ к трекеру</b>, подпишитесь на наш официальный канал результатов:`;

          await tgApi("sendMessage", {
            chat_id: chat.id,
            text: gatekeeperMsg,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: lang === "uk" ? "📢 Підписатися на Канал" : "📢 Подписаться на Канал",
                    url: `https://t.me/${CHANNEL_ID.replace("@", "")}`,
                  },
                ],
                [
                  {
                    text: lang === "uk" ? "✅ Я підписався (Перевірити)" : "✅ Я подписался (Проверить)",
                    callback_data: "check_sub",
                  },
                ],
              ],
            },
          });
        }
      }

      // Handle /rules command
      if (text.startsWith("/rules") || text.startsWith("/help")) {
        const rulesMsg =
          lang === "uk"
            ? `⚡️ <b>ЗОЛОТІ ПРАВИЛА СМТ (Майк Казаков / Steelfactor)</b>\n\n1️⃣ <b>Відпочинок суворо 30 секунд:</b> між підходами та колами суперсетів пауза рівно 30 секунд. Якщо важко — зменшіть вагу, але тримайте темп!\n2️⃣ <b>Темп тренування:</b> 1 підхід = ~1 хвилина. Вся тренування з 24 підходів триває 24–30 хвилин.\n3️⃣ <b>Два етапи прогресу:</b> Етап 1 — виконати всі підходи з відпочинком 30с. Етап 2 — додати +2.5 кг на наступне тренування.\n4️⃣ <b>Незмінний комплекс:</b> всі 36 тренувань вправи не змінюються для максимальної нервово-м'язової адаптації.`
            : `⚡️ <b>ЗОЛОТЫЕ ПРАВИЛА СМТ (Майк Казаков / Steelfactor)</b>\n\n1️⃣ <b>Отдых строго 30 секунд:</b> между подходами и кругами пауза ровно 30 секунд. Если тяжело — снизьте вес, но держите темп!\n2️⃣ <b>Темп тренировки:</b> 1 подход = ~1 минута. Вся тренировка из 24 подходов длится 24–30 минут.\n3️⃣ <b>Два этапа прогресса:</b> Этап 1 — закрыть все подходы с отдыхом 30с. Этап 2 — добавить +2.5 кг на следующую тренировку.\n4️⃣ <b>Неизменный комплекс:</b> все 36 тренировок упражнения не меняются для идеальной нервно-мышечной адаптации.`;

        await tgApi("sendMessage", {
          chat_id: chat.id,
          text: rulesMsg,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: lang === "uk" ? "🚀 Відкрити Трекер" : "🚀 Открыть Трекер",
                  web_app: { url: APP_URL },
                },
              ],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }

      // Handle /coach command
      if (text.startsWith("/coach")) {
        const coachUser = (process.env.NEXT_PUBLIC_COACH_USERNAME || "coach_alex").replace(/^@/, "");
        await tgApi("sendMessage", {
          chat_id: chat.id,
          text:
            lang === "uk"
              ? `👤 <b>Головний Тренер Челенджу:</b> @${coachUser}\n\nВи можете надіслати запитання щодо техніки, підбору робочих ваг або харчування:`
              : `👤 <b>Главный Тренер Челленджа:</b> @${coachUser}\n\nВы можете задать вопрос по технике, подбору весов или питанию:`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: lang === "uk" ? "💬 Написати Тренеру" : "💬 Написать Тренеру",
                  url: `https://t.me/${coachUser}`,
                },
              ],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }

      // Handle /app command
      if (text.startsWith("/app")) {
        await tgApi("sendMessage", {
          chat_id: chat.id,
          text:
            lang === "uk"
              ? "🏋️‍♂️ <b>SMT-1 Tracker & Challenge</b>\nНатисніть кнопку нижче, щоб відкрити персональний щоденник тренувань:"
              : "🏋️‍♂️ <b>SMT-1 Tracker & Challenge</b>\nНажмите кнопку ниже, чтобы открыть персональный дневник тренировок:",
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: lang === "uk" ? "🚀 Запустити Трекер" : "🚀 Запустить Трекер",
                  web_app: { url: APP_URL },
                },
              ],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }
    }

    // 2. Handle button callback query (e.g. check_sub)
    if (update.callback_query) {
      const { id, from, message, data } = update.callback_query;

      if (data === "check_sub") {
        const isSubscribed = await isUserSubscribed(from.id);
        const lang = from.language_code === "uk" ? "uk" : "ru";

        if (isSubscribed) {
          await tgApi("answerCallbackQuery", {
            callback_query_id: id,
            text: lang === "uk" ? "🎉 Підписку підтверджено! Доступ відкрито." : "🎉 Подписка подтверждена! Доступ открыт.",
            show_alert: false,
          });

          if (message?.chat?.id) {
            await tgApi("sendMessage", {
              chat_id: message.chat.id,
              text:
                lang === "uk"
                  ? "✅ <b>Успішно!</b> Ваш доступ до SMT-1 активовано.\nТисніть кнопку нижче, щоб розпочати перше тренування:"
                  : "✅ <b>Успешно!</b> Ваш доступ к SMT-1 активирован.\nЖмите кнопку ниже, чтобы начать первую тренировку:",
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: lang === "uk" ? "🚀 Запустити SMT-1 Трекер" : "🚀 Запустить SMT-1 Трекер",
                      web_app: { url: APP_URL },
                    },
                  ],
                ],
              },
            });
          }
        } else {
          await tgApi("answerCallbackQuery", {
            callback_query_id: id,
            text:
              lang === "uk"
                ? "⚠️ Ви ще не підписалися на канал! Будь ласка, натисніть 'Підписатися на Канал' перед перевіркою."
                : "⚠️ Вы еще не подписались на канал! Пожалуйста, нажмите 'Подписаться на Канал' перед проверкой.",
            show_alert: true,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "SMT Tracker Telegram Serverless Webhook",
    botConfigured: Boolean(BOT_TOKEN),
    channel: CHANNEL_ID,
  });
}
