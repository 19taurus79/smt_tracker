// Screen Wake Lock API Manager for Workout Sessions
// Keeps mobile screen alive during active workouts

class WakeLockManager {
  private sentinel: any = null;
  private isRequested: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.isRequested) {
          this.acquire();
        }
      });
    }
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && "wakeLock" in navigator;
  }

  public async acquire(): Promise<boolean> {
    if (!this.isSupported()) return false;
    this.isRequested = true;

    try {
      if (this.sentinel && !this.sentinel.released) {
        return true;
      }

      this.sentinel = await (navigator as any).wakeLock.request("screen");
      this.sentinel.addEventListener("release", () => {
        this.sentinel = null;
      });
      return true;
    } catch (err) {
      console.warn("WakeLock acquisition notice:", err);
      return false;
    }
  }

  public async release(): Promise<void> {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {}
      this.sentinel = null;
    }
  }

  public isActive(): boolean {
    return Boolean(this.sentinel && !this.sentinel.released);
  }
}

export const wakeLockManager = new WakeLockManager();
