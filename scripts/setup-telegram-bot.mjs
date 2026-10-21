import fs from "fs";
import path from "path";

// Load .env.local if exists
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const val = values.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = val;
    }
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smt-tracker.vercel.app";

if (!BOT_TOKEN) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is not defined in .env.local");
  process.exit(1);
}

async function callTg(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}

async function setup() {
  console.log("🚀 Starting Programmatic Telegram Bot Setup...\n");

  // 1. Verify Bot
  const me = await callTg("getMe");
  if (!me.ok) {
    console.error("❌ Failed to connect to Telegram Bot API:", me);
    process.exit(1);
  }
  console.log(`✅ Connected as bot: @${me.result.username} (${me.result.first_name})`);

  // 2. Set Commands (Default & Ukrainian)
  const commandsUk = [
    { command: "start", description: "Запустити SMT-1 Трекер та Челендж" },
    { command: "app", description: "Відкрити персональний щоденник тренувань" },
    { command: "rules", description: "Золоті правила СМТ (Майк Казаков)" },
    { command: "coach", description: "Написати Головному Тренеру" },
    { command: "help", description: "Довідка по системі та додатку" },
  ];

  const commandsRu = [
    { command: "start", description: "Запустить SMT-1 Трекер и Челлендж" },
    { command: "app", description: "Открыть персональный дневник тренировок" },
    { command: "rules", description: "Золотые правила СМТ (Майк Казаков)" },
    { command: "coach", description: "Написать Главному Тренеру" },
    { command: "help", description: "Справка по системе и приложению" },
  ];

  const cmdResDefault = await callTg("setMyCommands", { commands: commandsUk });
  console.log("✅ Commands (Default/UK):", cmdResDefault.ok ? "Success" : cmdResDefault);

  const cmdResRu = await callTg("setMyCommands", { commands: commandsRu, language_code: "ru" });
  console.log("✅ Commands (RU):", cmdResRu.ok ? "Success" : cmdResRu);

  // 3. Set Description (Full text shown before clicking Start)
  const descUk =
    "Офіційний розумний трекер та 12-тижневий Челендж за легендарною методикою СМТ (Сверхмощный тренинг) Майка Казакова (форум Steelfactor).\n\n" +
    "⚡️ 36 тренувань • 4 мікроцикли\n" +
    "⏱ Відпочинок СУВОРО ДО 30 СЕКУНД (24 підходи = ~25 хв)\n" +
    "💪 Натуральна рекомпозиція (спалювання жиру та ріст м'язів)\n" +
    "🏆 Персональний розрахунок Індексу Атлетичності\n\n" +
    "Тисніть 'Розпочати', щоб забрати трекер та приєднатися до Челенджу!";

  const descRu =
    "Официальный умный трекер и 12-недельный Челлендж по легендарной методике СМТ (Сверхмощный тренинг) Майка Казакова (форум Steelfactor).\n\n" +
    "⚡️ 36 тренировок • 4 микроцикла\n" +
    "⏱ Отдых СТРОГО ДО 30 СЕКУНД (24 подхода = ~25 мин)\n" +
    "💪 Натуральная рекомпозиция (сжигание жира и рост мышц)\n" +
    "🏆 Персональный расчет Индекса Атлетичности\n\n" +
    "Жмите 'Начать', чтобы забрать трекер и присоединиться к Челленджу!";

  const descResUk = await callTg("setMyDescription", { description: descUk });
  console.log("✅ Description (Default/UK):", descResUk.ok ? "Success" : descResUk);

  const descResRu = await callTg("setMyDescription", { description: descRu, language_code: "ru" });
  console.log("✅ Description (RU):", descResRu.ok ? "Success" : descResRu);

  // 4. Set Short Description (Bio / About)
  const shortUk = "Розумний трекер СМТ-1 (30с відпочинок) та Челендж спільноти Майка Казакова.";
  const shortRu = "Умный трекер СМТ-1 (30с отдых) и Челлендж сообщества Майка Казакова.";

  const shortResUk = await callTg("setMyShortDescription", { short_description: shortUk });
  console.log("✅ Short Description (Default/UK):", shortResUk.ok ? "Success" : shortResUk);

  const shortResRu = await callTg("setMyShortDescription", { short_description: shortRu, language_code: "ru" });
  console.log("✅ Short Description (RU):", shortResRu.ok ? "Success" : shortResRu);

  // 5. Set Persistent Chat Menu Button (Launches Web App)
  const menuRes = await callTg("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "🚀 Трекер СМТ-1",
      web_app: { url: APP_URL },
    },
  });
  console.log(`✅ Menu Button (Web App -> ${APP_URL}):`, menuRes.ok ? "Success" : menuRes);

  console.log("\n🎉 Telegram Bot successfully configured programmatically!");
}

setup().catch(console.error);
