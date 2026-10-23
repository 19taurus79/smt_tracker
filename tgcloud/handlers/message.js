import { api } from "sdk";

export default async function (message, ctx) {
  const chatId = message.chat.id;
  const text = message.text || "";

  const fromUser = message.from;
  const isCoach = fromUser && (fromUser.id === 548019148 || fromUser.username?.toLowerCase() === "onyshchenkosergey");

  if (text.startsWith("/start") || text.startsWith("/app")) {
    if (fromUser && !isCoach) {
      try {
        await api.sendMessage({
          chat_id: 548019148,
          text: `🎯 <b>НОВИЙ АТЛЕТ ЗАПУСТИВ БОТА!</b>\n\n👤 <b>Атлет:</b> ${fromUser.first_name || "Атлет"} ${fromUser.username ? `(@${fromUser.username})` : ""}\n⚡️ <i>Натиснув /start та відкрив SMT-1</i>\n━━━━━━━━━━━━━━━━━━\n💬 <i>Написати:</i> https://t.me/${fromUser.username || ""}`,
          parse_mode: "HTML",
        });
      } catch (err) {
        console.error("Failed to notify coach on start:", err);
      }
    }

    const lines = [
      "🔥 <b>Вітаємо в SMT-1 Tracker!</b>",
      "",
      "⚡️ <b>СМТ-1 (Високощільний тренінг)</b> — 36 тренувань, відпочинок суворо 30 секунд.",
      "",
      "Тисніть кнопку нижче, щоб відкрити трекер на повний екран:",
    ];

    await api.sendMessage({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⚡️ Відкрити SMT-1 Трекер",
              web_app: {
                url: "https://smt-tracker.vercel.app",
              },
            },
          ],
          [
            {
              text: "🏆 Канал Результатів та Челенджу",
              url: "https://t.me/athletic_league",
            },
          ],
        ],
      },
    });
    return;
  }

  if (text.startsWith("/coach")) {
    await api.sendMessage({
      chat_id: chatId,
      text: "👤 <b>Головний Тренер Челенджу:</b> @OnyshchenkoSergey\n\nВи можете надіслати запитання щодо техніки, підбору робочих ваг або харчування:",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💬 Написати Тренеру",
              url: "https://t.me/OnyshchenkoSergey",
            },
          ],
        ],
      },
    });
    return;
  }

  if (text.startsWith("/results") || text.startsWith("/channel")) {
    const lines = [
      "🏆 <b>Офіційний Канал Результатів та Челенджу СМТ:</b>",
      "",
      "Тут публікуються щоденні звіти атлетів, рейтинг Індексу Атлетичності, спільний тоннаж ліги та поради Головного Тренера.",
      "",
      "👇 <i>Приєднуйтесь до каналу та слідкуйте за успіхами команди:</i>",
    ];

    await api.sendMessage({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🏆 Перейти в Канал Результатів",
              url: "https://t.me/athletic_league",
            },
          ],
          [
            {
              text: "⚡️ Відкрити SMT-1 Трекер",
              web_app: {
                url: "https://smt-tracker.vercel.app",
              },
            },
          ],
        ],
      },
    });
    return;
  }

  if (text.startsWith("/rules")) {
    const rules = [
      "📜 <b>ЗОЛОТІ ПРАВИЛА СМТ-1:</b>",
      "",
      "1. ⏱ <b>Відпочинок між підходами</b> — суворо до 30 секунд.",
      "2. ⚡️ <b>Тривалість тренування</b> — 24-30 хвилин (24 підходи).",
      "3. ⚖️ <b>Прогресія ваг</b> — якщо виконано всі повторення, додаємо +2.5 кг на наступне тренування.",
      "4. 🏆 <b>Індекс Атлетичності</b> — розраховується автоматично за тоннажем та щільністю роботи.",
    ];

    await api.sendMessage({
      chat_id: chatId,
      text: rules.join("\n"),
      parse_mode: "HTML",
    });
    return;
  }
}
