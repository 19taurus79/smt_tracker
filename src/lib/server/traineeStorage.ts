import fs from "fs";
import path from "path";

export interface TraineeWorkoutRecord {
  id: string;
  workoutNumber: number;
  microcycle: number;
  date: string;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore: number;
  tierKey: "titan" | "iron_pro" | "power_master" | "active" | "lead";
  tierLabel: string;
  notes?: string;
  exercises: Array<{
    name: string;
    weight: number;
    reps: number;
    setsCount: number;
    supersetLabel?: string;
  }>;
}

export interface TraineeProfile {
  id: string;
  name: string;
  alias?: string;
  username: string;
  telegramChatId?: string;
  avatarColor: string;
  gender: "male" | "female";
  age: number;
  currentMicrocycle: number;
  currentWorkoutNumber: number;
  totalWorkouts: number;
  weightKg: number;
  weightDeltaKg: number;
  lastWorkoutDate: string;
  athleticScore: number;
  tierKey: "titan" | "iron_pro" | "power_master" | "active" | "lead";
  tierLabel: string;
  status: "active" | "resting" | "needs_attention" | "new_lead" | "blocked";
  coachNotes: string;
  workoutHistory: TraineeWorkoutRecord[];
  measurementHistory: Array<{
    id: string;
    date: string;
    weightKg: number;
    waistCm?: number;
    bicepsCm?: number;
  }>;
}

import os from "os";

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_SERVERLESS ? os.tmpdir() : path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "smt_trainees.json");

// In-memory cache across serverless requests in the same lambda
let memoryCache: TraineeProfile[] = [];
let cacheLoaded = false;

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-red-600",
];

function getRandomGradient(): string {
  const idx = Math.floor(Math.random() * AVATAR_GRADIENTS.length);
  return AVATAR_GRADIENTS[idx];
}

export function autoDeduplicateTrainees(trainees: TraineeProfile[]): TraineeProfile[] {
  if (!trainees || trainees.length <= 1) return trainees || [];

  const merged: TraineeProfile[] = [];
  const handledIds = new Set<string>();

  for (let i = 0; i < trainees.length; i++) {
    const current = trainees[i];
    if (handledIds.has(current.id)) continue;

    let duplicateIndex = -1;
    for (let j = i + 1; j < trainees.length; j++) {
      if (handledIds.has(trainees[j].id)) continue;
      const candidate = trainees[j];

      // 1. Exact match on Telegram ID
      const sameTgId = Boolean(current.telegramChatId && candidate.telegramChatId && current.telegramChatId === candidate.telegramChatId);
      // 2. Exact match on username
      const sameUsername = Boolean(current.username && candidate.username && current.username.toLowerCase() === candidate.username.toLowerCase());
      // 3. One is orphan without username/tgId, or name matches, or single other trainee in team
      const currentNameClean = current.name.toLowerCase().trim();
      const candNameClean = candidate.name.toLowerCase().trim();
      const sameName = Boolean(currentNameClean && candNameClean && (currentNameClean === candNameClean || currentNameClean.includes(candNameClean) || candNameClean.includes(currentNameClean)));
      const oneIsOrphan = (!current.username && !current.telegramChatId) || (!candidate.username && !candidate.telegramChatId);
      const isOnlyPair = trainees.length === 2 && oneIsOrphan;

      if (sameTgId || sameUsername || (sameName && oneIsOrphan) || isOnlyPair) {
        duplicateIndex = j;
        break;
      }
    }

    if (duplicateIndex >= 0) {
      const candidate = trainees[duplicateIndex];
      handledIds.add(candidate.id);

      // Prefer the profile that has Telegram linking
      const primary = (current.telegramChatId || current.username) ? current : candidate;
      const secondary = primary === current ? candidate : current;

      // Select real human name over telegram username handle if available
      const humanName = [secondary.name, primary.name].find(n => n && !n.startsWith("@") && n.toLowerCase() !== (primary.username || "").toLowerCase()) || primary.name;
      const aliasName = primary.name !== humanName ? primary.name : (secondary.name !== humanName ? secondary.name : undefined);

      const combinedWorkouts = [...(primary.workoutHistory || []), ...(secondary.workoutHistory || [])];
      const seenWorkouts = new Set<string>();
      const dedupedWorkouts: TraineeWorkoutRecord[] = [];
      for (const w of combinedWorkouts) {
        const key = `${w.workoutNumber}_${w.microcycle}`;
        if (!seenWorkouts.has(key)) {
          seenWorkouts.add(key);
          dedupedWorkouts.push(w);
        }
      }

      const combinedMeasurements = [...(primary.measurementHistory || []), ...(secondary.measurementHistory || [])];
      const bestWeight = primary.weightKg && primary.weightKg !== 80 ? primary.weightKg : (secondary.weightKg || primary.weightKg || 80);

      let finalTotal = Math.max(primary.totalWorkouts || 0, secondary.totalWorkouts || 0, dedupedWorkouts.length);
      const targetMicrocycle = Math.max(primary.currentMicrocycle || 1, secondary.currentMicrocycle || 1);
      if (finalTotal >= 36 && targetMicrocycle <= 2) {
        finalTotal = Math.max(dedupedWorkouts.length, 3);
      }
      const finalWorkoutNumber = Math.min(36, finalTotal + 1);

      const mergedTrainee: TraineeProfile = {
        ...primary,
        name: humanName,
        alias: aliasName || primary.alias || secondary.alias,
        username: primary.username || secondary.username,
        telegramChatId: primary.telegramChatId || secondary.telegramChatId,
        totalWorkouts: finalTotal,
        currentWorkoutNumber: finalWorkoutNumber,
        currentMicrocycle: targetMicrocycle,
        weightKg: bestWeight,
        status: primary.status === "blocked" || secondary.status === "blocked" ? "blocked" : "active",
        tierKey: (primary.tierKey !== "lead" ? primary.tierKey : secondary.tierKey) || "active",
        tierLabel: (primary.tierKey !== "lead" ? primary.tierLabel : secondary.tierLabel) || "Активний Атлет",
        coachNotes: primary.coachNotes ? `${primary.coachNotes}` : secondary.coachNotes,
        workoutHistory: dedupedWorkouts,
        measurementHistory: combinedMeasurements,
      };

      merged.push(mergedTrainee);
      handledIds.add(current.id);
    } else {
      let sanitized = current;
      if (sanitized.totalWorkouts >= 36 && sanitized.currentMicrocycle <= 2) {
        sanitized = {
          ...sanitized,
          totalWorkouts: Math.max(sanitized.workoutHistory?.length || 0, 3),
          currentWorkoutNumber: Math.min(36, (sanitized.workoutHistory?.length || 3) + 1),
        };
      }
      merged.push(sanitized);
      handledIds.add(current.id);
    }
  }

  return merged;
}

function ensureDataFile(): TraineeProfile[] {
  if (cacheLoaded && memoryCache.length > 0) {
    const deduped = autoDeduplicateTrainees(memoryCache);
    memoryCache = deduped;
    return deduped;
  }
  try {
    const baselinePath = path.resolve(process.cwd(), "data", "trainees.json");
    let baselineData: TraineeProfile[] = [];
    if (fs.existsSync(baselinePath)) {
      try {
        const content = fs.readFileSync(baselinePath, "utf8");
        baselineData = JSON.parse(content) as TraineeProfile[];
      } catch (err) {
        console.warn("[traineeStorage] Error reading baseline trainees.json:", err);
      }
    }

    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }

    let loadedTrainees: TraineeProfile[] = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const content = fs.readFileSync(DATA_FILE, "utf8");
        loadedTrainees = JSON.parse(content) as TraineeProfile[];
      } catch {}
    }

    const combined = [...loadedTrainees, ...baselineData];
    const deduped = autoDeduplicateTrainees(combined);
    memoryCache = deduped;
    cacheLoaded = true;
    if (deduped.length > 0) {
      saveDataFile(deduped);
    }
    return deduped;
  } catch (err) {
    console.error("[traineeStorage] Error reading data file:", err);
    return memoryCache;
  }
}

function saveDataFile(trainees: TraineeProfile[]): void {
  const deduped = autoDeduplicateTrainees(trainees);
  memoryCache = deduped;
  cacheLoaded = true;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }
    const tmpFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(deduped, null, 2), "utf8");
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.warn("[traineeStorage] Warning saving data file (cached in memory):", err);
  }
}

export function getAllTrainees(): TraineeProfile[] {
  return ensureDataFile();
}

export function registerOrUpdateLead(lead: {
  name: string;
  username?: string;
  telegramUserId?: string | number;
  totalWorkouts?: number;
  currentMicrocycle?: number;
  weightKg?: number;
  status?: TraineeProfile["status"];
  tierKey?: TraineeProfile["tierKey"];
  tierLabel?: string;
  coachNotes?: string;
}): TraineeProfile {
  const trainees = ensureDataFile();
  const cleanUsername = (lead.username || "").toLowerCase().replace(/^@/, "").trim();
  const tgIdStr = lead.telegramUserId ? String(lead.telegramUserId) : undefined;

  let existingIndex = -1;
  if (tgIdStr) {
    existingIndex = trainees.findIndex((t) => t.telegramChatId === tgIdStr);
  }
  if (existingIndex === -1 && cleanUsername) {
    existingIndex = trainees.findIndex(
      (t) => t.username.toLowerCase() === cleanUsername
    );
  }

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const target = trainees[existingIndex];
    let newTotal = target.totalWorkouts;
    const targetMc = lead.currentMicrocycle !== undefined ? lead.currentMicrocycle : target.currentMicrocycle;
    if (lead.totalWorkouts !== undefined) {
      newTotal = lead.totalWorkouts;
    }
    if (newTotal >= 36 && targetMc <= 2) {
      newTotal = Math.max(target.workoutHistory?.length || 0, 3);
    }
    const nextWorkoutNum = Math.min(36, newTotal + 1);

    const updated: TraineeProfile = {
      ...target,
      name: lead.name || target.name,
      username: cleanUsername || target.username,
      telegramChatId: tgIdStr || target.telegramChatId,
      currentMicrocycle: targetMc,
      currentWorkoutNumber: nextWorkoutNum,
      totalWorkouts: newTotal,
      weightKg: lead.weightKg !== undefined ? lead.weightKg : target.weightKg,
      status: lead.status || target.status,
      tierKey: lead.tierKey || target.tierKey,
      tierLabel: lead.tierLabel || target.tierLabel,
      coachNotes: lead.coachNotes || target.coachNotes,
      lastWorkoutDate: target.lastWorkoutDate || now,
    };
    trainees[existingIndex] = updated;
    saveDataFile(trainees);
    return updated;
  }

  const initialTotal = lead.totalWorkouts || 0;
  const newTrainee: TraineeProfile = {
    id: `trainee-${Date.now()}`,
    name: lead.name || (cleanUsername ? `@${cleanUsername}` : "Новий атлет"),
    username: cleanUsername,
    telegramChatId: tgIdStr,
    avatarColor: getRandomGradient(),
    gender: "male",
    age: 28,
    currentMicrocycle: lead.currentMicrocycle || 1,
    currentWorkoutNumber: Math.min(36, initialTotal + 1),
    totalWorkouts: initialTotal,
    weightKg: lead.weightKg || 80,
    weightDeltaKg: 0,
    lastWorkoutDate: now,
    athleticScore: 70,
    tierKey: lead.tierKey || (initialTotal > 0 ? "active" : "lead"),
    tierLabel: lead.tierLabel || (initialTotal > 0 ? "Активний Атлет 🏋️‍♂️" : "НОВИЙ ЛІД 🔥"),
    status: lead.status || (initialTotal > 0 ? "active" : "new_lead"),
    coachNotes: lead.coachNotes || "Підписався на канал і запустив трекер.",
    workoutHistory: [],
    measurementHistory: [],
  };

  trainees.unshift(newTrainee);
  saveDataFile(trainees);
  return newTrainee;
}

export function recordWorkoutForTrainee(data: {
  traineeName?: string;
  traineeUsername?: string;
  telegramUserId?: string | number;
  workoutNumber: number;
  microcycle: number;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore?: {
    score: number;
    tierKey?: string;
    tierLabel?: string;
  };
  latestMeasurement?: {
    weightKg?: number;
    waistCm?: number;
    bicepsCm?: number;
  };
  exercises?: Array<{
    name: string;
    weight: number;
    reps: number;
    setsCount: number;
    supersetLabel?: string;
  }>;
  notes?: string;
}): TraineeProfile {
  const trainees = ensureDataFile();
  const cleanUsername = (data.traineeUsername || "").toLowerCase().replace(/^@/, "").trim();
  const tgIdStr = data.telegramUserId ? String(data.telegramUserId) : undefined;

  let existingIndex = -1;
  if (tgIdStr) {
    existingIndex = trainees.findIndex((t) => t.telegramChatId === tgIdStr);
  }
  if (existingIndex === -1 && cleanUsername) {
    existingIndex = trainees.findIndex(
      (t) => t.username.toLowerCase() === cleanUsername
    );
  }

  const now = new Date().toISOString();
  const scoreVal = data.athleticScore?.score || 75;
  const tierKeyVal = (data.athleticScore?.tierKey as TraineeProfile["tierKey"]) || "active";
  const tierLabelVal = data.athleticScore?.tierLabel || "Активний Атлет";

  const workoutRecord: TraineeWorkoutRecord = {
    id: `w-${Date.now()}`,
    workoutNumber: data.workoutNumber,
    microcycle: data.microcycle,
    date: now,
    durationSeconds: data.durationSeconds,
    tonnageKg: data.tonnageKg,
    powerKgPerMin: data.powerKgPerMin,
    athleticScore: scoreVal,
    tierKey: tierKeyVal,
    tierLabel: tierLabelVal,
    notes: data.notes,
    exercises: data.exercises || [],
  };

  if (existingIndex >= 0) {
    const target = trainees[existingIndex];
    const updatedHistory = [workoutRecord, ...target.workoutHistory];
    let prevTotal = target.totalWorkouts;
    if (prevTotal >= 36 && data.microcycle <= 2) {
      prevTotal = Math.max(target.workoutHistory.length, data.workoutNumber - 1);
    }
    const newTotal = prevTotal + 1;
    const updated: TraineeProfile = {
      ...target,
      name: data.traineeName || target.name,
      currentWorkoutNumber: Math.min(36, data.workoutNumber + 1),
      currentMicrocycle: data.microcycle,
      totalWorkouts: newTotal,
      lastWorkoutDate: now,
      athleticScore: scoreVal,
      tierKey: tierKeyVal,
      tierLabel: tierLabelVal,
      status: target.status === "blocked" ? "blocked" : "active",
      workoutHistory: updatedHistory,
    };

    if (data.latestMeasurement && typeof data.latestMeasurement.weightKg === "number") {
      const mWeight = data.latestMeasurement.weightKg;
      updated.weightKg = mWeight;
      updated.measurementHistory = [
        {
          id: `m-${Date.now()}`,
          date: now,
          weightKg: mWeight,
          waistCm: data.latestMeasurement.waistCm,
          bicepsCm: data.latestMeasurement.bicepsCm,
        },
        ...target.measurementHistory,
      ];
    }

    trainees[existingIndex] = updated;
    saveDataFile(trainees);
    return updated;
  }

  const newTrainee: TraineeProfile = {
    id: `trainee-${Date.now()}`,
    name: data.traineeName || (cleanUsername ? `@${cleanUsername}` : "Атлет"),
    username: cleanUsername,
    telegramChatId: tgIdStr,
    avatarColor: getRandomGradient(),
    gender: "male",
    age: 28,
    currentMicrocycle: data.microcycle,
    currentWorkoutNumber: data.workoutNumber,
    totalWorkouts: 1,
    weightKg: data.latestMeasurement?.weightKg || 80,
    weightDeltaKg: 0,
    lastWorkoutDate: now,
    athleticScore: scoreVal,
    tierKey: tierKeyVal,
    tierLabel: tierLabelVal,
    status: "active",
    coachNotes: "Виконав перше тренування в трекері.",
    workoutHistory: [workoutRecord],
    measurementHistory:
      data.latestMeasurement && typeof data.latestMeasurement.weightKg === "number"
        ? [
            {
              id: `m-${Date.now()}`,
              date: now,
              weightKg: data.latestMeasurement.weightKg,
              waistCm: data.latestMeasurement.waistCm,
              bicepsCm: data.latestMeasurement.bicepsCm,
            },
          ]
        : [],
  };

  trainees.unshift(newTrainee);
  saveDataFile(trainees);
  return newTrainee;
}

export function updateTraineeDetails(
  id: string,
  updates: Partial<TraineeProfile>
): TraineeProfile | null {
  const trainees = ensureDataFile();
  const idx = trainees.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  trainees[idx] = {
    ...trainees[idx],
    ...updates,
  };
  saveDataFile(trainees);
  return trainees[idx];
}

export function deleteTraineeProfile(id: string): boolean {
  const trainees = ensureDataFile();
  const filtered = trainees.filter((t) => t.id !== id);
  if (filtered.length !== trainees.length) {
    saveDataFile(filtered);
    return true;
  }
  return false;
}
