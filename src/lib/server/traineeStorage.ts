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

function ensureDataFile(): TraineeProfile[] {
  if (cacheLoaded && memoryCache.length > 0) {
    return memoryCache;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(content) as TraineeProfile[];
      memoryCache = parsed;
      cacheLoaded = true;
      return parsed;
    }
    // Also try local data/trainees.json if in serverless
    const fallbackPath = path.resolve(process.cwd(), "data", "trainees.json");
    if (fs.existsSync(fallbackPath)) {
      try {
        const content = fs.readFileSync(fallbackPath, "utf8");
        const parsed = JSON.parse(content) as TraineeProfile[];
        memoryCache = parsed;
        cacheLoaded = true;
        return parsed;
      } catch {}
    }
    cacheLoaded = true;
    return memoryCache;
  } catch (err) {
    console.error("[traineeStorage] Error reading data file:", err);
    return memoryCache;
  }
}

function saveDataFile(trainees: TraineeProfile[]): void {
  memoryCache = trainees;
  cacheLoaded = true;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }
    const tmpFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(trainees, null, 2), "utf8");
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
    const updated: TraineeProfile = {
      ...target,
      name: lead.name || target.name,
      username: cleanUsername || target.username,
      telegramChatId: tgIdStr || target.telegramChatId,
      currentMicrocycle: lead.currentMicrocycle !== undefined ? lead.currentMicrocycle : target.currentMicrocycle,
      totalWorkouts: lead.totalWorkouts !== undefined ? Math.max(target.totalWorkouts, lead.totalWorkouts) : target.totalWorkouts,
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

  const newTrainee: TraineeProfile = {
    id: `trainee-${Date.now()}`,
    name: lead.name || (cleanUsername ? `@${cleanUsername}` : "Новий атлет"),
    username: cleanUsername,
    telegramChatId: tgIdStr,
    avatarColor: getRandomGradient(),
    gender: "male",
    age: 28,
    currentMicrocycle: lead.currentMicrocycle || 1,
    currentWorkoutNumber: (lead.totalWorkouts || 0) + 1,
    totalWorkouts: lead.totalWorkouts || 0,
    weightKg: lead.weightKg || 80,
    weightDeltaKg: 0,
    lastWorkoutDate: now,
    athleticScore: 70,
    tierKey: lead.tierKey || (lead.totalWorkouts && lead.totalWorkouts > 0 ? "active" : "lead"),
    tierLabel: lead.tierLabel || (lead.totalWorkouts && lead.totalWorkouts > 0 ? "Активний Атлет 🏋️‍♂️" : "НОВИЙ ЛІД 🔥"),
    status: lead.status || (lead.totalWorkouts && lead.totalWorkouts > 0 ? "active" : "new_lead"),
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
    const updated: TraineeProfile = {
      ...target,
      name: data.traineeName || target.name,
      currentWorkoutNumber: data.workoutNumber,
      currentMicrocycle: data.microcycle,
      totalWorkouts: target.totalWorkouts + 1,
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
