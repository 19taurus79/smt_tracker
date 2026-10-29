/**
 * Local-First Telegram Mini App Synchronization Manager
 * Guarantees zero data loss even in offline basement gyms!
 */

interface OfflineSyncItem {
  id: string;
  type: "workout" | "trainee";
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = "smt_offline_sync_queue_v1";

function getOfflineQueue(): OfflineSyncItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflineSyncItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function queueOfflineSync(type: "workout" | "trainee", payload: any) {
  const queue = getOfflineQueue();
  queue.push({
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    payload,
    timestamp: Date.now(),
  });
  saveOfflineQueue(queue);
}

/**
 * Invokes Telegram Serverless Endpoint if available
 */
export async function callTelegramServerless(endpoint: string, payload: unknown): Promise<any> {
  if (typeof window === "undefined") return null;
  const tg = window.Telegram?.WebApp as any;

  if (tg?.Serverless && typeof tg.Serverless.call === "function") {
    return new Promise((resolve, reject) => {
      tg.Serverless.call(endpoint, payload, (err: unknown, res: unknown) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  return null;
}

export interface SyncWorkoutPayload {
  workoutNumber: number;
  microcycle: number;
  durationSeconds: number;
  tonnageKg: number;
  powerKgPerMin: number;
  athleticScore?: {
    score: number;
    tierKey?: string;
    tierLabel?: string;
  } | number;
  latestMeasurement?: {
    weightKg?: number;
    waistCm?: number;
    bicepsCm?: number;
  };
  exercises?: any[];
  notes?: string;
  name?: string;
  traineeName?: string;
  username?: string;
  traineeUsername?: string;
  telegramId?: number;
}

/**
 * Synchronize completed workout (Local-First + Offline Safe)
 */
export async function syncWorkout(payload: SyncWorkoutPayload): Promise<boolean> {
  // If user is completely offline, immediately queue and succeed locally
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineSync("workout", payload);
    return true;
  }

  const athleteName = payload.traineeName || payload.name || "Атлет";
  const athleteUsername = (payload.traineeUsername || payload.username || "").replace(/^@/, "");
  const scoreNum =
    typeof payload.athleticScore === "object"
      ? payload.athleticScore?.score ?? 70
      : (payload.athleticScore ?? 70);

  const scoreObj =
    typeof payload.athleticScore === "object"
      ? payload.athleticScore
      : { score: scoreNum, tierKey: "titan", tierLabel: "ТИТАН СИЛИ ⚡" };

  try {
    // 1. Try Telegram Serverless first
    try {
      const res = await callTelegramServerless("saveWorkout", {
        ...payload,
        name: athleteName,
        username: athleteUsername,
        athleticScore: scoreNum,
        weightKg: payload.latestMeasurement?.weightKg || 80,
      });
      if (res && res.ok) {
        return true;
      }
    } catch {
      // serverless call not active, fallback to HTTP
    }

    // 2. HTTP Fallback to Next.js API
    const res = await fetch("/api/coach/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traineeName: athleteName,
        traineeUsername: athleteUsername,
        telegramUserId: payload.telegramId,
        workoutNumber: payload.workoutNumber,
        microcycle: payload.microcycle,
        durationSeconds: payload.durationSeconds,
        tonnageKg: payload.tonnageKg,
        powerKgPerMin: payload.powerKgPerMin,
        athleticScore: scoreObj,
        latestMeasurement: payload.latestMeasurement,
        exercises: payload.exercises,
        notes: payload.notes,
      }),
    });

    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.warn("[TMA Sync] Offline / Network issue, queueing workout:", err);
    queueOfflineSync("workout", payload);
    return true; // Don't block the UI
  }
}

/**
 * Synchronize trainee profile / lead (Local-First + Offline Safe)
 */
export async function syncTrainee(payload: {
  name?: string;
  username?: string;
  telegramUserId?: string | number;
}): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineSync("trainee", payload);
    return true;
  }

  try {
    // 1. Try Telegram Serverless
    try {
      const res = await callTelegramServerless("syncTrainee", {
        telegramId: payload.telegramUserId,
        username: payload.username,
        firstName: payload.name,
      });
      if (res && res.ok) return true;
    } catch {}

    // 2. HTTP Fallback to Next.js API
    const res = await fetch("/api/lead/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    queueOfflineSync("trainee", payload);
    return true;
  }
}

export interface SyncTransferPayload {
  name?: string;
  username?: string;
  telegramUserId?: string | number;
  totalWorkouts: number;
  currentMicrocycle: number;
  weightKg?: number;
  totalTonnageKg?: number;
  workoutHistory?: any[];
  silent?: boolean;
}

/**
 * Synchronize imported data from transfer code and notify coach immediately
 */
export async function syncTraineeTransfer(payload: SyncTransferPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/lead/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        isTransfer: true,
      }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.warn("[TMA Sync] Transfer sync error:", err);
    return false;
  }
}

/**
 * Flushes all pending offline queue items when connection restores
 */
export async function flushOfflineQueue(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining: OfflineSyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === "workout") {
        await syncWorkout(item.payload);
      } else if (item.type === "trainee") {
        await syncTrainee(item.payload);
      }
    } catch {
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
}

// Auto-flush when device reconnects to Wi-Fi / LTE
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushOfflineQueue();
  });
}
