import { AppLanguage } from "@/types/body";

export interface HelpContent {
  modalTitle: string;
  modalSubtitle: string;
  tabs: Array<{ id: string; label: string }>;
  method: {
    heroTitle: string;
    heroDesc: string;
    warningTitle: string;
    warningDesc: string;
    restTitle: string;
    restDesc: string;
    safetyTitle: string;
    safetyDesc: string;
    rulesTitle: string;
    rules: string[];
  };
  prep: {
    title: string;
    badge: string;
    desc: string;
    whyTitle: string;
    whyDesc: string;
    schemeTitle: string;
    exercises: Array<{
      name: string;
      scheme: string;
      notes: string;
    }>;
    restProgressionTitle: string;
    restProgression: Array<{
      workout: string;
      rest: string;
      desc: string;
    }>;
    calcTitle: string;
    calcDesc: string;
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
    substitutionsTitle: string;
    substitutionsIntro: string;
    substitutions: Array<{
      original: string;
      alternatives: string;
      reason: string;
    }>;
    calcHowToTitle: string;
    calcHowToDesc: string;
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
    modalSubtitle: "Повний посібник із системи Сверхмощного тренінгу та функцій трекера",
    tabs: [
      { id: "method", label: "Методика СМТ" },
      { id: "prep", label: "Підготовчий цикл" },
      { id: "exercises", label: "Схема вправ" },
      { id: "cycles", label: "4 Мікроцикли" },
      { id: "progression", label: "Прогресія та Заміри" },
      { id: "app", label: "Додаток та PWA" },
    ],
    method: {
      heroTitle: "Суть Надпотужного високощільного тренінгу (СМТ-1)",
      heroDesc:
        "СМТ (Надпотужний тренінг) — високощільна силова методика, спрямована на одночасну рекомпозицію тіла (спалювання підшкірного жиру при зростанні жорсткості та щільності м'язів), глибоку капіляризацію та розвиток функціональної силової витривалості.",
      warningTitle: "⚠️ Важливе застереження: програма НЕ для новачків без підготовки!",
      warningDesc:
        "СМТ-1 — це безперервна робота з паузами суворо 30 секунд. 24 робочі підходи виконуються за 24–30 хвилин. Для неподготовленого серця, зв'язок та ЦНС такий обсяг загрожує перевтомою або травмою. Якщо у вас була перерва в тренуваннях — обов'язково пройдіть 1–2 тижневий підготовчий цикл (вкладка «Підготовчий цикл») перед стартом СМТ-1!",
      restTitle: "Відпочинок суворо 30 секунд",
      restDesc:
        "Між підходами та колами пауза становить рівно 30 секунд. Це не дозволяє лактату повністю розсіятися і викликає максимальний анаболічний гормональний відгук (викид соматотропіну).",
      safetyTitle: "Безпечні робочі ваги (40–55%)",
      safetyDesc:
        "Ваги розраховуються від разового максимуму (1ПМ). Помірний тоннаж захищає суглоби та сухожилля, перетворюючи стимул на глибоке м'язове накачування та витривалість.",
      rulesTitle: "⚡️ Золоті правила СМТ:",
      rules: [
        "Етап 1: завершити тренування з відпочинком суворо до 30 секунд. Етап 2: додати +2.5 кг. Без першого етапу немає СМТ!",
        "Темп тренування: 1 підхід = ~1 хвилина. Все тренування з 24 підходів триває 24–30 хвилин.",
        "Якщо важко — знизьте робочу вагу, але в жодному разі не розтягуйте паузу відпочинку. СМТ працює саме завдяки безперервній високій щільності.",
      ],
    },
    prep: {
      title: "Підготовчий цикл (Адаптація 1–2 тижні)",
      badge: "3–6 тренувань • Вхід у режим",
      desc: "Якщо ви не тренувалися регулярно останні 2–3 місяці або не звикли до високої щільності — цей цикл підготує серцево-судинну систему, зв'язковий апарат та визначить точні стартові ваги.",
      whyTitle: "🎯 Навіщо потрібна підготовка:",
      whyDesc:
        "1. Адаптувати серцевий ритм та судини до швидкого відновлення між сетами.\n2. Зміцнити сухожилля перед серійним навантаженням СМТ.\n3. Точно визначити робочу вагу на 10–12 повторень для розрахунку 1ПМ.",
      schemeTitle: "📋 Комплекс підготовчого тренування (3 базові вправи):",
      exercises: [
        {
          name: "1. Жим штанги або гантелей лежачи",
          scheme: "4 підходи × 10–12 повторень",
          notes: "Базовий жим з підконтрольним опусканням. Зафіксуйте робочу вагу, з якою чисто виконуєте 10–12 повторів.",
        },
        {
          name: "2. Підтягування або тяга верхнього блоку",
          scheme: "4 підходи × 10–12 повторень",
          notes: "Тяга до верхньої частини грудей. Якщо власна вага завелика — використовуйте гравітрон або верхній блок.",
        },
        {
          name: "3. Присідання зі штангою або жим платформи ногами",
          scheme: "4 підходи × 10–12 повторень",
          notes: "Жим ногами в тренажері або присідання в помірну глибину без відмови у попереку.",
        },
      ],
      restProgressionTitle: "⏱ Протокол поступового скорочення відпочинку:",
      restProgression: [
        { workout: "Тренування 1", rest: "90 секунд (1.5 хв)", desc: "Спокійний вхід, фокус на правильній траєкторії та підборі ваги." },
        { workout: "Тренування 2", rest: "75 секунд", desc: "Контроль дихання та перше відчуття щільності." },
        { workout: "Тренування 3", rest: "60 секунд (1 хв)", desc: "Серцево-судинна система вмикається в активне відновлення." },
        { workout: "Тренування 4–6", rest: "45 → 30 секунд", desc: "Бойовий темп СМТ. Ваше тіло готове до основного 12-тижневого курсу!" },
      ],
      calcTitle: "🧮 Як розрахувати стартові ваги після підготовки:",
      calcDesc:
        "Візьміть робочу вагу, з якою ви виконували 10 повторень у підготовці. Введіть її у калькулятор (кнопка нижче або в меню Налаштувань). Програма порахує ваш 1ПМ і автоматично виставить 40% для базових блоків і 30% для підсобних.",
    },
    exercises: {
      intro:
        "Комплекс вправ у СМТ-1 складається з 2 одиночних блоків та 2 парних суперсетів. Ви можете замінювати вправи на біомеханічно еквівалентні під своє обладнання, але баланс м'язових груп повинен залишатися незмінним!",
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
          badge: "Суперсет • 4 кола",
          isSuperset: true,
          exercises: [
            {
              category: "Основна",
              name: "Підтягування (або тяга блоку)",
              details: "40% 1ПМ • 10 повт • пауза 30с після вправи",
            },
            {
              category: "Підсобка",
              name: "Згинання на біцепс зі штангою",
              details: "30% 1ПМ • 15 повт • пауза 30с перед наступним колом",
            },
          ],
        },
        {
          title: "Блок 4: Суперсет 2 (Ноги + Плечі)",
          badge: "Суперсет • 4 кола",
          isSuperset: true,
          exercises: [
            {
              category: "Основна",
              name: "Присідання зі штангою (або жим ногами)",
              details: "40% 1ПМ • 10 повт • пауза 30с після вправи",
            },
            {
              category: "Підсобка",
              name: "Армійський жим стоячи (плечі)",
              details: "30% 1ПМ • 15 повт • пауза 30с перед наступним колом",
            },
          ],
        },
      ],
      substitutionsTitle: "🔄 Взаємозамінність вправ (як налаштувати під свій зал)",
      substitutionsIntro:
        "Не змінюйте суть тренування кардинально (наприклад, не ставте біцепс замість присідань). Замінюйте тільки на біомеханічні аналоги:",
      substitutions: [
        {
          original: "Жим штанги лежачи",
          alternatives: "Жим гантелей на горизонтальній лаві, жим у тренажері Сміта, віджимання на брусах з обтяженням.",
          reason: "Зберігається кут жиму та навантаження на великий грудний м'яз.",
        },
        {
          original: "Жим вузьким хватом",
          alternatives: "Французький жим зі штангою/гантелями, віджимання на брусах (акцент на трицепс), розгинання на блоці донизу.",
          reason: "Ізольоване та безпечне навантаження на трицепс із швидким переходом між сетами.",
        },
        {
          original: "Підтягування на перекладині",
          alternatives: "Тяга верхнього блоку до грудей, тяга Т-грифу, тяга штанги в нахилі, тяга гантелі до поясу.",
          reason: "Вертикальна або горизонтальна тяга для найширших м'язів спини без перевантаження попереку.",
        },
        {
          original: "Штанга на біцепс",
          alternatives: "Підйом гантелей із супінацією, згинання на лаві Скотта, молоткові згинання (hammer curls).",
          reason: "Підсобна ізоляція двоголового м'яза плеча з високою памп-активністю.",
        },
        {
          original: "Присідання зі штангою",
          alternatives: "Жим платформи ногами, гакк-присідання, кубкові присідання з гантеллю (гоблет).",
          reason: "Якщо є проблеми з хребтом або колінами — жим платформою ідеально замінює присідання при 30с відпочинку.",
        },
        {
          original: "Армійський жим стоячи",
          alternatives: "Жим гантелей сидячи, жим штанги сидячи з грудей, махи гантелями в сторони.",
          reason: "Навантаження на середній та передній пучки дельтоподібних м'язів.",
        },
      ],
      calcHowToTitle: "⚙️ Де налаштувати свої вправи та ваги в додатку:",
      calcHowToDesc:
        "Відкрийте вкладку «Програма» → натисніть кнопку «Налаштувати програму» (або в «Налаштуваннях»). Там ви можете змінити назви вправ під свій інвентар, відкрити калькулятор 1ПМ для кожної вправи та автоматично перерахувати стартові ваги на всі 36 тренувань.",
    },
    cycles: {
      intro:
        "12 тижнів розбито на 4 мікроцикли по 9 тренувань. Кожен мікроцикл цілеспрямовано змінює діапазон повторень та робочу вагу:",
      items: [
        {
          title: "Мікроцикл 1 (Тренування 1–9)",
          badge: "40% / 30% • 10 / 15 повт",
          reps: "Базові: 4×10 • Підсобні: 4×15",
          mainWeight: "40% від 1ПМ",
          accessoryWeight: "30% від 1ПМ",
          desc: "Адаптація та капіляризація. Навчання серця та м'язів тримати строгий 30-секундний темп.",
        },
        {
          title: "Мікроцикл 2 (Тренування 10–18)",
          badge: "48% / 36% • 8 / 12 повт",
          reps: "Базові: 4×8 • Підсобні: 4×12",
          mainWeight: "48% від 1ПМ",
          accessoryWeight: "36% від 1ПМ",
          desc: "Початок гіпертрофійного зростання. Вага вища, повторень менше, але відпочинок незмінний — 30с.",
        },
        {
          title: "Мікроцикл 3 (Тренування 19–27)",
          badge: "56% / 42% • 6 / 9 повт",
          reps: "Базові: 4×6 • Підсобні: 4×9",
          mainWeight: "56% від 1ПМ",
          accessoryWeight: "42% від 1ПМ",
          desc: "Силова витривалість. Вага вже суттєва, швидкість виконання та концентрація максимальні.",
        },
        {
          title: "Мікроцикл 4 (Тренування 28–36)",
          badge: "65% / 50% • 4 / 6 повт",
          reps: "Базові: 4×4 • Підсобні: 4×6",
          mainWeight: "65% від 1ПМ",
          accessoryWeight: "50% від 1ПМ",
          desc: "Пікова потужність. Робота на межі сили та щільності з фіксацією підсумкового прогресу.",
        },
      ],
    },
    progression: {
      autoIncrementTitle: "Двоетапна прогресія навантаження",
      successTitle: "Етап 1: Всі підходи закриті з відпочинком 30с",
      successDesc:
        "Якщо ви вклалися в таймер і зробили всі 24 підходи без подовження пауз — трекер пропонує додати +2.5 кг на наступне тренування.",
      failTitle: "Етап 2: Не встигли або збився таймер",
      failDesc:
        "Якщо ви не змогли вкластися в 30 секунд або не завершили підходи — вага НЕ збільшується. Тренування повторюється з тією ж вагою до досягнення чистого результату.",
      bodyTitle: "Оцінка рекомпозиції (Заміри тіла)",
      bodyDesc:
        "Оскільки жир спалюється, а м'язи ущільнюються, стрілка вагів може стояти на місці. Головний маркер успіху в СМТ — співвідношення талії до біцепса та грудей:",
      criteria: [
        { label: "Головний маркер", value: "Талія зменшується", colorClass: "text-emerald-400" },
        { label: "М'язова маса", value: "Біцепс / Груди ростуть", colorClass: "text-cyan-400" },
        { label: "Частота замірів", value: "Раз на 1–2 тижні", colorClass: "text-white" },
      ],
    },
    app: {
      pwaTitle: "Установка як додаток (PWA)",
      pwaDesc: "Працює на повний екран без рамок браузера та навіть без інтернету:",
      iosTitle: "📱 На iPhone (iOS Safari):",
      iosDesc: "Натисніть кнопку «Поділитися» (квадрат зі стрілкою) → виберіть «На початковий екран» → натисніть «Додати».",
      androidTitle: "🤖 На Android (Google Chrome):",
      androidDesc: "Натисніть три крапки «⋮» праворуч вгорі → виберіть «Встановити додаток».",
      tmaTitle: "✈️ Telegram Mini App та Бот:",
      tmaDesc: "Підтримує автоматичну синхронізацію, тактильний відгук (вібрацію) та сповіщення тренера.",
      backupTitle: "Збереження та безпека даних",
      backupDesc:
        "Усі тренування зберігаються локально на вашому пристрої (Local-First). У розділі «Налаштування» можна будь-коли скачати резервну копію в JSON.",
      coachTitle: "Звіти особистому тренеру",
      coachDesc:
        "Після завершення тренування звіт автоматично або в 1 клік відправляється тренеру в Telegram без додаткових підтверджень.",
    },
    footer: {
      guideNotice: "Повний технічний опис та методика доступні у файлі SMT_GUIDE.md",
      closeBtn: "Зрозуміло",
    },
  },
  ru: {
    modalTitle: "Справка и Методика СМТ-1",
    modalSubtitle: "Полное руководство по системе Сверхмощного тренинга и функциям трекера",
    tabs: [
      { id: "method", label: "Методика СМТ" },
      { id: "prep", label: "Вводный цикл" },
      { id: "exercises", label: "Схема упражнений" },
      { id: "cycles", label: "4 Микроцикла" },
      { id: "progression", label: "Прогрессия и Замеры" },
      { id: "app", label: "Приложение и PWA" },
    ],
    method: {
      heroTitle: "Суть Сверхмощного высокоплотного тренинга (СМТ-1)",
      heroDesc:
        "СМТ (Сверхмощный тренинг) — высокоплотная силовая методика, направленная на одновременную рекомпозицию тела (сжигание подкожного жира при росте жесткости и плотности мышц), мощную капилляризацию и развитие силовой выносливости.",
      warningTitle: "⚠️ Важное предупреждение: программа НЕ для неподготовленных людей!",
      warningDesc:
        "СМТ-1 — это непрерывная работа с паузами строго 30 секунд. 24 рабочих подхода выполняются за 24–30 минут. Для неподготовленного сердца, связок и ЦНС такой объем грозит перетренированностью или травмой. Если у вас был перерыв в тренировках — обязательно пройдите 1–2 недельный вводный цикл (вкладка «Вводный цикл») перед стартом СМТ-1!",
      restTitle: "Отдых строго 30 секунд",
      restDesc:
        "Между подходами и кругами пауза составляет ровно 30 секунд. Это не позволяет лактату полностью рассеяться и вызывает максимальный анаболический гормональный отклик (выброс соматотропина).",
      safetyTitle: "Безопасные рабочие веса (40–55%)",
      safetyDesc:
        "Веса рассчитываются от разового максимума (1ПМ). Умеренный тоннаж защищает суставы и сухожилия, переводя стимул в глубокую мышечную накачку и выносливость.",
      rulesTitle: "⚡️ Золотые правила СМТ:",
      rules: [
        "Этап 1: закрыть тренировку с отдыхом строго до 30 секунд. Этап 2: добавить +2.5 кг. Без первого этапа нет СМТ!",
        "Темп тренировки: 1 подход = ~1 минута. Вся тренировка из 24 подходов длится 24–30 минут.",
        "Если тяжело — снизьте рабочий вес, но ни в коем случае не растягивайте паузу. СМТ работает именно за счет непрерывной высокой плотности.",
      ],
    },
    prep: {
      title: "Вводный подготовительный цикл (1–2 недели)",
      badge: "3–6 тренировок • Адаптация к темпу",
      desc: "Если вы не тренировались регулярно последние 2–3 месяца или не привыкли к высокой плотности — этот цикл подготовит сердце, суставы и определит точные стартовые веса.",
      whyTitle: "🎯 Зачем нужна подготовка:",
      whyDesc:
        "1. Адаптировать сердечный ритм и сосуды к быстрому восстановлению между сетами.\n2. Укрепить связки и сухожилия перед серийной нагрузкой СМТ.\n3. Точно определить рабочий вес на 10–12 повторений для расчета 1ПМ.",
      schemeTitle: "📋 Комплекс подготовительной тренировки (3 базовых упражнения):",
      exercises: [
        {
          name: "1. Жим штанги или гантелей лежа",
          scheme: "4 подхода × 10–12 повторений",
          notes: "Базовый жим с подконтрольным опусканием. Зафиксируйте вес, с которым чисто делаете 10–12 повторов.",
        },
        {
          name: "2. Подтягивания или тяга верхнего блока",
          scheme: "4 подхода × 10–12 повторений",
          notes: "Тяга к груди широким или средним хватом. Если тяжело — используйте гравитрон или блочный тренажер.",
        },
        {
          name: "3. Приседания со штангой или жим платформы ногами",
          scheme: "4 подхода × 10–12 повторений",
          notes: "Жим ногами в тренажере или умеренные приседания с комфортной глубиной.",
        },
      ],
      restProgressionTitle: "⏱ Протокол постепенного сокращения отдыха:",
      restProgression: [
        { workout: "Тренировка 1", rest: "90 секунд (1.5 мин)", desc: "Спокойный вход, проверка траектории и подбор комфортного веса." },
        { workout: "Тренировка 2", rest: "75 секунд", desc: "Контроль дыхания, первое привыкание к плотности." },
        { workout: "Тренировка 3", rest: "60 секунд (1 мин)", desc: "Сердечно-сосудистая система включается в активную работу." },
        { workout: "Тренировки 4–6", rest: "45 → 30 секунд", desc: "Боевой темп СМТ. Ваше тело готово к основному 12-недельному курсу!" },
      ],
      calcTitle: "🧮 Как рассчитать стартовые веса после подготовки:",
      calcDesc:
        "Возьмите рабочий вес, с которым вы выполнили 10 повторений в подготовке. Введите его в калькулятор (кнопка ниже или в меню Настроек). Программа рассчитает ваш 1ПМ и автоматически выставит 40% для базы и 30% для подсобки.",
    },
    exercises: {
      intro:
        "Комплекс упражнений в СМТ-1 состоит из 2 одиночных блоков и 2 суперсетов. Упражнения можно заменять на биомеханически эквивалентные под ваш зал, но баланс мышечных цепей должен оставаться неизменным!",
      blocks: [
        {
          title: "Блок 1: Жим штанги лежа",
          badge: "Одиночный блок • 4 подхода",
          desc: "Базовый грудной жим. 4 подхода по плану микроцикла (10/8/6/4 повт) с весом 40–55% от 1ПМ. Отдых между сетами: ровно 30 секунд.",
        },
        {
          title: "Блок 2: Жим штанги узким хватом",
          badge: "Одиночный блок • 4 подхода",
          desc: "Акцент на трицепс и переднюю дельту. 4 подхода по плану микроцикла с паузами строго 30 секунд.",
        },
        {
          title: "Блок 3: Суперсет 1 (Спина + Бицепс)",
          badge: "Суперсет • 4 круга",
          isSuperset: true,
          exercises: [
            {
              category: "Основное",
              name: "Подтягивания (или тяга блока)",
              details: "40% 1ПМ • 10 повт • пауза 30с после упражнения",
            },
            {
              category: "Подсобка",
              name: "Штанга на бицепс",
              details: "30% 1ПМ • 15 повт • пауза 30с перед следующим кругом",
            },
          ],
        },
        {
          title: "Блок 4: Суперсет 2 (Ноги + Плечи)",
          badge: "Суперсет • 4 круга",
          isSuperset: true,
          exercises: [
            {
              category: "Основное",
              name: "Приседания со штангой (или жим ногами)",
              details: "40% 1ПМ • 10 повт • пауза 30с после упражнения",
            },
            {
              category: "Подсобка",
              name: "Армейский жим стоя (плечи)",
              details: "30% 1ПМ • 15 повт • пауза 30с перед следующим кругом",
            },
          ],
        },
      ],
      substitutionsTitle: "🔄 Взаимозаменяемость упражнений (как адаптировать под свой зал)",
      substitutionsIntro:
        "Не меняйте логику программы радикально (например, нельзя заменять присед на упражнение для рук). Выбирайте только биомеханические аналоги:",
      substitutions: [
        {
          original: "Жим штанги лежа",
          alternatives: "Жим гантелей на горизонтальной скамье, жим в тренажере Смита, отжимания на брусьях с весом.",
          reason: "Сохраняется угол жима и нагрузка на большую грудную мышцу.",
        },
        {
          original: "Жим узким хватом",
          alternatives: "Французский жим со штангой/гантелями, отжимания на брусьях (акцент трицепс), разгибания на блоке вниз.",
          reason: "Изолированная и безопасная нагрузка на трицепс при быстром переходе между сетами.",
        },
        {
          original: "Подтягивания на перекладине",
          alternatives: "Тяга верхнего блока к груди, тяга Т-грифа, тяга штанги в наклоне, тяга гантели в наклоне.",
          reason: "Вертикальная или горизонтальная тяга для широчайших мышц без перегрузки поясницы.",
        },
        {
          original: "Штанга на бицепс",
          alternatives: "Подъем гантелей с супинацией, сгибания на скамье Скотта, молотковые сгибания (hammer curls).",
          reason: "Подсобная изоляция двуглавой мышцы плеча с высоким памп-эффектом.",
        },
        {
          original: "Приседания со штангой",
          alternatives: "Жим платформы ногами, гакк-приседания, кубковые приседания с гантелью (гоблет).",
          reason: "Если есть проблемы со спиной или коленями — жим платформы идеально заменяет приседания при отдыхе 30с.",
        },
        {
          original: "Армейский жим стоя",
          alternatives: "Жим гантелей сидя, жим штанги сидя с груди, махи гантелями в стороны.",
          reason: "Нагрузка на передний и средний пучки дельтовидных мышц.",
        },
      ],
      calcHowToTitle: "⚙️ Где настроить упражнения и веса в приложении:",
      calcHowToDesc:
        "Откройте раздел «Программа» → нажмите «Настроить программу» (или в меню «Настройки»). Там можно изменить названия упражнений под ваш инвентарь, вызвать калькулятор 1ПМ для каждого движения и в 1 клик пересчитать стартовые веса на все 36 тренировок.",
    },
    cycles: {
      intro:
        "12 недель разбиты на 4 микроцикла по 9 тренировок. Каждый микроцикл планомерно меняет диапазон повторений и рабочие проценты:",
      items: [
        {
          title: "Микроцикл 1 (Тренировки 1–9)",
          badge: "40% / 30% • 10 / 15 повт",
          reps: "Базовые: 4×10 • Подсобные: 4×15",
          mainWeight: "40% от 1ПМ",
          accessoryWeight: "30% от 1ПМ",
          desc: "Адаптация и капилляризация. Приучение сердца и мышц держать строгий 30-секундный темп.",
        },
        {
          title: "Микроцикл 2 (Тренировки 10–18)",
          badge: "48% / 36% • 8 / 12 повт",
          reps: "Базовые: 4×8 • Подсобные: 4×12",
          mainWeight: "48% от 1ПМ",
          accessoryWeight: "36% от 1ПМ",
          desc: "Начало гипертрофии. Вес выше, повторений меньше, но отдых неизменен — строго 30с.",
        },
        {
          title: "Микроцикл 3 (Тренировки 19–27)",
          badge: "56% / 42% • 6 / 9 повт",
          reps: "Базовые: 4×6 • Подсобные: 4×9",
          mainWeight: "56% от 1ПМ",
          accessoryWeight: "42% от 1ПМ",
          desc: "Силовая выносливость. Вес серьезный, скорость и концентрация максимальные.",
        },
        {
          title: "Микроцикл 4 (Тренировки 28–36)",
          badge: "65% / 50% • 4 / 6 повт",
          reps: "Базовые: 4×4 • Подсобные: 4×6",
          mainWeight: "65% от 1ПМ",
          accessoryWeight: "50% от 1ПМ",
          desc: "Пиковая мощность. Работа на грани силы и плотности с выходом на итоговые рекорды.",
        },
      ],
    },
    progression: {
      autoIncrementTitle: "Двухэтапная прогрессия нагрузки",
      successTitle: "Этап 1: Все подходы закрыты с отдыхом 30с",
      successDesc:
        "Если вы уложились в таймер и выполнили все 24 подхода без затягивания пауз — трекер предлагает добавить +2.5 кг на следующую тренировку.",
      failTitle: "Этап 2: Не уложились в таймер",
      failDesc:
        "Если вы не смогли выдержать 30 секунд отдыха или не завершили подходы — вес НЕ повышается. Тренировка повторяется с тем же весом до чистого выполнения.",
      bodyTitle: "Оценка рекомпозиции (Замеры тела)",
      bodyDesc:
        "Так как жир горит, а мышцы становятся плотнее, вес тела может стоять на месте. Главный маркер успеха СМТ — пропорция талии к бицепсу и груди:",
      criteria: [
        { label: "Главный маркер", value: "Талия уменьшается", colorClass: "text-emerald-400" },
        { label: "Мышечная масса", value: "Бицепс / Грудная клетка растут", colorClass: "text-cyan-400" },
        { label: "Частота замеров", value: "Раз в 1–2 недели", colorClass: "text-white" },
      ],
    },
    app: {
      pwaTitle: "Установка как приложение (PWA)",
      pwaDesc: "Работает во весь экран без рамок браузера и даже без интернета:",
      iosTitle: "📱 На iPhone (iOS Safari):",
      iosDesc: "Нажмите кнопку «Поделиться» (квадрат со стрелкой) → выберите «На экран „Домой“» → нажмите «Добавить».",
      androidTitle: "🤖 На Android (Google Chrome):",
      androidDesc: "Нажмите три точки «⋮» в правом верхнем углу → выберите «Установить приложение».",
      tmaTitle: "✈️ Telegram Mini App и Бот:",
      tmaDesc: "Поддерживает автоматическую тему Telegram, вибрацию при тапах и отчеты тренеру.",
      backupTitle: "Сохранение и безопасность данных",
      backupDesc:
        "Все тренировки сохраняются локально на вашем устройстве (Local-First). В «Настройках» можно в любой момент скачать резервную копию JSON.",
      coachTitle: "Отчеты личному тренеру",
      coachDesc:
        "После завершения тренировки отчет отправляется мастер-тренеру напрямую в Telegram без лишних кликов.",
    },
    footer: {
      guideNotice: "Полное описание и методика доступны в файле SMT_GUIDE.md",
      closeBtn: "Понятно",
    },
  },
  en: {
    modalTitle: "SMT-1 Method & Guide",
    modalSubtitle: "Complete guide to Super-Power Training system and tracker features",
    tabs: [
      { id: "method", label: "SMT Method" },
      { id: "prep", label: "Prep Cycle" },
      { id: "exercises", label: "Exercise Scheme" },
      { id: "cycles", label: "4 Microcycles" },
      { id: "progression", label: "Progression & Body" },
      { id: "app", label: "App & PWA" },
    ],
    method: {
      heroTitle: "Super-Power High-Density Training Philosophy (SMT-1)",
      heroDesc:
        "SMT (Super-Power Training) is a high-density strength methodology designed for simultaneous body recomposition (burning fat while increasing muscle density and hardness), capillary expansion, and supreme strength endurance.",
      warningTitle: "⚠️ Critical Disclaimer: Not for untrained individuals!",
      warningDesc:
        "SMT-1 requires non-stop lifting with strict 30-second rest intervals. A full 24-set workout takes 24–30 minutes. Starting this volume without baseline conditioning risks severe tendon or cardiovascular strain. If you haven't lifted regularly for 2–3 months, complete the 1–2 week Prep Cycle (see 'Prep Cycle' tab) before starting SMT-1!",
      restTitle: "Strict 30-Second Rest Intervals",
      restDesc:
        "Rest between sets and superset rounds is exactly 30 seconds. This maintains high lactate levels and triggers maximal anabolic hormonal response (growth hormone release).",
      safetyTitle: "Safe Working Weights (40–55%)",
      safetyDesc:
        "Loads are calculated from your 1-Rep Max (1RM). Moderate tonnage protects joints and tendons while driving intense muscle hypertrophy and endurance.",
      rulesTitle: "⚡️ Golden Rules of SMT:",
      rules: [
        "Stage 1: complete the entire workout strictly keeping rest under 30 seconds. Stage 2: add +2.5 kg. Without Stage 1, it is not SMT!",
        "Workout pace: 1 set = ~1 minute. A full 24-set workout takes 24–30 minutes.",
        "If it feels too heavy, reduce the weight, but never prolong the rest interval. SMT works solely because of continuous density.",
      ],
    },
    prep: {
      title: "Preparation & Adaptation Cycle (1–2 Weeks)",
      badge: "3–6 Sessions • Work Capacity",
      desc: "If you have not trained consistently in the last 2–3 months, this routine primes your cardiovascular system, tendons, and establishes exact baseline weights.",
      whyTitle: "🎯 Purpose of Prep Cycle:",
      whyDesc:
        "1. Condition the cardiovascular system to recover rapidly between sets.\n2. Strengthen connective tissues for high-density volume.\n3. Determine your exact 10–12 RM loads to calculate SMT-1 starting weights.",
      schemeTitle: "📋 Prep Routine (3 Compound Movements):",
      exercises: [
        {
          name: "1. Bench Press (Barbell or Dumbbells)",
          scheme: "4 sets × 10–12 reps",
          notes: "Controlled eccentric tempo. Note the weight you can cleanly lift for 10–12 reps.",
        },
        {
          name: "2. Pull-ups or Lat Pulldowns",
          scheme: "4 sets × 10–12 reps",
          notes: "Pull to upper chest. Use assisted machine or cable pulldown if bodyweight is too heavy.",
        },
        {
          name: "3. Barbell Squat or Leg Press Machine",
          scheme: "4 sets × 10–12 reps",
          notes: "Leg press or squat to parallel with consistent spinal bracing.",
        },
      ],
      restProgressionTitle: "⏱ Rest Period Reduction Protocol:",
      restProgression: [
        { workout: "Workout 1", rest: "90 seconds (1.5 min)", desc: "Establish form and dial in starting weights." },
        { workout: "Workout 2", rest: "75 seconds", desc: "Regulate breathing and introduce mild metabolic fatigue." },
        { workout: "Workout 3", rest: "60 seconds (1 min)", desc: "Cardiovascular system actively adapts to short recovery." },
        { workout: "Workouts 4–6", rest: "45 → 30 seconds", desc: "Combat density pace. Your body is ready for SMT-1!" },
      ],
      calcTitle: "🧮 Calculating SMT-1 Weights After Prep:",
      calcDesc:
        "Take your 10-rep working load from the prep sessions. Input it into the calculator (button below or in Settings). The app calculates your 1RM and sets 40% for compound exercises and 30% for accessory movements across all 36 sessions.",
    },
    exercises: {
      intro:
        "The SMT-1 workout consists of 2 single blocks and 2 supersets. You can substitute exercises with biomechanical equivalents to match your gym setup without breaking the movement chain balance!",
      blocks: [
        {
          title: "Block 1: Flat Barbell Bench Press",
          badge: "Single Block • 4 sets",
          desc: "Compound chest press. 4 sets per microcycle plan (10/8/6/4 reps) with 40–55% 1RM. Rest between sets: strict 30 seconds.",
        },
        {
          title: "Block 2: Close-Grip Bench Press",
          badge: "Single Block • 4 sets",
          desc: "Triceps & anterior delt focus. 4 sets per microcycle with strict 30s rest.",
        },
        {
          title: "Block 3: Superset 1 (Back + Biceps)",
          badge: "Superset • 4 rounds",
          isSuperset: true,
          exercises: [
            {
              category: "Compound",
              name: "Pull-ups (or Lat Pulldown)",
              details: "40% 1RM • 10 reps • 30s rest after exercise",
            },
            {
              category: "Accessory",
              name: "Barbell Biceps Curl",
              details: "30% 1RM • 15 reps • 30s rest before next round",
            },
          ],
        },
        {
          title: "Block 4: Superset 2 (Legs + Shoulders)",
          badge: "Superset • 4 rounds",
          isSuperset: true,
          exercises: [
            {
              category: "Compound",
              name: "Barbell Squat (or Leg Press)",
              details: "40% 1RM • 10 reps • 30s rest after exercise",
            },
            {
              category: "Accessory",
              name: "Overhead Military Press",
              details: "30% 1RM • 15 reps • 30s rest before next round",
            },
          ],
        },
      ],
      substitutionsTitle: "🔄 Exercise Substitutions (Gym Customization)",
      substitutionsIntro:
        "Do not alter the program philosophy drastically (e.g., don't swap squats for curls). Swap only for biomechanically equivalent exercises:",
      substitutions: [
        {
          original: "Flat Barbell Bench Press",
          alternatives: "Flat Dumbbell Press, Smith Machine Bench Press, Weighted Chest Dips.",
          reason: "Preserves the horizontal pressing plane and recruitment of the pectoralis major.",
        },
        {
          original: "Close-Grip Bench Press",
          alternatives: "Skull Crushers (French Press), Triceps Dips, Cable Pushdowns.",
          reason: "Direct triceps load with minimal joint friction during high-frequency rounds.",
        },
        {
          original: "Pull-ups",
          alternatives: "Lat Pulldown (wide/medium grip), T-bar Row, Bent-over Barbell Row, Dumbbell Row.",
          reason: "Vertical or horizontal pulling for lats without lower back fatigue.",
        },
        {
          original: "Barbell Biceps Curl",
          alternatives: "Dumbbell Supinated Curls, Preacher Curl, Hammer Curls.",
          reason: "Accessory elbow flexion with high metabolic pump.",
        },
        {
          original: "Barbell Squat",
          alternatives: "45° Leg Press, Hack Squat, Goblet Squat with heavy dumbbell.",
          reason: "If spinal loading is a concern, the leg press is ideal for strict 30s pacing.",
        },
        {
          original: "Overhead Military Press",
          alternatives: "Seated Dumbbell Press, Seated Smith Machine Press, Lateral Raises.",
          reason: "Anterior and lateral deltoid stimulation.",
        },
      ],
      calcHowToTitle: "⚙️ Where to configure exercises and weights in the app:",
      calcHowToDesc:
        "Go to the 'Program' tab → click 'Configure Program' (or in 'Settings'). You can customize exercise names to match your equipment, open the 1RM calculator for any movement, and re-calculate starting weights across all 36 sessions with one tap.",
    },
    cycles: {
      intro:
        "The 12 weeks are divided into 4 microcycles of 9 workouts each. Each microcycle systematically modifies repetition targets and loads:",
      items: [
        {
          title: "Microcycle 1 (Workouts 1–9)",
          badge: "40% / 30% • 10 / 15 reps",
          reps: "Main: 4×10 • Accessory: 4×15",
          mainWeight: "40% of 1RM",
          accessoryWeight: "30% of 1RM",
          desc: "Conditioning & Capillarization. Teaches your cardio and muscles to thrive on 30s rest.",
        },
        {
          title: "Microcycle 2 (Workouts 10–18)",
          badge: "48% / 36% • 8 / 12 reps",
          reps: "Main: 4×8 • Accessory: 4×12",
          mainWeight: "48% of 1RM",
          accessoryWeight: "36% of 1RM",
          desc: "Hypertrophy ignition. Heavier loads, fewer reps, but rest remains strictly 30s.",
        },
        {
          title: "Microcycle 3 (Workouts 19–27)",
          badge: "56% / 42% • 6 / 9 reps",
          reps: "Main: 4×6 • Accessory: 4×9",
          mainWeight: "56% of 1RM",
          accessoryWeight: "42% of 1RM",
          desc: "Strength endurance. Heavy demands, maximum execution speed and focus.",
        },
        {
          title: "Microcycle 4 (Workouts 28–36)",
          badge: "65% / 50% • 4 / 6 reps",
          reps: "Main: 4×4 • Accessory: 4×6",
          mainWeight: "65% of 1RM",
          accessoryWeight: "50% of 1RM",
          desc: "Peak power. Testing strength-density limits and cementing body recomposition.",
        },
      ],
    },
    progression: {
      autoIncrementTitle: "Two-Stage Progression System",
      successTitle: "Stage 1: All sets completed within 30s rest",
      successDesc:
        "If you hit all 24 sets within the strict timer, the app prompts you to add +2.5 kg next workout.",
      failTitle: "Stage 2: Timer exceeded or sets missed",
      failDesc:
        "If you failed to keep rest under 30s or missed reps, weight does NOT increase. Repeat the session until achieved.",
      bodyTitle: "Recomposition Tracking (Body Measurements)",
      bodyDesc:
        "Because fat is lost while muscle density increases, body weight may fluctuate or stay unchanged. The golden metric is your waist-to-chest/arm ratio:",
      criteria: [
        { label: "Prime Indicator", value: "Waist shrinks", colorClass: "text-emerald-400" },
        { label: "Muscle Growth", value: "Arms / Chest grow", colorClass: "text-cyan-400" },
        { label: "Measurement Frequency", value: "Every 1–2 weeks", colorClass: "text-white" },
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
