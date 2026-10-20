export interface AthleticScoreResult {
  score: number; // 0 - 100
  tierKey: "active" | "power_master" | "iron_pro" | "titan";
  relativeTonnage: number; // e.g. 145x bodyweight
  densityKgPerMin: number;
}

export interface CalculateScoreParams {
  tonnageKg: number;
  durationSeconds: number;
  bodyWeightKg?: number;
  gender?: "male" | "female";
  age?: number;
}

/**
 * Расчет Индекса Атлетичности (Athletic Score)
 * Базируется на удельной работе на единицу массы тела за единицу времени
 * с нормализацией по полу и возрасту.
 */
export function calculateAthleticScore({
  tonnageKg,
  durationSeconds,
  bodyWeightKg = 80,
  gender = "male",
  age = 30,
}: CalculateScoreParams): AthleticScoreResult {
  if (!tonnageKg || tonnageKg <= 0 || !durationSeconds || durationSeconds <= 0) {
    return {
      score: 50,
      tierKey: "active",
      relativeTonnage: 0,
      densityKgPerMin: 0,
    };
  }

  const durationMinutes = Math.max(1, durationSeconds / 60);
  const weight = Math.max(40, bodyWeightKg || 80);
  
  // Относительный тоннаж (сколько своих весов поднято)
  const relativeTonnage = tonnageKg / weight;
  // Плотность кг/мин
  const densityKgPerMin = Math.round(tonnageKg / durationMinutes);

  // Коэффициент пола
  const genderCoeff = gender === "female" ? 1.25 : 1.0;

  // Возрастной коэффициент (небольшая фора после 40 лет)
  let ageCoeff = 1.0;
  if (age > 40) {
    ageCoeff += Math.min(0.2, (age - 40) * 0.008);
  }

  // Базовая формула: (Тоннаж / Вес / Минуты) * 25 * Kпол * Kвозраст
  // При 12 000 кг, 80 кг веса, 45 мин:
  // (12000 / 80 / 45) = 3.33 -> 3.33 * 25 = 83.33 (Майстер)
  // При 15 000 кг, 80 кг веса, 42 мин:
  // (15000 / 80 / 42) = 4.46 -> 4.46 * 21 = 93.6 (Титан)
  const rawScore = (relativeTonnage / durationMinutes) * 26 * genderCoeff * ageCoeff;

  // Ограничиваем диапазоном 45 - 100
  const score = Math.max(45, Math.min(100, Math.round(rawScore)));

  let tierKey: AthleticScoreResult["tierKey"] = "active";
  if (score >= 95) {
    tierKey = "titan";
  } else if (score >= 85) {
    tierKey = "iron_pro";
  } else if (score >= 75) {
    tierKey = "power_master";
  } else {
    tierKey = "active";
  }

  return {
    score,
    tierKey,
    relativeTonnage: Number(relativeTonnage.toFixed(1)),
    densityKgPerMin,
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

