import { AppLanguage } from "@/types/body";

export interface HelpContent {
  modalTitle: string;
  modalSubtitle: string;
  tabs: Array<{ id: string; label: string }>;
  method: {
    heroTitle: string;
    heroDesc: string;
    restTitle: string;
    restDesc: string;
    safetyTitle: string;
    safetyDesc: string;
    rulesTitle: string;
    rules: string[];
  };
  exercises: {
    intro: string;
    blocks: Array<{
      title: string;
      badge: string;
      desc?: string;
      isSuperset?: boolean;
      exercises?: Array<{
        category: string;
        name: string;
        details: string;
      }>;
      footerNote?: string;
    }>;
  };
  cycles: {
    intro: string;
    items: Array<{
      title: string;
      badge: string;
      reps: string;
      mainWeight: string;
      accessoryWeight: string;
      desc: string;
    }>;
  };
  progression: {
    autoIncrementTitle: string;
    successTitle: string;
    successDesc: string;
    failTitle: string;
    failDesc: string;
    bodyTitle: string;
    bodyDesc: string;
    criteria: Array<{
      label: string;
      value: string;
      colorClass: string;
    }>;
  };
  app: {
    pwaTitle: string;
    pwaDesc: string;
    iosTitle: string;
    iosDesc: string;
    androidTitle: string;
    androidDesc: string;
    tmaTitle: string;
    tmaDesc: string;
    backupTitle: string;
    backupDesc: string;
    coachTitle: string;
    coachDesc: string;
  };
  footer: {
    guideNotice: string;
    closeBtn: string;
  };
}

export const helpContentData: Record<AppLanguage, HelpContent> = {
  uk: {
    modalTitle: "Довідка та Методика СМТ-1",
    modalSubtitle: "Повний посібник із системи Майка Казакова (Steelfactor) та функцій трекера",
    tabs: [
      { id: "method", label: "Методика СМТ" },
      { id: "exercises", label: "Схема вправ" },
      { id: "cycles", label: "4 Мікроцикли" },
      { id: "progression", label: "Прогресія та Заміри" },
      { id: "app", label: "Додаток та PWA" },
    ],
    method: {
      heroTitle: "Суть Надпотужного тренінгу (Майк Казаков / Steelfactor)",
      heroDesc:
        "СМТ (Надпотужний тренінг) — високощільна силова методика, спрямована на одночасну рекомпозицію тіла (спалювання підшкірного жиру при зростанні жорсткості та щільності м'язів), потужну капіляризацію та розвиток силової витривалості.",
      restTitle: "Відпочинок суворо 30 секунд",
      restDesc:
        "Між підходами та колами пауза становить рівно 30 секунд. Це не дозволяє лактату повністю розсіятися і викликає максимальний анаболічний гормональний відгук (викид соматотропіну).",
      safetyTitle: "Безпечні робочі ваги (40–55%)",
      safetyDesc:
        "Ваги розраховуються від разового максимуму (1ПМ). Помірний тоннаж захищає суглоби та сухожилля, перетворюючи стимул на глибоке м'язове накачування та витривалість.",
      rulesTitle: "⚡️ Золоті правила Майка Казакова:",
      rules: [
        "Етап 1: завершити тренування з відпочинком суворо до 30 секунд. Етап 2: додати +2.5 кг. Без першого етапу немає СМТ!",
        "Темп тренування: 1 підхід = ~1 хвилина. Все тренування з 24 підходів триває 24–30 хвилин.",
        "Якщо важко — знизьте робочу вагу, але в жодному разі не розтягуйте паузу відпочинку. СМТ працює саме завдяки безперервній високій щільності.",
      ],
    },
    exercises: {
      intro:
        "Комплекс вправ у СМТ-1 залишається незмінним упродовж усіх 36 тренувань! Це формує бездоганну рухову навичку та стабільну силову прогресію.",
      blocks: [
        {
          title: "Блок 1: Жим штанги лежачи",
          badge: "Одиночний блок • 4 підходи",
          desc: "Базовий грудний жим. 4 підходи за планом мікроциклу (10/8/6/4 повт) з вагою 40–55% від 1ПМ. Відпочинок між сетами: рівно 30 секунд.",
        },
        {
          title: "Блок 2: Жим штанги вузьким хватом",
          badge: "Одиночний блок • 4 підходи",
          desc: "Акцент на трицепс та передню дельту. 4 підходи за планом мікроциклу з паузами суворо 30 секунд.",
        },
        {
          title: "Блок 3: Суперсет 1 (Спина + Біцепс)",
          badge: "4 Кола",
          isSuperset: true,
          exercises: [
            { category: "ОСНОВНЕ (40%)", name: "Підтягування", details: "10 повт • 40% 1ПМ" },
            { category: "ПІДСОБКА (30%)", name: "Згинання рук зі штангою", details: "15 повт • 30% 1ПМ" },
          ],
          footerNote: "Порядок: Підтягування (10) → відпочинок 30с → Біцепс (15) → відпочинок 30с → наступне коло.",
        },
        {
          title: "Блок 4: Суперсет 2 (Ноги + Плечі)",
          badge: "4 Кола",
          isSuperset: true,
          exercises: [
            { category: "ОСНОВНЕ (40%)", name: "Присідання зі штангою", details: "10 повт • 40% 1ПМ" },
            { category: "ПІДСОБКА (30%)", name: "Армійський жим стоячи", details: "15 повт • 30% 1ПМ" },
          ],
          footerNote: "Аналогічно першому суперсету: 4 кола з роздільними вагами та паузою 30 секунд.",
        },
      ],
    },
    cycles: {
      intro:
        "Програма розрахована на 12 тижнів (36 тренувань у режимі 3 рази на тиждень: Пн-Ср-Пт). Вона ділиться на 4 прогресивні мікроцикли:",
      items: [
        {
          title: "МКЦ-1: Втягування",
          badge: "Тр 1 – 9",
          reps: "4 підходи по 10 повторень",
          mainWeight: "Основне: 40% від 1ПМ",
          accessoryWeight: "Підсобка: 30% (15 повт)",
          desc: "Адаптація серцево-судинної системи, капіляризація, напрацювання дихання та темпу.",
        },
        {
          title: "МКЦ-2: Набір щільності",
          badge: "Тр 10 – 18",
          reps: "4 підходи по 8 повторень",
          mainWeight: "Основне: 45% від 1ПМ",
          accessoryWeight: "Підсобка: 35% (12 повт)",
          desc: "Зростання щільності м'язового волокна, підвищення робочої ваги.",
        },
        {
          title: "МКЦ-3: Гіпертрофія",
          badge: "Тр 19 – 27",
          reps: "4 підходи по 6 повторень",
          mainWeight: "Основне: 50% від 1ПМ",
          accessoryWeight: "Підсобка: 40% (10 повт)",
          desc: "Потужна міофібрилярна гіпертрофія на тлі скороченого відпочинку.",
        },
        {
          title: "МКЦ-4: Силовий пік",
          badge: "Тр 28 – 36",
          reps: "4 підходи по 4 повторення",
          mainWeight: "Основне: 55% від 1ПМ",
          accessoryWeight: "Підсобка: 45% (8 повт)",
          desc: "Фінал програми, максимальна жорсткість м'язів та пікова витривалість.",
        },
      ],
    },
    progression: {
      autoIncrementTitle: "Автоприбавка ваги (+2.5 кг)",
      successTitle: "Успіх:",
      successDesc:
        "Якщо в усіх 4 підходах кожної вправи виконано задану кількість повторень, на наступне тренування розрахунковий 1ПМ автоматично збільшиться на +2.5 кг (налаштовується в Налаштуваннях).",
      failTitle: "Зрив:",
      failDesc:
        "Якщо ви зробили хоча б в одному підході менше повторень (наприклад, 8 з 10), вага не зростає. Наступне тренування проводиться з тими самими вагами.",
      bodyTitle: "Контроль тіла (Заміри)",
      bodyDesc:
        "На СМТ вага на вагах може стояти на місці через одночасне спалювання жиру та зростання м'язової тканини. Тому головний показник — сантиметрова стрічка!",
      criteria: [
        { label: "Критерій успіху", value: "Талія зменшується", colorClass: "text-emerald-400" },
        { label: "Критерій успіху", value: "Біцепс / груди ростуть", colorClass: "text-cyan-400" },
        { label: "Рекомендована частота", value: "1 раз на 1-2 тижні", colorClass: "text-white" },
      ],
    },
    app: {
      pwaTitle: "Встановлення як додаток (PWA)",
      pwaDesc: "Додаток працює на весь екран без панелей браузера навіть без доступу до інтернету:",
      iosTitle: "📱 На iPhone (iOS Safari):",
      iosDesc: "Натисніть значок «Поділитися» (квадрат зі стрілкою вгору) → виберіть «На початковий екран» → натисніть «Додати».",
      androidTitle: "🤖 На Android (Google Chrome):",
      androidDesc: "Натисніть меню «⋮» у правому верхньому кутку → виберіть «Встановити додаток».",
      tmaTitle: "✈️ Telegram Mini App та Бот:",
      tmaDesc: "Всередині Telegram кольори адаптуються під вашу тему, а при відмітці підходів працює нативна тактильна вібрація (TMA Haptics).",
      backupTitle: "Резервне копіювання та збереження даних",
      backupDesc:
        "Усі дані зберігаються на вашому пристрої (Local-First). У розділі Налаштування ви можете в будь-який момент натиснути «Експорт у JSON», щоб зберегти файл бекапу або перенести весь прогрес на новий телефон.",
      coachTitle: "Прямий зв'язок із тренером",
      coachDesc:
        "Після завершення тренування звіт автоматично відправляється Головному Тренеру через офіційного бота без відкриття сторонніх вкладок.",
    },
    footer: {
      guideNotice: "Повний файл довідки доступний у репозиторії: SMT_GUIDE.md",
      closeBtn: "Зрозуміло",
    },
  },
  ru: {
    modalTitle: "Справка и Методика СМТ-1",
    modalSubtitle: "Полное руководство по системе Майка Казакова (Steelfactor) и функциям трекера",
    tabs: [
      { id: "method", label: "Методика СМТ" },
      { id: "exercises", label: "Схема упражнений" },
      { id: "cycles", label: "4 Микроцикла" },
      { id: "progression", label: "Прогрессия и Замеры" },
      { id: "app", label: "Приложение и PWA" },
    ],
    method: {
      heroTitle: "Суть Сверхмощного тренинга (Майк Казаков / Steelfactor)",
      heroDesc:
        "СМТ (Сверхмощный тренинг) — высокоплотная силовая методика, направленная на одновременную рекомпозицию тела (сжигание подкожного жира при росте жесткости и плотности мышц), мощную капилляризацию и развитие силовой выносливости.",
      restTitle: "Отдых строго 30 секунд",
      restDesc:
        "Между подходами и кругами пауза составляет ровно 30 секунд. Это не позволяет лактату полностью рассеяться и вызывает максимальный анаболический гормональный отклик (выброс соматотропина).",
      safetyTitle: "Безопасные рабочие веса (40–55%)",
      safetyDesc:
        "Веса рассчитываются от разового максимума (1ПМ). Умеренный тоннаж защищает суставы и сухожилия, переводя стимул в глубокую мышечную накачку и выносливость.",
      rulesTitle: "⚡️ Золотые правила Майка Казакова:",
      rules: [
        "Этап 1: закрыть тренировку с отдыхом строго до 30 секунд. Этап 2: добавить +2.5 кг. Без первого этапа нет СМТ!",
        "Темп тренировки: 1 подход = ~1 минута. Вся тренировка из 24 подходов длится 24–30 минут.",
        "Если тяжело — снизьте рабочий вес, но ни в коем случае не растягивайте паузу. СМТ работает именно за счет непрерывной высокой плотности.",
      ],
    },
    exercises: {
      intro:
        "Комплекс упражнений в СМТ-1 остается неизменным на протяжении всех 36 тренировок! Это формирует безупречный двигательный навык и стабильную силовую прогрессию.",
      blocks: [
        {
          title: "Блок 1: Жим штанги лежа",
          badge: "Одиночный блок • 4 подхода",
          desc: "Базовый грудной жим. 4 подхода по плану микроцикла (10/8/6/4 повт) с весом 40–55% от 1ПМ. Отдых между подходами: ровно 30 секунд.",
        },
        {
          title: "Блок 2: Жим штанги узким хватом",
          badge: "Одиночный блок • 4 подхода",
          desc: "Акцент на трицепс и переднюю дельту. 4 подхода по плану микроцикла с паузами строго 30 секунд.",
        },
        {
          title: "Блок 3: Суперсет 1 (Спина + Бицепс)",
          badge: "4 Круга",
          isSuperset: true,
          exercises: [
            { category: "ОСНОВНОЕ (40%)", name: "Подтягивания", details: "10 повт • 40% 1ПМ" },
            { category: "ПОДСОБКА (30%)", name: "Штанга на бицепс", details: "15 повт • 30% 1ПМ" },
          ],
          footerNote: "Порядок: Подтягивания (10) → отдых 30с → Бицепс (15) → отдых 30с → следующий круг.",
        },
        {
          title: "Блок 4: Суперсет 2 (Ноги + Плечи)",
          badge: "4 Круга",
          isSuperset: true,
          exercises: [
            { category: "ОСНОВНОЕ (40%)", name: "Приседания со штангой", details: "10 повт • 40% 1ПМ" },
            { category: "ПОДСОБКА (30%)", name: "Армейский жим стоя", details: "15 повт • 30% 1ПМ" },
          ],
          footerNote: "Аналогично первому суперсету: 4 круга с раздельными весами и отдыхом 30 секунд.",
        },
      ],
    },
    cycles: {
      intro:
        "Программа рассчитана на 12 недель (36 тренировок при режиме 3 раза в неделю: Пн-Ср-Пт). Она делится на 4 прогрессирующих микроцикла:",
      items: [
        {
          title: "МКЦ-1: Вкатывание",
          badge: "Тр 1 – 9",
          reps: "4 подхода по 10 повторений",
          mainWeight: "Основное: 40% от 1ПМ",
          accessoryWeight: "Подсобка: 30% (15 повт)",
          desc: "Адаптация ССС, капилляризация, наработка дыхания и темпа.",
        },
        {
          title: "МКЦ-2: Набор плотности",
          badge: "Тр 10 – 18",
          reps: "4 подхода по 8 повторений",
          mainWeight: "Основное: 45% от 1ПМ",
          accessoryWeight: "Подсобка: 35% (12 повт)",
          desc: "Рост плотности мышечного волокна, повышение рабочего веса.",
        },
        {
          title: "МКЦ-3: Гипертрофия",
          badge: "Тр 19 – 27",
          reps: "4 подхода по 6 повторений",
          mainWeight: "Основное: 50% от 1ПМ",
          accessoryWeight: "Подсобка: 40% (10 повт)",
          desc: "Мощная миофибриллярная гипертрофия на фоне сокращенного отдыха.",
        },
        {
          title: "МКЦ-4: Силовой пик",
          badge: "Тр 28 – 36",
          reps: "4 подхода по 4 повторения",
          mainWeight: "Основное: 55% от 1ПМ",
          accessoryWeight: "Подсобка: 45% (8 повт)",
          desc: "Финал программы, максимальная жесткость мускулов и пиковая выносливость.",
        },
      ],
    },
    progression: {
      autoIncrementTitle: "Автоприбавка веса (+2.5 кг)",
      successTitle: "Успех:",
      successDesc:
        "Если во всех 4 подходах каждого упражнения выполнено заданное количество повторений, на следующую тренировку расчетный 1ПМ автоматически вырастет на +2.5 кг (настраивается в Настройках).",
      failTitle: "Срыв:",
      failDesc:
        "Если вы сделали хотя бы в одном подходе меньше повторений (например, 8 из 10), вес не растет. Следующая тренировка проводится с теми же весами.",
      bodyTitle: "Контроль тела (Замеры)",
      bodyDesc:
        "На СМТ вес на весах может стоять на месте из-за одновременного сжигания жира и роста мышечной ткани. Поэтому главный показатель — сантиметровая лента!",
      criteria: [
        { label: "Критерий успеха", value: "Талия уменьшается", colorClass: "text-emerald-400" },
        { label: "Критерий успеха", value: "Бицепс / грудь растут", colorClass: "text-cyan-400" },
        { label: "Рекомендуемая частота", value: "1 раз в 1-2 недели", colorClass: "text-white" },
      ],
    },
    app: {
      pwaTitle: "Установка как приложение (PWA)",
      pwaDesc: "Приложение работает во весь экран без браузерных панелей даже без интернета:",
      iosTitle: "📱 На iPhone (iOS Safari):",
      iosDesc: "Нажмите иконку «Поделиться» (квадрат со стрелкой вверх) → выберите «На экран \"Домой\"» → нажмите «Добавить».",
      androidTitle: "🤖 На Android (Google Chrome):",
      androidDesc: "Нажмите меню «⋮» в правом верхнем углу → выберите «Установить приложение».",
      tmaTitle: "✈️ Telegram Mini App и Бот:",
      tmaDesc: "Внутри Telegram цвета адаптируются под вашу тему, а при отметке подходов работает нативная тактильная отдача (вибрация TMA Haptics).",
      backupTitle: "Резервное копирование и сохранность данных",
      backupDesc:
        "Все данные хранятся на вашем устройстве (Local-First). В разделе Настройки вы можете в любой момент нажать «Экспорт в JSON», чтобы сохранить файл бэкапа или перенести весь прогресс на новый телефон.",
      coachTitle: "Прямая связь с тренером",
      coachDesc:
        "После завершения тренировки отчет автоматически доставляется Главному Тренеру через официального бота без открытия сторонних вкладок.",
    },
    footer: {
      guideNotice: "Подробный файл справки доступен в репозитории: SMT_GUIDE.md",
      closeBtn: "Понятно",
    },
  },
  en: {
    modalTitle: "SMT-1 Method & Guide",
    modalSubtitle: "Complete guide to Mike Kazakov's (Steelfactor) system and tracker features",
    tabs: [
      { id: "method", label: "SMT Method" },
      { id: "exercises", label: "Exercise Scheme" },
      { id: "cycles", label: "4 Microcycles" },
      { id: "progression", label: "Progression & Body" },
      { id: "app", label: "App & PWA" },
    ],
    method: {
      heroTitle: "Super-Power Training Philosophy (Mike Kazakov / Steelfactor)",
      heroDesc:
        "SMT (Super-Power Training) is a high-density strength methodology designed for simultaneous body recomposition (burning fat while increasing muscle density and hardness), capillary expansion, and supreme strength endurance.",
      restTitle: "Strict 30-Second Rest Intervals",
      restDesc:
        "Rest between sets and superset rounds is exactly 30 seconds. This maintains high lactate levels and triggers maximal anabolic hormonal response (growth hormone release).",
      safetyTitle: "Safe Working Weights (40–55%)",
      safetyDesc:
        "Loads are calculated from your 1-Rep Max (1RM). Moderate tonnage protects joints and tendons while driving intense muscle hypertrophy and endurance.",
      rulesTitle: "⚡️ Mike Kazakov's Golden Rules:",
      rules: [
        "Stage 1: complete the entire workout strictly keeping rest under 30 seconds. Stage 2: add +2.5 kg. Without Stage 1, it is not SMT!",
        "Workout pace: 1 set = ~1 minute. A full 24-set workout takes 24–30 minutes.",
        "If it feels too heavy, reduce the weight, but never prolong the rest interval. SMT works solely because of continuous density.",
      ],
    },
    exercises: {
      intro:
        "The exercise selection in SMT-1 remains unchanged across all 36 workouts! This builds flawless motor patterns and consistent progression.",
      blocks: [
        {
          title: "Block 1: Barbell Bench Press",
          badge: "Single Block • 4 Sets",
          desc: "Foundational chest press. 4 sets according to current microcycle (10/8/6/4 reps) at 40–55% of 1RM. Rest: strictly 30s.",
        },
        {
          title: "Block 2: Close-Grip Bench Press",
          badge: "Single Block • 4 Sets",
          desc: "Triceps and front deltoids focus. 4 sets according to microcycle with strict 30s rest.",
        },
        {
          title: "Block 3: Superset 1 (Back + Biceps)",
          badge: "4 Rounds",
          isSuperset: true,
          exercises: [
            { category: "PRIMARY (40%)", name: "Pull-ups", details: "10 reps • 40% 1RM" },
            { category: "ACCESSORY (30%)", name: "Barbell Bicep Curl", details: "15 reps • 30% 1RM" },
          ],
          footerNote: "Order: Pull-ups (10) → 30s rest → Bicep Curls (15) → 30s rest → next round.",
        },
        {
          title: "Block 4: Superset 2 (Legs + Delts)",
          badge: "4 Rounds",
          isSuperset: true,
          exercises: [
            { category: "PRIMARY (40%)", name: "Barbell Back Squat", details: "10 reps • 40% 1RM" },
            { category: "ACCESSORY (30%)", name: "Military Overhead Press", details: "15 reps • 30% 1RM" },
          ],
          footerNote: "Same as superset 1: 4 rounds with distinct weights and 30s rest.",
        },
      ],
    },
    cycles: {
      intro:
        "The program spans 12 weeks (36 workouts at 3 sessions/week: Mon-Wed-Fri), divided into 4 progressive microcycles:",
      items: [
        {
          title: "MC-1: Foundation & Conditioning",
          badge: "Workouts 1 – 9",
          reps: "4 sets of 10 reps",
          mainWeight: "Primary: 40% of 1RM",
          accessoryWeight: "Accessory: 30% (15 reps)",
          desc: "Cardiovascular adaptation, capillarization, breathing and pacing conditioning.",
        },
        {
          title: "MC-2: Density Building",
          badge: "Workouts 10 – 18",
          reps: "4 sets of 8 reps",
          mainWeight: "Primary: 45% of 1RM",
          accessoryWeight: "Accessory: 35% (12 reps)",
          desc: "Muscle fiber density accumulation and steady load increase.",
        },
        {
          title: "MC-3: Hypertrophy",
          badge: "Workouts 19 – 27",
          reps: "4 sets of 6 reps",
          mainWeight: "Primary: 50% of 1RM",
          accessoryWeight: "Accessory: 40% (10 reps)",
          desc: "Potent myofibrillar hypertrophy driven by shortened recovery.",
        },
        {
          title: "MC-4: Strength Peak",
          badge: "Workouts 28 – 36",
          reps: "4 sets of 4 reps",
          mainWeight: "Primary: 55% of 1RM",
          accessoryWeight: "Accessory: 45% (8 reps)",
          desc: "Program finale, maximum muscular hardness and peak conditioning.",
        },
      ],
    },
    progression: {
      autoIncrementTitle: "Weight Auto-Increment (+2.5 kg)",
      successTitle: "Success:",
      successDesc:
        "If all 4 sets of every exercise hit target reps, estimated 1RM increases by +2.5 kg for the next workout (customizable in Settings).",
      failTitle: "Plateau / Miss:",
      failDesc:
        "If any set misses reps (e.g., 8 out of 10), weights stay the same for the next session.",
      bodyTitle: "Body Composition Tracking",
      bodyDesc:
        "Scale weight might stay flat due to concurrent fat loss and muscle gain. Use a measuring tape as your primary metric!",
      criteria: [
        { label: "Success Metric", value: "Waist shrinks", colorClass: "text-emerald-400" },
        { label: "Success Metric", value: "Biceps / Chest grow", colorClass: "text-cyan-400" },
        { label: "Frequency", value: "Every 1–2 weeks", colorClass: "text-white" },
      ],
    },
    app: {
      pwaTitle: "Install as App (PWA)",
      pwaDesc: "Runs fullscreen without browser bars, even offline:",
      iosTitle: "📱 On iPhone (iOS Safari):",
      iosDesc: "Tap 'Share' (box with arrow up) → select 'Add to Home Screen' → tap 'Add'.",
      androidTitle: "🤖 On Android (Google Chrome):",
      androidDesc: "Tap the '⋮' menu in top right → select 'Install app'.",
      tmaTitle: "✈️ Telegram Mini App & Bot:",
      tmaDesc: "Seamless theme sync in Telegram and native haptic feedback during set completion.",
      backupTitle: "Data Safety & Backups",
      backupDesc:
        "All data is stored locally on your device (Local-First). Export to JSON anytime from Settings to backup or transfer to a new device.",
      coachTitle: "Direct Coach Reports",
      coachDesc:
        "Finished workouts are delivered directly to the Master Coach via the official bot without opening browser tabs.",
    },
    footer: {
      guideNotice: "Full markdown reference available in repository: SMT_GUIDE.md",
      closeBtn: "Understood",
    },
  },
};

export function getHelpContent(lang: AppLanguage): HelpContent {
  return helpContentData[lang] || helpContentData.uk;
}
