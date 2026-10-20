// Telegram WebApp SDK Safe Wrapper & Haptic/SafeArea Manager

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        colorScheme: "light" | "dark";
        themeParams: Record<string, string>;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        safeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
        contentSafeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function initTelegramWebApp(): void {
  if (typeof window === "undefined") return;

  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();

    const updateSafeArea = () => {
      const root = document.documentElement;
      if (tg.safeAreaInset) {
        root.style.setProperty("--tg-safe-area-inset-top", `${tg.safeAreaInset.top}px`);
        root.style.setProperty("--tg-safe-area-inset-bottom", `${tg.safeAreaInset.bottom}px`);
        root.style.setProperty("--tg-safe-area-inset-left", `${tg.safeAreaInset.left}px`);
        root.style.setProperty("--tg-safe-area-inset-right", `${tg.safeAreaInset.right}px`);
      }
      if (tg.contentSafeAreaInset) {
        root.style.setProperty(
          "--tg-content-safe-area-inset-top",
          `${tg.contentSafeAreaInset.top}px`
        );
        root.style.setProperty(
          "--tg-content-safe-area-inset-bottom",
          `${tg.contentSafeAreaInset.bottom}px`
        );
      }
    };

    updateSafeArea();

    // Официальные camelCase события Bot API 8.0
    tg.onEvent("safeAreaChanged", updateSafeArea);
    tg.onEvent("contentSafeAreaChanged", updateSafeArea);
    tg.onEvent("fullscreenChanged", updateSafeArea);
  } catch (err) {
    console.warn("Telegram WebApp initialization notice:", err);
  }
}

export function triggerHaptic(type: "impact" | "success" | "warning" = "impact"): void {
  if (typeof window === "undefined") return;

  const tg = window.Telegram?.WebApp as any;
  const isSupportedTgHaptic =
    tg?.HapticFeedback &&
    (typeof tg.isVersionAtLeast === "function" ? tg.isVersionAtLeast("6.1") : true);

  if (isSupportedTgHaptic) {
    try {
      if (type === "success") {
        tg.HapticFeedback.notificationOccurred("success");
      } else if (type === "warning") {
        tg.HapticFeedback.notificationOccurred("warning");
      } else {
        tg.HapticFeedback.impactOccurred("medium");
      }
      return;
    } catch {
      // fallback to browser vibration
    }
  }

  // Fallback for mobile browser / PWA / older TMA
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      if (type === "success") {
        navigator.vibrate([80, 40, 100]);
      } else if (type === "warning") {
        navigator.vibrate([120, 60, 120]);
      } else {
        navigator.vibrate(50);
      }
    } catch {
      // ignore
    }
  }
}

