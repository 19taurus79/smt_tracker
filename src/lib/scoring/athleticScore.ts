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
