import { NextResponse } from "next/server";
import { isCoachAccount, MASTER_COACH_CHAT_ID, MASTER_COACH_USERNAME } from "@/lib/auth/roles";

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
const COACH_CHAT_ID = process.env.COACH_TELEGRAM_CHAT_ID || MASTER_COACH_CHAT_ID;

// In-memory cache to deduplicate bot lead alerts (e.g. repeated clicks on check_sub)
const recentBotLeads = new Map<number, number>();
const BOT_LEAD_DEDUPE_MS = 24 * 60 * 60 * 1000; // 24h

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
        const startParam = text.replace("/start", "").trim();
        const coachParam = startParam.startsWith("coach_")
          ? `&coach=${encodeURIComponent(startParam.replace("coach_", ""))}`
          : "";

        if (isSubscribed) {
          // User is subscribed -> provide direct WebApp access
          const miniAppUrl = coachParam
            ? `${APP_URL}/?startapp=${encodeURIComponent(startParam)}`
            : APP_URL;

          const welcomeMsg =
            lang === "uk"
              ? `🔥 <b>Вітаємо в SMT-1 Tracker!</b>\n\nВи є учасником нашого Челенджу. Тренувальна система <b>СМТ-1 (Високощільний тренінг)</b> готова до старту.\n\n⚡️ <i>Правило #1: Відпочинок суворо 30 секунд. 24 підходи = 24-30 хв.</i>\n\n📲 <i>Натисніть кнопку «⚡️ Відкрити SMT-1 Трекер» нижче, щоб запустити нативний трекер у повноекранному режимі:</i>`
              : `🔥 <b>Добро пожаловать в SMT-1 Tracker!</b>\n\nВы являетесь участником Челленджа. Тренировочная система <b>СМТ-1 (Высокоплотный тренинг)</b> готова к старту.\n\n⚡️ <i>Правило #1: Отдых строго 30 секунд. 24 подхода = 24-30 минут.</i>\n\n📲 <i>Нажмите кнопку «⚡️ Открыть SMT-1 Трекер» ниже, чтобы запустить нативный трекер в полноэкранном режиме:</i>`;

          await tgApi("sendMessage", {
            chat_id: chat.id,
            text: welcomeMsg,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: lang === "uk" ? "⚡️ Відкрити SMT-1 Трекер" : "⚡️ Открыть SMT-1 Трекер",
                    web_app: {
                      url: miniAppUrl,
                    },
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
              ? `🏋️‍♂️ <b>Ласкаво просимо до SMT Челенджу!</b>\n\n<b>СМТ (Надпотужний тренінг)</b> — це високоефективна система натурального силового тренінгу:\n• 36 тренувань (12 тижнів, 4 мікроцикли)\n• Рекомпозиція (спалювання жиру та зростання щільності м'язів)\n• Відпочинок рівно 30 секунд\n\n⚠️ <i>Зверніть увагу: програма вимагає попередньої фізичної підготовки або проходження 1–2 тижневого вводного циклу.</i>\n\n🔒 <b>Щоб отримати персональний доступ до трекера</b>, підпишіться на наш офіційний канал результатів челенджу:`
              : `🏋️‍♂️ <b>Добро пожаловать в SMT Челлендж!</b>\n\n<b>СМТ (Сверхмощный тренинг)</b> — высокоэффективная система натурального силового тренинга:\n• 36 тренировок (12 недель, 4 микроцикла)\n• Рекомпозиция (сжигание жира и рост плотности мышц)\n• Отдых ровно 30 секунд\n\n⚠️ <i>Обратите внимание: программа требует предварительной физической подготовки либо прохождения 1–2 недельного вводного цикла.</i>\n\n🔒 <b>Чтобы получить доступ к трекеру</b>, подпишитесь на наш официальный канал результатов:`;

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
                    callback_data: startParam.startsWith("coach_")
                      ? `check_sub:${startParam.replace("coach_", "")}`
                      : "check_sub",
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
            ? `⚡️ <b>ЗОЛОТІ ПРАВИЛА СМТ-1 (Super-Power Training)</b>\n\n⚠️ <b>Підготовка обов'язкова:</b> для новачків необхідний 1–2 тижневий адаптаційний цикл перед стартом (жим 4×10-12, підтягування/тяга 4×10-12, присідання 4×10-12 зі скороченням пауз з 90с до 30с).\n\n1️⃣ <b>Відпочинок суворо 30 секунд:</b> між підходами та колами суперсетів пауза рівно 30 секунд. Якщо важко — зменшіть вагу, але тримайте темп!\n2️⃣ <b>Темп тренування:</b> 1 підхід = ~1 хвилина. Все тренування з 24 підходів триває 24–30 хвилин.\n3️⃣ <b>Два етапи прогресу:</b> Етап 1 — виконати всі підходи з відпочинком 30с. Етап 2 — додати +2.5 кг на наступне тренування.\n4️⃣ <b>Розрахунок ваг:</b> у налаштуваннях трекера є калькулятор 1ПМ і відсотків (40% база / 30% підсобка). Вправи можна замінювати на біомеханічно аналогічні (наприклад, присідання на жим ногами).`
            : `⚡️ <b>ЗОЛОТЫЕ ПРАВИЛА СМТ-1 (Super-Power Training)</b>\n\n⚠️ <b>Подготовка обязательна:</b> для новичков необходим 1–2 недельный адаптационный цикл перед стартом (жим 4×10-12, подтягивания/тяга 4×10-12, приседания 4×10-12 с сокращением пауз с 90с до 30с).\n\n1️⃣ <b>Отдых строго 30 секунд:</b> между подходами и кругами пауза ровно 30 секунд. Если тяжело — снизьте вес, но держите темп!\n2️⃣ <b>Темп тренировки:</b> 1 подход = ~1 минута. Вся тренировка из 24 подходов длится 24–30 минут.\n3️⃣ <b>Два этапа прогресса:</b> Этап 1 — закрыть все подходы с отдыхом 30с. Этап 2 — добавить +2.5 кг на следующую тренировку.\n4️⃣ <b>Расчет весов:</b> в настройках трекера встроен калькулятор 1ПМ и процентов (40% база / 30% подсобка). Упражнения можно заменять на биомеханически аналогичные (например, присед на жим платформы).`;

        await tgApi("sendMessage", {
          chat_id: chat.id,
          text: rulesMsg,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: lang === "uk" ? "⚡️ Відкрити SMT-1 Трекер" : "⚡️ Открыть SMT-1 Трекер",
                  web_app: {
                    url: APP_URL,
                  },
                },
              ],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }

      // Handle /coach command
      if (text.startsWith("/coach")) {
        const coachUser = (process.env.NEXT_PUBLIC_COACH_USERNAME || MASTER_COACH_USERNAME).replace(/^@/, "");
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
                  text: lang === "uk" ? "⚡️ Відкрити SMT-1 Трекер" : "⚡️ Открыть SMT-1 Трекер",
                  web_app: {
                    url: APP_URL,
                  },
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

      if (data && data.startsWith("check_sub")) {
        const isSubscribed = await isUserSubscribed(from.id);
        const lang = from.language_code === "uk" ? "uk" : "ru";

        if (isSubscribed) {
          await tgApi("answerCallbackQuery", {
            callback_query_id: id,
            text: lang === "uk" ? "🎉 Підписку підтверджено! Доступ відкрито." : "🎉 Подписка подтверждена! Доступ открыт.",
            show_alert: false,
          });

          if (message?.chat?.id) {
            const parts = data.split(":");
            const coachParam = parts[1] ? `?startapp=coach_${encodeURIComponent(parts[1])}` : "";
            const miniAppUrl = `${APP_URL}/${coachParam}`;

            await tgApi("sendMessage", {
              chat_id: message.chat.id,
              text:
                lang === "uk"
                  ? "✅ <b>Успішно!</b> Ваш доступ до SMT-1 активовано.\nТисніть кнопку нижче, щоб відкрити трекер на повний екран:"
                  : "✅ <b>Успешно!</b> Ваш доступ к SMT-1 активирован.\nЖмите кнопку ниже, чтобы открыть трекер на весь экран:",
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: lang === "uk" ? "⚡️ Відкрити SMT-1 Трекер" : "⚡️ Открыть SMT-1 Трекер",
                      web_app: {
                        url: miniAppUrl,
                      },
                    },
                  ],
                ],
              },
            });

            // Notify Coach strictly in personal PM (with deduplication)
            const isCoach = isCoachAccount(from.username, from.id);
            const lastAlertTime = recentBotLeads.get(from.id) || 0;
            const nowTime = Date.now();

            if (!isCoach && nowTime - lastAlertTime > BOT_LEAD_DEDUPE_MS) {
              recentBotLeads.set(from.id, nowTime);
              if (COACH_CHAT_ID) {
                const athleteTag = from.username ? `@${from.username}` : "";
                const leadAlert = [
                  `🎯 <b>НОВИЙ ПІДОПІЧНИЙ (ЛІД)!</b>`,
                  ``,
                  `👤 <b>Атлет:</b> ${from.first_name} ${athleteTag}`,
                  `📅 <b>Статус:</b> Підтвердив підписку на канал та перейшов до трекера!`,
                  from.username ? `💬 <i>Написати:</i> https://t.me/${from.username}` : "",
                ].filter(Boolean).join("\n");

                tgApi("sendMessage", {
                  chat_id: COACH_CHAT_ID,
                  text: leadAlert,
                  parse_mode: "HTML",
                }).catch(() => {});
              }
            }
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
    coachChatIdConfigured: Boolean(COACH_CHAT_ID),
    channel: CHANNEL_ID,
  });
}
