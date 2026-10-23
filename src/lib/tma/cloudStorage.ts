// Telegram CloudStorage + Server Cross-Device Sync Manager (Mobile <-> Desktop <-> Web)
// Uses compact sync payloads (<3KB) so data never hits Telegram's 4096-char limit or hangs.

import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { usePrepStore } from "@/lib/store/usePrepStore";
import { getTelegramUser } from "@/lib/tma/telegram";
import { generateFullProgram, DEFAULT_EXERCISES } from "@/lib/smt/generator";
import { ExerciseDefinition } from "@/types/smt";

const TIMEOUT_MS = 1200; // Strict timeout to prevent Telegram Desktop IPC hangs

export interface CompactSyncPayload {
  v: number;
  updatedAt: number;
  telegramId: string;
  oneRepMaxes: Record<string, number>;
  weightStep: number;
  completed: Array<{
    n: number;
    cAt?: string;
    sAt?: string;
    dur?: number;
    ton?: number;
    pow?: number;
    notes?: string;
    sets: Array<{
      sId: string;
      eId: string;
      num: number;
      w?: number;
      r?: number;
    }>;
  }>;
  measurements?: any[];
  settings?: any;
  prep?: any[];
}

export interface CloudSyncResult {
  success: boolean;
  message: string;
  updatedStores: string[];
  workoutsCount?: number;
}

export function isCloudStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).Telegram?.WebApp?.CloudStorage);
}

function getCloudInstance() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.CloudStorage || null;
}

export function getActiveTelegramId(): string | null {
  if (typeof window === "undefined") return null;
  const tgUser = getTelegramUser();
  if (tgUser?.id) return String(tgUser.id);
  const linked = useSettingsStore.getState().linkedTelegramUser?.id;
  if (linked) return String(linked);
  const cached = localStorage.getItem("smt_tg_user_id");
  if (cached) return cached;
  return null;
}

/**
 * Strict timeout wrapper so Telegram Desktop or slow networks never hang
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs = TIMEOUT_MS, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, timeoutMs);

    promise.then(
      (val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      }
    );
  });
}

/**
 * Builds a compact (<3KB) payload of active progress to fit cleanly in a single Telegram Cloud key
 */
export function buildCompactPayload(): CompactSyncPayload {
  const telegramId = getActiveTelegramId() || "anonymous";
  const workoutState = useWorkoutStore.getState();
  const settingsState = useSettingsStore.getState();
  const bodyState = useBodyStore.getState();
  const prepState = usePrepStore.getState();

  const oneRepMaxes: Record<string, number> = {};
  const exercises = workoutState.exercises && workoutState.exercises.length > 0
    ? workoutState.exercises
    : DEFAULT_EXERCISES;

  for (const ex of exercises) {
    if (ex.id && ex.oneRepMax) {
      oneRepMaxes[ex.id] = ex.oneRepMax;
    }
  }

  const completedList: CompactSyncPayload["completed"] = [];
  const workouts = workoutState.workouts || [];

  for (const w of workouts) {
    if (w.status === "completed" || Boolean(w.completedAt)) {
      const sets: CompactSyncPayload["completed"][0]["sets"] = [];
      if (Array.isArray(w.supersets)) {
        for (const ss of w.supersets) {
          if (Array.isArray(ss.exercises)) {
            for (const ex of ss.exercises) {
              if (Array.isArray(ex.sets)) {
                for (const s of ex.sets) {
                  if (s.completed || s.actualWeight !== undefined || s.actualReps !== undefined) {
                    sets.push({
                      sId: ss.id,
                      eId: ex.exerciseId,
                      num: s.setNumber,
                      w: s.actualWeight,
                      r: s.actualReps,
                    });
                  }
                }
              }
            }
          }
        }
      }

      completedList.push({
        n: w.workoutNumber,
        cAt: w.completedAt,
        sAt: w.startedAt,
        dur: w.durationSeconds,
        ton: w.tonnageKg,
        pow: w.powerKgPerMin,
        notes: w.notes,
        sets,
      });
    }
  }

  return {
    v: 1,
    updatedAt: Date.now(),
    telegramId,
    oneRepMaxes,
    weightStep: settingsState.weightIncrementKg || 2.5,
    completed: completedList,
    measurements: bodyState.measurements || [],
    settings: {
      soundEnabled: settingsState.soundEnabled,
      hapticsEnabled: settingsState.hapticsEnabled,
      keepScreenAwake: settingsState.keepScreenAwake,
      weightIncrementKg: settingsState.weightIncrementKg,
      language: settingsState.language,
      linkedTelegramUser: settingsState.linkedTelegramUser,
      coachTelegramUsername: settingsState.coachTelegramUsername,
    },
    prep: prepState.sessions || [],
  };
}

/**
 * Inflates a compact payload into full Zustand stores and saves to localStorage
 */
export function applyCompactPayload(payload: CompactSyncPayload): void {
  if (!payload || !payload.oneRepMaxes) return;

  // 1. Update exercises with remote 1RMs
  const currentExercises = useWorkoutStore.getState().exercises;
  const baseExercises: ExerciseDefinition[] =
    currentExercises && currentExercises.length > 0 ? currentExercises : DEFAULT_EXERCISES;

  const updatedExercises = baseExercises.map((ex) => {
    if (payload.oneRepMaxes[ex.id]) {
      return { ...ex, oneRepMax: payload.oneRepMaxes[ex.id] };
    }
    return ex;
  });

  // 2. Deterministically regenerate full 36-workout program
  const fullWorkouts = generateFullProgram(updatedExercises, payload.weightStep || 2.5);

  // 3. Apply completed workouts data
  if (Array.isArray(payload.completed)) {
    for (const comp of payload.completed) {
      const targetWorkout = fullWorkouts.find((w) => w.workoutNumber === comp.n);
      if (targetWorkout) {
        targetWorkout.status = "completed";
        targetWorkout.completedAt = comp.cAt;
        targetWorkout.startedAt = comp.sAt;
        targetWorkout.durationSeconds = comp.dur;
        targetWorkout.tonnageKg = comp.ton;
        targetWorkout.powerKgPerMin = comp.pow;
        targetWorkout.notes = comp.notes;

        if (Array.isArray(comp.sets)) {
          for (const s of comp.sets) {
            const ss = targetWorkout.supersets.find((item) => item.id === s.sId);
            if (ss && Array.isArray(ss.exercises)) {
              const ex = ss.exercises.find((item) => item.exerciseId === s.eId);
              if (ex && Array.isArray(ex.sets)) {
                const targetSet = ex.sets.find((item) => item.setNumber === s.num);
                if (targetSet) {
                  targetSet.completed = true;
                  if (s.w !== undefined) targetSet.actualWeight = s.w;
                  if (s.r !== undefined) targetSet.actualReps = s.r;
                }
              }
            }
          }
        }
      }
    }
  }

  // 4. Update WorkoutStore & LocalStorage
  useWorkoutStore.setState({
    exercises: updatedExercises,
    workouts: fullWorkouts,
    hasHydrated: true,
  });

  try {
    localStorage.setItem(
      "smt_workouts_v2",
      JSON.stringify({
        state: {
          exercises: updatedExercises,
          workouts: fullWorkouts,
          hasHydrated: true,
        },
        version: 0,
      })
    );
  } catch {}

  // 5. Update Measurements
  if (Array.isArray(payload.measurements)) {
    useBodyStore.setState({ measurements: payload.measurements });
    try {
      localStorage.setItem(
        "smt_measurements",
        JSON.stringify({ state: { measurements: payload.measurements }, version: 0 })
      );
    } catch {}
  }

  // 6. Update Settings
  if (payload.settings) {
    useSettingsStore.setState(payload.settings);
    try {
      localStorage.setItem(
        "smt_settings",
        JSON.stringify({ state: payload.settings, version: 0 })
      );
    } catch {}
  }

  // 7. Update Prep
  if (Array.isArray(payload.prep)) {
    usePrepStore.setState({ sessions: payload.prep });
    try {
      localStorage.setItem(
        "smt_prep_v1",
        JSON.stringify({ state: { sessions: payload.prep }, version: 0 })
      );
    } catch {}
  }
}

// Backward compatibility aliases
export async function saveToCloudStorage(key: string, value: string): Promise<boolean> {
  try {
    localStorage.setItem(key, value);
  } catch {}
  const payload = buildCompactPayload();
  return saveToTelegramCloud(payload);
}

export async function getFromCloudStorage(_key: string): Promise<string | null> {
  const payload = await getFromTelegramCloud();
  return payload ? JSON.stringify(payload) : null;
}

/**
 * Save compact payload to Telegram CloudStorage
 */
export async function saveToTelegramCloud(payload: CompactSyncPayload): Promise<boolean> {
  const cloud = getCloudInstance();
  if (!cloud) return false;

  const json = JSON.stringify(payload);
  if (json.length > 4096) {
    console.warn("[CloudStorage] Payload exceeds 4096 limit, skipping single-key TG save:", json.length);
    return false;
  }

  const p = new Promise<boolean>((resolve) => {
    try {
      cloud.setItem("smt_compact_v3", json, (error: any, success?: boolean) => {
        resolve(!error && Boolean(success));
      });
    } catch {
      resolve(false);
    }
  });

  return withTimeout(p, TIMEOUT_MS, false);
}

/**
 * Read compact payload from Telegram CloudStorage using getKeys first to avoid Desktop hanging
 */
export async function getFromTelegramCloud(): Promise<CompactSyncPayload | null> {
  const cloud = getCloudInstance();
  if (!cloud) return null;

  // 1. First get keys list to ensure key exists (Telegram Desktop bug workaround)
  const keysPromise = new Promise<string[]>((resolve) => {
    try {
      cloud.getKeys((error: any, keys?: string[]) => {
        if (error || !Array.isArray(keys)) resolve([]);
        else resolve(keys);
      });
    } catch {
      resolve([]);
    }
  });

  const availableKeys = await withTimeout(keysPromise, 800, []);
  if (!availableKeys.includes("smt_compact_v3")) {
    return null;
  }

  // 2. Fetch the key since we know it exists
  const getPromise = new Promise<string | null>((resolve) => {
    try {
      cloud.getItem("smt_compact_v3", (error: any, value?: string) => {
        if (error || !value) resolve(null);
        else resolve(value);
      });
    } catch {
      resolve(null);
    }
  });

  const rawJson = await withTimeout(getPromise, TIMEOUT_MS, null);
  if (!rawJson) return null;

  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

let isSyncInProgress = false;

/**
 * Master Cross-Device Synchronization
 * 1. Checks fast server API /api/user/sync (~30ms)
 * 2. Checks Telegram CloudStorage (~100ms with timeout)
 * 3. Evaluates progress: whoever has more completed workouts wins
 * 4. Pushes local if local is ahead or if forceUpload is requested
 */
export async function syncAllStoresWithCloud(options?: {
  forceUpload?: boolean;
}): Promise<CloudSyncResult> {
  if (typeof window === "undefined") {
    return { success: false, message: "SSR", updatedStores: [] };
  }

  if (isSyncInProgress) {
    return { success: true, message: "Синхронізація триває...", updatedStores: [] };
  }

  isSyncInProgress = true;
  const updatedStores: string[] = [];

  try {
    const telegramId = getActiveTelegramId();
    const localPayload = buildCompactPayload();
    const localCount = localPayload.completed.length;

    let remotePayload: CompactSyncPayload | null = null;
    let remoteSource = "none";

    // 1. LAYER 1: Fast Server HTTP Sync
    if (telegramId && telegramId !== "anonymous") {
      try {
        const fetchPromise = fetch(`/api/user/sync?telegramId=${telegramId}`, {
          cache: "no-store",
        }).then((res) => res.json());

        const serverRes = await withTimeout(fetchPromise, 1200, null);
        if (serverRes?.ok && serverRes.data) {
          remotePayload = serverRes.data as CompactSyncPayload;
          remoteSource = "server";
        }
      } catch (err) {
        console.warn("[Sync] Server sync fallback:", err);
      }
    }

    // 2. LAYER 2: Telegram CloudStorage (if server had no progress or is offline)
    if ((!remotePayload || remotePayload.completed.length === 0) && isCloudStorageAvailable()) {
      try {
        const tgCloudPayload = await getFromTelegramCloud();
        if (tgCloudPayload && tgCloudPayload.completed) {
          if (!remotePayload || tgCloudPayload.completed.length > remotePayload.completed.length) {
            remotePayload = tgCloudPayload;
            remoteSource = "telegram_cloud";
          }
        }
      } catch (err) {
        console.warn("[Sync] Telegram Cloud fallback:", err);
      }
    }

    const remoteCount = remotePayload?.completed?.length || 0;

    // 3. DECISION & MERGE
    if (remotePayload && (remoteCount > localCount || (localCount === 0 && remoteCount > 0))) {
      // Remote has strictly more completed workouts -> Apply remote to local!
      applyCompactPayload(remotePayload);
      updatedStores.push("smt_workouts_v2", "smt_measurements", "smt_settings", "smt_prep_v1");

      return {
        success: true,
        message: `✅ Оновлено з ${remoteSource === "server" ? "сервера" : "хмари Telegram"}! Завантажено тренувань: ${remoteCount}`,
        updatedStores,
        workoutsCount: remoteCount,
      };
    } else if (localCount > remoteCount || options?.forceUpload || (!remotePayload && localCount > 0)) {
      // Local has more completed workouts -> Push local to both server and TG Cloud!
      if (telegramId && telegramId !== "anonymous") {
        void fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId, data: localPayload }),
        }).catch(() => {});
      }

      if (isCloudStorageAvailable()) {
        void saveToTelegramCloud(localPayload);
      }

      return {
        success: true,
        message: `✅ Дані синхронізовано з хмарою (тренувань: ${localCount})`,
        updatedStores,
        workoutsCount: localCount,
      };
    } else {
      // Both devices are in sync
      // Still refresh TG cloud in background if available
      if (localCount > 0 && isCloudStorageAvailable()) {
        void saveToTelegramCloud(localPayload);
      }

      return {
        success: true,
        message: `✅ Дані актуальні (тренувань: ${localCount})`,
        updatedStores,
        workoutsCount: localCount,
      };
    }
  } catch (err: any) {
    console.error("[Sync] Master sync error:", err);
    return {
      success: false,
      message: err?.message || "Помилка синхронізації",
      updatedStores,
    };
  } finally {
    isSyncInProgress = false;
  }
}

let isInitialized = false;
let autoSyncTimer: any = null;

export function initCloudSync(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // 1. Initial sync immediately on startup
  void syncAllStoresWithCloud();

  // 2. Sync whenever window gains focus (user switched from mobile to desktop)
  window.addEventListener("focus", () => {
    void syncAllStoresWithCloud();
  });

  // 3. Debounced auto-push on any local state changes
  const triggerAutoPush = () => {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(() => {
      const telegramId = getActiveTelegramId();
      if (!telegramId || telegramId === "anonymous") return;

      const payload = buildCompactPayload();

      // Push to fast server
      fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, data: payload }),
      }).catch(() => {});

      // Push to Telegram CloudStorage
      if (isCloudStorageAvailable()) {
        void saveToTelegramCloud(payload);
      }
    }, 1500);
  };

  useWorkoutStore.subscribe(triggerAutoPush);
  useBodyStore.subscribe(triggerAutoPush);
  useSettingsStore.subscribe(triggerAutoPush);
  usePrepStore.subscribe(triggerAutoPush);
}
