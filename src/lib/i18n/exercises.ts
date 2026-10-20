import { AppLanguage } from "@/types/body";
import { WarmupItem } from "@/types/smt";

export interface ExerciseNameEntry {
  full: string;
  short: string;
}

export const EXERCISE_TRANSLATIONS: Record<
  string,
  Record<AppLanguage, ExerciseNameEntry>
> = {
  bench_press: {
    uk: { full: "Жим штанги лежачи", short: "Жим лежачи" },
    en: { full: "Barbell Bench Press", short: "Bench Press" },
    ru: { full: "Жим штанги лежа", short: "Жим лежа" },
  },
  close_grip_bench: {
    uk: { full: "Жим лежачи вузьким хватом", short: "Жим вузьким" },
    en: { full: "Close-Grip Bench Press", short: "Close-Grip" },
    ru: { full: "Жим лежа узким хватом", short: "Жим узким" },
  },
  pull_ups: {
    uk: { full: "Підтягування (або тяга)", short: "Підтягування" },
    en: { full: "Pull-ups (or Lat Pulldown)", short: "Pull-ups" },
    ru: { full: "Подтягивания (или тяга)", short: "Подтягивания" },
  },
  biceps_curl: {
    uk: { full: "Штанга на біцепс", short: "Біцепс" },
    en: { full: "Barbell Bicep Curls", short: "Biceps" },
    ru: { full: "Штанга на бицепс", short: "Бицепс" },
  },
  squat: {
    uk: { full: "Присідання зі штангою", short: "Присідання" },
    en: { full: "Barbell Squats", short: "Squats" },
    ru: { full: "Приседания со штангой", short: "Присед" },
  },
  ohp: {
    uk: { full: "Армійський жим (стоячи)", short: "Жим стоячи" },
    en: { full: "Overhead Military Press", short: "Overhead Press" },
    ru: { full: "Армейский жим (Жим стоя)", short: "Жим стоя" },
  },
};

/**
 * Локализация названия упражнения по ID или по текстовому имени
 */
export function getLocalizedExerciseName(
  idOrName: string,
  lang: AppLanguage = "uk",
  isShort = false
): string {
  // Поиск по точному ID
  if (EXERCISE_TRANSLATIONS[idOrName]) {
    return isShort
      ? EXERCISE_TRANSLATIONS[idOrName][lang].short
      : EXERCISE_TRANSLATIONS[idOrName][lang].full;
  }

  // Поиск по ключевым фрагментам в русском имени (для существующих сессий в localStorage)
  const lower = idOrName.toLowerCase();
  if (lower.includes("узким") || lower.includes("вузьк") || lower.includes("close")) {
    return isShort
      ? EXERCISE_TRANSLATIONS.close_grip_bench[lang].short
      : EXERCISE_TRANSLATIONS.close_grip_bench[lang].full;
  }
  if (lower.includes("лежа") || lower.includes("bench")) {
    return isShort
      ? EXERCISE_TRANSLATIONS.bench_press[lang].short
      : EXERCISE_TRANSLATIONS.bench_press[lang].full;
  }
  if (lower.includes("подтягивания") || lower.includes("підтягування") || lower.includes("pull")) {
    return isShort
      ? EXERCISE_TRANSLATIONS.pull_ups[lang].short
      : EXERCISE_TRANSLATIONS.pull_ups[lang].full;
  }
  if (lower.includes("бицепс") || lower.includes("біцепс") || lower.includes("bicep")) {
    return isShort
      ? EXERCISE_TRANSLATIONS.biceps_curl[lang].short
      : EXERCISE_TRANSLATIONS.biceps_curl[lang].full;
  }
  if (lower.includes("присед") || lower.includes("squat")) {
    return isShort
      ? EXERCISE_TRANSLATIONS.squat[lang].short
      : EXERCISE_TRANSLATIONS.squat[lang].full;
  }
  if (lower.includes("армейский") || lower.includes("армійськ") || lower.includes("стоя") || lower.includes("ohp") || lower.includes("press")) {
    return isShort
      ? EXERCISE_TRANSLATIONS.ohp[lang].short
      : EXERCISE_TRANSLATIONS.ohp[lang].full;
  }

  return idOrName;
}

/**
 * Форматирование заголовка тренировки
 * uk: Тренування #1 (МКЦ-1, Тиждень 1)
 * en: Workout #1 (MC-1, Week 1)
 * ru: Тренировка #1 (МКЦ-1, Неделя 1)
 */
export function formatWorkoutTitle(
  workoutNumber: number,
  microcycle: number,
  week: number,
  lang: AppLanguage = "uk"
): string {
  if (lang === "uk") {
    return `Тренування #${workoutNumber} (МКЦ-${microcycle}, Тиждень ${week})`;
  }
  if (lang === "en") {
    return `Workout #${workoutNumber} (MC-${microcycle}, Week ${week})`;
  }
  return `Тренировка #${workoutNumber} (МКЦ-${microcycle}, Неделя ${week})`;
}

/**
 * Локализация лейбла блока или суперсета
 * "Блок 1: Жим штанги лежа" -> "Блок 1: Жим штанги лежачи"
 * "Суперсет 1: Подтягивания + Штанга на бицепс" -> "Суперсет 1: Підтягування + Біцепс"
 */
export function formatSupersetLabel(
  label: string,
  lang: AppLanguage = "uk"
): string {
  const parts = label.split(":");
  if (parts.length < 2) return label;

  const prefix = parts[0].trim();
  const rest = parts.slice(1).join(":").trim();

  let localizedPrefix = prefix;
  if (prefix.toLowerCase().includes("блок") || prefix.toLowerCase().includes("block")) {
    const num = prefix.match(/\d+/)?.[0] || "1";
    localizedPrefix = lang === "en" ? `Block ${num}` : `Блок ${num}`;
  } else if (prefix.toLowerCase().includes("суперсет") || prefix.toLowerCase().includes("superset")) {
    const num = prefix.match(/\d+/)?.[0] || "1";
    localizedPrefix = lang === "en" ? `Superset ${num}` : `Суперсет ${num}`;
  }

  // Упражнения через "+"
  const exNames = rest.split("+").map((s) => s.trim());
  const localizedExNames = exNames.map((name) => getLocalizedExerciseName(name, lang, false));

  return `${localizedPrefix}: ${localizedExNames.join(" + ")}`;
}

export function formatSupersetType(
  isSingle: boolean,
  lang: AppLanguage = "uk"
): string {
  if (isSingle) {
    if (lang === "uk") return "Одиночний блок";
    if (lang === "en") return "Single block";
    return "Одиночный блок";
  }
  if (lang === "uk") return "Суперсет (відпочинок 30с)";
  if (lang === "en") return "Superset (30s rest)";
  return "Суперсет (отдых 30с)";
}

/**
 * Список разминки на выбранном языке
 */
export function getLocalizedWarmupList(lang: AppLanguage = "uk"): WarmupItem[] {
  if (lang === "uk") {
    return [
      {
        id: "w1",
        title: "Обертання шиї та плечового поясу",
        description: "Плавні кругові рухи по 10-15 разів у кожну сторону.",
        completed: false,
      },
      {
        id: "w2",
        title: "Ліктьові та променевозап'ястні суглоби",
        description: "Розігрів суглобів рук, обертання, легкі розтяжки сухожиль.",
        completed: false,
      },
      {
        id: "w3",
        title: "Повороти корпусу та нахили",
        description: "М'яка мобілізація хребта та м'язів кору (15-20 разів).",
        completed: false,
      },
      {
        id: "w4",
        title: "Кульшові та колінні суглоби",
        description: "Обертання колінами, випади без ваги, обертання тазом.",
        completed: false,
      },
      {
        id: "w5",
        title: "Гомілковостоп та присідання з власною вагою",
        description: "15 глибоких контрольованих присідань з фіксацією внизу.",
        completed: false,
      },
    ];
  }

  if (lang === "en") {
    return [
      {
        id: "w1",
        title: "Neck and shoulder rotations",
        description: "Smooth circular rotations 10-15 times in each direction.",
        completed: false,
      },
      {
        id: "w2",
        title: "Elbow and wrist joints",
        description: "Warm up arm joints, rotations and light tendon stretches.",
        completed: false,
      },
      {
        id: "w3",
        title: "Torso twists and side bends",
        description: "Gentle spinal mobility and core activation (15-20 reps).",
        completed: false,
      },
      {
        id: "w4",
        title: "Hip and knee mobility",
        description: "Knee circles, unweighted lunges, hip rotations.",
        completed: false,
      },
      {
        id: "w5",
        title: "Ankles and bodyweight squats",
        description: "15 deep controlled squats with a brief pause at the bottom.",
        completed: false,
      },
    ];
  }

  return [
    {
      id: "w1",
      title: "Вращения шеи и плечевого пояса",
      description: "Плавные круговые движения по 10-15 раз в каждую сторону.",
      completed: false,
    },
    {
      id: "w2",
      title: "Локтевые и лучезапястные суставы",
      description: "Разогрев суставов рук, вращения, легкие растяжки сухожилий.",
      completed: false,
    },
    {
      id: "w3",
      title: "Повороты корпуса и наклоны",
      description: "Мягкая мобилизация позвоночника и мышц кора (15-20 раз).",
      completed: false,
    },
    {
      id: "w4",
      title: "Тазобедренные и коленные суставы",
      description: "Вращения коленями, выпады без веса, вращения бедрами.",
      completed: false,
    },
    {
      id: "w5",
      title: "Голеностоп и приседания с собственным весом",
      description: "15 глубоких контролируемых приседаний с фиксацией внизу.",
      completed: false,
    },
  ];
}
