// Telegram CloudStorage Wrapper (Zero-DB cloud sync across user's devices: Mobile <-> Desktop <-> Web)

import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { usePrepStore } from "@/lib/store/usePrepStore";

// Telegram limits values to 4096 characters per key.
// We use 3600 characters per chunk to stay safely below limits.
const CHUNK_SIZE = 3600;

export interface CloudSyncResult {
  success: boolean;
  message: string;
  updatedStores: string[];
  cloudWorkoutsCount?: number;
  localWorkoutsCount?: number;
}

/**
 * Checks if Telegram CloudStorage is available in current Telegram client
 */
export function isCloudStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).Telegram?.WebApp?.CloudStorage);
}

function getCloudInstance() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.CloudStorage || null;
}

/**
 * Save an item to Telegram CloudStorage with automatic chunking for large payloads.
 * Always writes to localStorage synchronously for offline persistence.
 */
export async function saveToCloudStorage(key: string, value: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Always write to localStorage for instant offline access
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors (e.g. quota or incognito)
  }

  const cloud = getCloudInstance();
  if (!cloud) {
    return true;
  }

  try {
    if (value.length <= CHUNK_SIZE) {
      // Small payload: direct single-key save
      const ok = await new Promise<boolean>((resolve) => {
        cloud.setItem(key, value, (error: any, success?: boolean) => {
          if (error) {
            console.warn(`[CloudStorage] Failed to save key "${key}":`, error);
            resolve(false);
          } else {
            resolve(Boolean(success));
          }
        });
      });

      // Clean up any obsolete chunk meta if present
      cloud.removeItem(`${key}__meta`, () => {});
      return ok;
    }

    // Large payload: chunking into CHUNK_SIZE slices
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    const chunkPromises = chunks.map((chunk, idx) => {
      return new Promise<boolean>((resolve) => {
        cloud.setItem(`${key}__c${idx}`, chunk, (error: any, success?: boolean) => {
          if (error) {
            console.warn(`[CloudStorage] Failed chunk "${key}__c${idx}":`, error);
            resolve(false);
          } else {
            resolve(Boolean(success));
          }
        });
      });
    });

    const results = await Promise.all(chunkPromises);
    const allChunksOk = results.every(Boolean);

    if (!allChunksOk) {
      console.warn(`[CloudStorage] Not all chunks saved for "${key}"`);
      return false;
    }

    // Save meta descriptor
    const metaPayload = JSON.stringify({
      chunks: chunks.length,
      totalLen: value.length,
      updatedAt: Date.now(),
    });

    return await new Promise<boolean>((resolve) => {
      cloud.setItem(`${key}__meta`, metaPayload, (error: any, success?: boolean) => {
        if (error) {
          console.warn(`[CloudStorage] Failed meta for "${key}":`, error);
          resolve(false);
        } else {
          resolve(Boolean(success));
        }
      });
    });
  } catch (err) {
    console.error(`[CloudStorage] saveToCloudStorage exception for "${key}":`, err);
    return false;
  }
}

/**
 * Get an item from Telegram CloudStorage (with chunk reassembly) or fallback to localStorage
 */
export async function getFromCloudStorage(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cloud = getCloudInstance();
  if (!cloud) {
    return localStorage.getItem(key);
  }

  try {
    // 1. Check if chunked meta exists
    const metaStr = await new Promise<string | null>((resolve) => {
      cloud.getItem(`${key}__meta`, (error: any, value?: string) => {
        if (error || !value) {
          resolve(null);
        } else {
          resolve(value);
        }
      });
    });

    if (metaStr) {
      try {
        const meta = JSON.parse(metaStr);
        if (meta && typeof meta.chunks === "number" && meta.chunks > 0) {
          const chunkKeys: string[] = Array.from(
            { length: meta.chunks },
            (_, i) => `${key}__c${i}`
          );

          const chunksObj = await new Promise<Record<string, string> | null>((resolve) => {
            cloud.getItems(chunkKeys, (error: any, values?: Record<string, string>) => {
              if (error || !values) {
                resolve(null);
              } else {
                resolve(values);
              }
            });
          });

          if (chunksObj) {
            let assembled = "";
            for (const k of chunkKeys) {
              assembled += chunksObj[k] || "";
            }
            if (assembled.length > 0) {
              return assembled;
            }
          }
        }
      } catch (parseErr) {
        console.warn(`[CloudStorage] Failed to parse meta for "${key}":`, parseErr);
      }
    }

    // 2. Not chunked or meta missing: read direct key
    return await new Promise<string | null>((resolve) => {
      cloud.getItem(key, (error: any, value?: string) => {
        if (error || !value) {
          resolve(localStorage.getItem(key));
        } else {
          resolve(value);
        }
      });
    });
  } catch (err) {
    console.error(`[CloudStorage] getFromCloudStorage exception for "${key}":`, err);
    return localStorage.getItem(key);
  }
}

/**
 * Remove an item from Telegram CloudStorage & localStorage
 */
export async function removeFromCloudStorage(key: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    localStorage.removeItem(key);
  } catch {}

  const cloud = getCloudInstance();
  if (!cloud) return true;

  return new Promise((resolve) => {
    cloud.removeItem(key, (error: any, success?: boolean) => {
      cloud.removeItem(`${key}__meta`, () => {});
      resolve(!error && Boolean(success));
    });
  });
}

// --- Helpers to weigh progress and avoid overwriting richer data ---

function getWorkoutWeight(parsed: any): { completedCount: number; maxDate: number } {
  const workouts = parsed?.state?.workouts || parsed?.workouts || [];
  let completedCount = 0;
  let maxDate = 0;
  if (Array.isArray(workouts)) {
    for (const w of workouts) {
      if (w?.status === "completed") {
        completedCount++;
        if (w?.completedAt) {
          const t = new Date(w.completedAt).getTime();
          if (t > maxDate) maxDate = t;
        }
      }
    }
  }
  return { completedCount, maxDate };
}

function getMeasurementWeight(parsed: any): { count: number; maxDate: number } {
  const measurements = parsed?.state?.measurements || parsed?.measurements || [];
  let count = 0;
  let maxDate = 0;
  if (Array.isArray(measurements)) {
    count = measurements.length;
    for (const m of measurements) {
      if (m?.date) {
        const t = new Date(m.date).getTime();
        if (t > maxDate) maxDate = t;
      }
    }
  }
  return { count, maxDate };
}

let isSyncInProgress = false;

/**
 * Synchronizes all app stores between localStorage and Telegram CloudStorage.
 * Intelligently preserves user's completed workouts and progress.
 */
export async function syncAllStoresWithCloud(options?: {
  forceUpload?: boolean;
  forceDownload?: boolean;
}): Promise<CloudSyncResult> {
  if (typeof window === "undefined") {
    return { success: false, message: "SSR environment", updatedStores: [] };
  }

  if (isSyncInProgress) {
    return { success: true, message: "Синхронізація вже виконується", updatedStores: [] };
  }

  isSyncInProgress = true;
  const updatedStores: string[] = [];

  try {
    const cloudAvailable = isCloudStorageAvailable();

    // 1. WORKOUTS STORE ("smt_workouts_v2")
    const localWorkoutsRaw = localStorage.getItem("smt_workouts_v2");
    let cloudWorkoutsCount = 0;
    let localWorkoutsCount = 0;

    if (cloudAvailable) {
      const cloudWorkoutsRaw = await getFromCloudStorage("smt_workouts_v2");

      let localParsed: any = null;
      let cloudParsed: any = null;
      try {
        if (localWorkoutsRaw) localParsed = JSON.parse(localWorkoutsRaw);
      } catch {}
      try {
        if (cloudWorkoutsRaw) cloudParsed = JSON.parse(cloudWorkoutsRaw);
      } catch {}

      const localWeight = getWorkoutWeight(localParsed);
      const cloudWeight = getWorkoutWeight(cloudParsed);
      localWorkoutsCount = localWeight.completedCount;
      cloudWorkoutsCount = cloudWeight.completedCount;

      if (options?.forceUpload && localWorkoutsRaw) {
        await saveToCloudStorage("smt_workouts_v2", localWorkoutsRaw);
      } else if (options?.forceDownload && cloudWorkoutsRaw && cloudParsed) {
        localStorage.setItem("smt_workouts_v2", cloudWorkoutsRaw);
        if (cloudParsed.state) useWorkoutStore.setState(cloudParsed.state, false);
        updatedStores.push("smt_workouts_v2");
      } else if (!localWorkoutsRaw && cloudWorkoutsRaw && cloudParsed) {
        // Desktop first open: empty locally, restore from cloud!
        localStorage.setItem("smt_workouts_v2", cloudWorkoutsRaw);
        if (cloudParsed.state) useWorkoutStore.setState(cloudParsed.state, false);
        updatedStores.push("smt_workouts_v2");
      } else if (localWorkoutsRaw && !cloudWorkoutsRaw) {
        // Mobile tested first: upload local to cloud!
        await saveToCloudStorage("smt_workouts_v2", localWorkoutsRaw);
      } else if (localWorkoutsRaw && cloudWorkoutsRaw && localParsed && cloudParsed) {
        // Both exist: compare progress!
        if (cloudWeight.completedCount > localWeight.completedCount) {
          // Cloud has more completed workouts -> download from cloud!
          localStorage.setItem("smt_workouts_v2", cloudWorkoutsRaw);
          if (cloudParsed.state) useWorkoutStore.setState(cloudParsed.state, false);
          updatedStores.push("smt_workouts_v2");
        } else if (localWeight.completedCount > cloudWeight.completedCount) {
          // Local has more completed workouts -> upload to cloud!
          await saveToCloudStorage("smt_workouts_v2", localWorkoutsRaw);
        } else if (cloudWeight.maxDate > localWeight.maxDate && cloudWeight.maxDate > 0) {
          // Equal completed workouts, but cloud is newer
          localStorage.setItem("smt_workouts_v2", cloudWorkoutsRaw);
          if (cloudParsed.state) useWorkoutStore.setState(cloudParsed.state, false);
          updatedStores.push("smt_workouts_v2");
        } else {
          // Local is equal or newer -> upload to ensure cloud has latest state
          await saveToCloudStorage("smt_workouts_v2", localWorkoutsRaw);
        }
      }
    }

    // 2. MEASUREMENTS STORE ("smt_measurements")
    if (cloudAvailable) {
      const localMeasRaw = localStorage.getItem("smt_measurements");
      const cloudMeasRaw = await getFromCloudStorage("smt_measurements");

      let localMeasParsed: any = null;
      let cloudMeasParsed: any = null;
      try {
        if (localMeasRaw) localMeasParsed = JSON.parse(localMeasRaw);
      } catch {}
      try {
        if (cloudMeasRaw) cloudMeasParsed = JSON.parse(cloudMeasRaw);
      } catch {}

      const localMeasW = getMeasurementWeight(localMeasParsed);
      const cloudMeasW = getMeasurementWeight(cloudMeasParsed);

      if (!localMeasRaw && cloudMeasRaw && cloudMeasParsed) {
        localStorage.setItem("smt_measurements", cloudMeasRaw);
        if (cloudMeasParsed.state) useBodyStore.setState(cloudMeasParsed.state, false);
        updatedStores.push("smt_measurements");
      } else if (localMeasRaw && !cloudMeasRaw) {
        await saveToCloudStorage("smt_measurements", localMeasRaw);
      } else if (localMeasRaw && cloudMeasRaw) {
        if (cloudMeasW.count > localMeasW.count) {
          localStorage.setItem("smt_measurements", cloudMeasRaw);
          if (cloudMeasParsed?.state) useBodyStore.setState(cloudMeasParsed.state, false);
          updatedStores.push("smt_measurements");
        } else if (localMeasW.count > cloudMeasW.count) {
          await saveToCloudStorage("smt_measurements", localMeasRaw);
        } else {
          await saveToCloudStorage("smt_measurements", localMeasRaw);
        }
      }
    }

    // 3. SETTINGS STORE ("smt_settings")
    if (cloudAvailable) {
      const localSetRaw = localStorage.getItem("smt_settings");
      const cloudSetRaw = await getFromCloudStorage("smt_settings");

      let localSetParsed: any = null;
      let cloudSetParsed: any = null;
      try {
        if (localSetRaw) localSetParsed = JSON.parse(localSetRaw);
      } catch {}
      try {
        if (cloudSetRaw) cloudSetParsed = JSON.parse(cloudSetRaw);
      } catch {}

      if (!localSetRaw && cloudSetRaw && cloudSetParsed) {
        localStorage.setItem("smt_settings", cloudSetRaw);
        if (cloudSetParsed.state) useSettingsStore.setState(cloudSetParsed.state, false);
        updatedStores.push("smt_settings");
      } else if (localSetRaw && !cloudSetRaw) {
        await saveToCloudStorage("smt_settings", localSetRaw);
      } else if (localSetRaw && cloudSetRaw && localSetParsed && cloudSetParsed) {
        // If cloud has linked telegram user and local doesn't
        if (cloudSetParsed.state?.linkedTelegramUser && !localSetParsed.state?.linkedTelegramUser) {
          localStorage.setItem("smt_settings", cloudSetRaw);
          if (cloudSetParsed.state) useSettingsStore.setState(cloudSetParsed.state, false);
          updatedStores.push("smt_settings");
        } else {
          await saveToCloudStorage("smt_settings", localSetRaw);
        }
      }
    }

    // 4. PREP STORE ("smt_prep_v1")
    if (cloudAvailable) {
      const localPrepRaw = localStorage.getItem("smt_prep_v1");
      const cloudPrepRaw = await getFromCloudStorage("smt_prep_v1");

      let localPrepParsed: any = null;
      let cloudPrepParsed: any = null;
      try {
        if (localPrepRaw) localPrepParsed = JSON.parse(localPrepRaw);
      } catch {}
      try {
        if (cloudPrepRaw) cloudPrepParsed = JSON.parse(cloudPrepRaw);
      } catch {}

      if (!localPrepRaw && cloudPrepRaw && cloudPrepParsed) {
        localStorage.setItem("smt_prep_v1", cloudPrepRaw);
        if (cloudPrepParsed.state) usePrepStore.setState(cloudPrepParsed.state, false);
        updatedStores.push("smt_prep_v1");
      } else if (localPrepRaw && !cloudPrepRaw) {
        await saveToCloudStorage("smt_prep_v1", localPrepRaw);
      } else if (localPrepRaw && cloudPrepRaw) {
        const localDone = (localPrepParsed?.state?.completedSessions || []).length;
        const cloudDone = (cloudPrepParsed?.state?.completedSessions || []).length;
        if (cloudDone > localDone) {
          localStorage.setItem("smt_prep_v1", cloudPrepRaw);
          if (cloudPrepParsed?.state) usePrepStore.setState(cloudPrepParsed.state, false);
          updatedStores.push("smt_prep_v1");
        } else {
          await saveToCloudStorage("smt_prep_v1", localPrepRaw);
        }
      }
    }

    return {
      success: true,
      message: "Синхронізація успішна",
      updatedStores,
      cloudWorkoutsCount,
      localWorkoutsCount,
    };
  } catch (err: any) {
    console.error("[CloudStorage] Sync error:", err);
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
let workoutSaveTimer: any = null;
let measSaveTimer: any = null;
let settingsSaveTimer: any = null;
let prepSaveTimer: any = null;

/**
 * Initializes automatic background synchronization between active device and Telegram CloudStorage.
 * Call once on app startup (e.g. in TelegramProvider).
 */
export function initCloudSync(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // 1. Initial sync on boot
  void syncAllStoresWithCloud();

  // 2. Sync whenever window/tab regains focus (e.g. user switched from mobile to desktop)
  window.addEventListener("focus", () => {
    void syncAllStoresWithCloud();
  });

  // 3. Debounced auto-push on any local state changes
  useWorkoutStore.subscribe(() => {
    clearTimeout(workoutSaveTimer);
    workoutSaveTimer = setTimeout(() => {
      const raw = localStorage.getItem("smt_workouts_v2");
      if (raw) {
        void saveToCloudStorage("smt_workouts_v2", raw);
      }
    }, 1500);
  });

  useBodyStore.subscribe(() => {
    clearTimeout(measSaveTimer);
    measSaveTimer = setTimeout(() => {
      const raw = localStorage.getItem("smt_measurements");
      if (raw) {
        void saveToCloudStorage("smt_measurements", raw);
      }
    }, 1500);
  });

  useSettingsStore.subscribe(() => {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(() => {
      const raw = localStorage.getItem("smt_settings");
      if (raw) {
        void saveToCloudStorage("smt_settings", raw);
      }
    }, 1500);
  });

  usePrepStore.subscribe(() => {
    clearTimeout(prepSaveTimer);
    prepSaveTimer = setTimeout(() => {
      const raw = localStorage.getItem("smt_prep_v1");
      if (raw) {
        void saveToCloudStorage("smt_prep_v1", raw);
      }
    }, 1500);
  });
}
