import type { WorkoutSession } from "@/types/smt";

export interface AthleticScoreResult {
  score: number; // 0 - 100
  tierKey: "active" | "power_master" | "iron_pro" | "titan";
  relativeTonnage: number; // e.g. 145x bodyweight
  densityKgPerMin: number;
  completedSets: number;
  totalPlannedSets: number;
  completionRate: number; // 0.0 - 1.0
  isAntiCheatTriggered?: boolean;
}

export interface CalculateScoreParams {
  tonnageKg: number;
  durationSeconds: number;
  bodyWeightKg?: number;
  gender?: "male" | "female";
  age?: number;
  completedSets?: number;
  totalPlannedSets?: number;
  workout?: WorkoutSession | null;
}

/**
 * Расчет Индекса Атлетичности (Athletic Score) с многоуровневыми предохранителями от накрутки:
 * 1. Защита от коротких сессий (Anti-cheat по времени): минимальное физиологическое время на подход (35с).
 * 2. Коэффициент завершенности тренировки (Completion Rate): незавершенная тренировка (например, 2 подхода из 24)
 *    не может набрать высокий балл благодаря экспоненциальному масштабированию.
 * 3. Жесткие фильтры элитных рангов (Titan требует >=95% выполнения и реальный тоннаж).
 */
export function calculateAthleticScore({
  tonnageKg,
  durationSeconds,
  bodyWeightKg = 80,
  gender = "male",
  age = 30,
  completedSets: explicitCompletedSets,
  totalPlannedSets: explicitTotalPlannedSets,
  workout,
}: CalculateScoreParams): AthleticScoreResult {
  // 1. Извлечение количества выполненных и запланированных подходов
  let totalPlannedSets = explicitTotalPlannedSets ?? 24;
  let completedSets = explicitCompletedSets ?? 0;

  if (workout && workout.supersets && workout.supersets.length > 0) {
    const planned = workout.supersets.reduce(
      (sum, s) => sum + s.exercises.reduce((eSum, e) => eSum + (e.sets?.length || 0), 0),
      0
    );
    const completed = workout.supersets.reduce(
      (sum, s) =>
        sum +
        s.exercises.reduce(
          (eSum, e) => eSum + (e.sets ? e.sets.filter((st) => st.completed).length : 0),
          0
        ),
      0
    );
    if (planned > 0) {
      totalPlannedSets = planned;
      completedSets = completed;
    }
  } else if (explicitCompletedSets === undefined) {
    // Консервативная оценка для старых вызовов без переданного воркаута
    if (tonnageKg > 0) {
      completedSets = Math.min(totalPlannedSets, Math.max(1, Math.round(tonnageKg / 450)));
    } else {
      completedSets = 0;
    }
  }

  totalPlannedSets = Math.max(1, totalPlannedSets);
  completedSets = Math.min(totalPlannedSets, Math.max(0, completedSets));
  const completionRate = completedSets / totalPlannedSets;

  // Если подходов 0 или тоннаж нулевой
  if (!tonnageKg || tonnageKg <= 0 || completedSets === 0) {
    return {
      score: 0,
      tierKey: "active",
      relativeTonnage: 0,
      densityKgPerMin: 0,
      completedSets: 0,
      totalPlannedSets,
      completionRate: 0,
    };
  }

  const weight = Math.max(40, Math.min(160, bodyWeightKg || 80));

  // 2. Предохранитель от накрутки темпа (Anti-Cheat Speed Clamp):
  // 1 подход СМТ с отдыхом 30с чисто физически не может занимать меньше 35 секунд.
  // Это не позволяет получить 100 очков, завершив 1–2 подхода за 30 секунд.
  const minRealisticSeconds = completedSets * 35;
  const effectiveSeconds = Math.max(durationSeconds || 0, minRealisticSeconds, 45);
  const effectiveMinutes = effectiveSeconds / 60;
  const isAntiCheatTriggered = (durationSeconds || 0) < minRealisticSeconds && completedSets >= 2;

  // Относительный тоннаж (сколько своих весов поднято за тренировку)
  const relativeTonnage = tonnageKg / weight;

  // Реальная плотность (кг/мин) с учетом физиологического лимита времени
  const densityKgPerMin = Math.round(tonnageKg / effectiveMinutes);

  // Коэффициенты демографии
  const genderCoeff = gender === "female" ? 1.25 : 1.0;
  let ageCoeff = 1.0;
  if (age && age > 40) {
    ageCoeff += Math.min(0.15, (age - 40) * 0.006);
  }

  // 3. Столп 1: Относительный объем (0 - 50 баллов)
  // Норматив полной сессии СМТ: 180-200x веса тела = максимум
  const volumeNorm = (relativeTonnage / 200) * genderCoeff * ageCoeff;
  const volumePoints = Math.min(50, Math.max(0, volumeNorm * 50));

  // 4. Столп 2: Плотность и интенсивность (0 - 50 баллов)
  // Плотность в весах тела в минуту: эталон СМТ 4.5 - 6.0 bw/мин
  const relativeDensityBwPerMin = (relativeTonnage / effectiveMinutes) * genderCoeff * ageCoeff;
  const densityNorm = relativeDensityBwPerMin / 5.5;
  const densityPoints = Math.min(50, Math.max(0, densityNorm * 50));

  // 5. Базовый потенциал сессии (0 - 100)
  const rawBaseScore = volumePoints + densityPoints;

  // 6. Предохранитель завершенности:
  // Экспоненциальное масштабирование по доле выполненных подходов:
  // 100% (24/24) -> множитель 1.0
  // 50% (12/24)  -> множитель 0.41
  // 8.3% (2/24)  -> множитель 0.04 (очки падают до ~2-4 баллов!)
  const completionFactor = Math.pow(completionRate, 1.3);
  let finalScore = Math.round(rawBaseScore * completionFactor);

  // Дополнительные жесткие лимиты по количеству подходов:
  if (completedSets < 4) {
    // Разминка или брошенная тренировка (< 4 сетов) физически не может получить выше 15 баллов
    finalScore = Math.min(finalScore, Math.round(completedSets * 3.5));
  } else if (completedSets < 12) {
    // Меньше половины тренировки — максимум 45 баллов
    finalScore = Math.min(finalScore, 45);
  } else if (completedSets < 18) {
    // Меньше 75% тренировки — максимум 74 балла (ранг Active)
    finalScore = Math.min(finalScore, 74);
  }

  finalScore = Math.max(0, Math.min(100, finalScore));

  // 7. Присвоение рангов с обязательными условиями
  let tierKey: AthleticScoreResult["tierKey"] = "active";

  if (
    finalScore >= 95 &&
    completionRate >= 0.95 &&
    relativeTonnage >= 140 &&
    effectiveSeconds >= 16 * 60
  ) {
    tierKey = "titan";
  } else if (
    finalScore >= 85 &&
    completionRate >= 0.85 &&
    relativeTonnage >= 95
  ) {
    tierKey = "iron_pro";
  } else if (
    finalScore >= 75 &&
    completionRate >= 0.70 &&
    relativeTonnage >= 60
  ) {
    tierKey = "power_master";
  } else {
    tierKey = "active";
  }

  return {
    score: finalScore,
    tierKey,
    relativeTonnage: Number(relativeTonnage.toFixed(1)),
    densityKgPerMin,
    completedSets,
    totalPlannedSets,
    completionRate: Number(completionRate.toFixed(2)),
    isAntiCheatTriggered,
  };
}

export function getTierLabel(
  tierKey: AthleticScoreResult["tierKey"],
  t: { scoring: { tierTitan: string; tierIronPro: string; tierPowerMaster: string; tierActive: string } }
): string {
  switch (tierKey) {
    case "titan":
      return t.scoring.tierTitan;
    case "iron_pro":
      return t.scoring.tierIronPro;
    case "power_master":
      return t.scoring.tierPowerMaster;
    case "active":
    default:
      return t.scoring.tierActive;
  }
}

export function getTierColor(tierKey: AthleticScoreResult["tierKey"]): {
  text: string;
  bg: string;
  border: string;
  glow: string;
  accentHex: string;
} {
  switch (tierKey) {
    case "titan":
      return {
        text: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/40",
        glow: "shadow-purple-500/20",
        accentHex: "#c084fc",
      };
    case "iron_pro":
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/40",
        glow: "shadow-amber-500/20",
        accentHex: "#fbbf24",
      };
    case "power_master":
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/40",
        glow: "shadow-emerald-500/20",
        accentHex: "#34d399",
      };
    case "active":
    default:
      return {
        text: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/40",
        glow: "shadow-cyan-500/20",
        accentHex: "#38bdf8",
      };
  }
}

