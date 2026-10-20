// Telegram CloudStorage Wrapper (Zero-DB cloud sync across user's devices)

/**
 * Checks if Telegram CloudStorage is available
 */
export function isCloudStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.CloudStorage);
}

/**
 * Save an item to Telegram CloudStorage with fallback to localStorage
 */
export async function saveToCloudStorage(key: string, value: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Always save to localStorage for offline cache
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors (e.g. quota exceeded or incognito)
  }

  const cloud = window.Telegram?.WebApp?.CloudStorage;
  if (!cloud) {
    return true;
  }

  return new Promise((resolve) => {
    cloud.setItem(key, value, (error, success) => {
      if (error) {
        console.warn("[CloudStorage] Failed to save key:", key, error);
        resolve(false);
      } else {
        resolve(Boolean(success));
      }
    });
  });
}

/**
 * Get an item from Telegram CloudStorage with fallback to localStorage
 */
export async function getFromCloudStorage(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cloud = window.Telegram?.WebApp?.CloudStorage;
  if (!cloud) {
    return localStorage.getItem(key);
  }

  return new Promise((resolve) => {
    cloud.getItem(key, (error, value) => {
      if (error || !value) {
        // Fallback to local storage
        resolve(localStorage.getItem(key));
      } else {
        resolve(value);
      }
    });
  });
}

/**
 * Remove an item from Telegram CloudStorage & localStorage
 */
export async function removeFromCloudStorage(key: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }

  const cloud = window.Telegram?.WebApp?.CloudStorage;
  if (!cloud) return true;

  return new Promise((resolve) => {
    cloud.removeItem(key, (error, success) => {
      resolve(!error && Boolean(success));
    });
  });
}
