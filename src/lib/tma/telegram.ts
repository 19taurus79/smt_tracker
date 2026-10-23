// Telegram WebApp SDK Safe Wrapper & Haptic/SafeArea/Fullscreen Manager
// Tailored for 100% Pure Telegram Mini App (TMA) Experience

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
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          receiver?: unknown;
          chat?: unknown;
          chat_type?: string;
          chat_instance?: string;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        // Bot API 8.0 Fullscreen
        requestFullscreen?: () => void;
        exitFullscreen?: () => void;
        isFullscreen?: boolean;
        // Bot API 7.7+ Vertical Swipes Lock (prevents closing app while training)
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        isVerticalSwipesEnabled?: boolean;
        // Bot API 6.2+ Closing Confirmation
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
        isClosingConfirmationEnabled?: boolean;
        // Colors & Theme
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        // Native Back Button
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        // Native Taptic Engine Haptic Feedback
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        // Safe Areas (iOS Dynamic Island, notch, home bar)
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
        // CloudStorage
        CloudStorage?: {
          setItem: (key: string, value: string, callback?: (error: Error | null, success?: boolean) => void) => void;
          getItem: (key: string, callback: (error: Error | null, value?: string) => void) => void;
          getItems: (keys: string[], callback: (error: Error | null, values?: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: Error | null, success?: boolean) => void) => void;
          getKeys: (callback: (error: Error | null, keys?: string[]) => void) => void;
        };
        // Telegram Stories Sharing (Bot API 7.8+)
        shareToStory?: (mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
        // Telegram Serverless call
        Serverless?: {
          call: (endpoint: string, input: unknown, callback: (err: unknown, result: unknown) => void) => void;
        };
        isVersionAtLeast?: (version: string) => boolean;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.initData || window.Telegram?.WebApp?.initDataUnsafe?.user);
}

export function getTelegramUser() {
  if (typeof window === "undefined") return null;

  // 1. Direct initDataUnsafe.user
  let user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (user?.id) {
    try {
      localStorage.setItem("smt_tg_user_id", String(user.id));
      localStorage.setItem("smt_tg_user_data", JSON.stringify(user));
    } catch {}
    return user;
  }

  // 2. Parse initData query string
  try {
    const rawInitData = window.Telegram?.WebApp?.initData;
    if (rawInitData) {
      const params = new URLSearchParams(rawInitData);
      const userStr = params.get("user");
      if (userStr) {
        user = JSON.parse(userStr);
        if (user?.id) {
          localStorage.setItem("smt_tg_user_id", String(user.id));
          return user;
        }
      }
    }
  } catch {}

  // 3. Parse tgWebAppData from location hash
  try {
    const hash = window.location.hash;
    if (hash && hash.includes("tgWebAppData=")) {
      const match = hash.match(/tgWebAppData=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        const params = new URLSearchParams(decoded);
        const userStr = params.get("user");
        if (userStr) {
          user = JSON.parse(userStr);
          if (user?.id) {
            localStorage.setItem("smt_tg_user_id", String(user.id));
            return user;
          }
        }
      }
    }
  } catch {}

  // 4. Fallback to cached user in localStorage
  try {
    const cachedData = localStorage.getItem("smt_tg_user_data");
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed?.id) return parsed;
    }
    const cachedId = localStorage.getItem("smt_tg_user_id");
    if (cachedId) {
      return { id: Number(cachedId), first_name: "Атлет" };
    }
  } catch {}

  return null;
}

export function initTelegramWebApp(): void {
  if (typeof window === "undefined") return;

  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    // 1. Mark ready
    tg.ready();

    // 2. Expand to full viewport
    tg.expand();

    // 3. Request true fullscreen (Bot API 8.0)
    if (typeof tg.requestFullscreen === "function") {
      try {
        tg.requestFullscreen();
      } catch (e) {
        console.warn("requestFullscreen call:", e);
      }
    }

    // 4. Disable vertical swipes (Bot API 7.7+)
    // CRITICAL: prevents accidental app minimize when scrolling / tapping in workout
    if (typeof tg.disableVerticalSwipes === "function") {
      try {
        tg.disableVerticalSwipes();
      } catch (e) {
        console.warn("disableVerticalSwipes call:", e);
      }
    }

    // 5. Header and background theme styling
    if (typeof tg.setHeaderColor === "function") {
      try {
        tg.setHeaderColor("#020617"); // slate-950
      } catch {}
    }
    if (typeof tg.setBackgroundColor === "function") {
      try {
        tg.setBackgroundColor("#020617");
      } catch {}
    }

    // 6. Safe Area insets
    const updateSafeArea = () => {
      const root = document.documentElement;
      const isTg = Boolean(window.Telegram?.WebApp?.initData || window.Telegram?.WebApp?.initDataUnsafe?.user);
      if (isTg) {
        root.classList.add("is-telegram");
        document.body?.classList.add("is-telegram");
      }

      const safeTop = tg.safeAreaInset?.top || 0;
      const contentTop = tg.contentSafeAreaInset?.top || 0;

      if (tg.safeAreaInset) {
        root.style.setProperty("--tg-safe-area-inset-top", `${safeTop}px`);
        root.style.setProperty("--tg-safe-area-inset-bottom", `${tg.safeAreaInset.bottom}px`);
        root.style.setProperty("--tg-safe-area-inset-left", `${tg.safeAreaInset.left}px`);
        root.style.setProperty("--tg-safe-area-inset-right", `${tg.safeAreaInset.right}px`);
      }
      if (tg.contentSafeAreaInset) {
        root.style.setProperty("--tg-content-safe-area-inset-top", `${contentTop}px`);
        root.style.setProperty("--tg-content-safe-area-inset-bottom", `${tg.contentSafeAreaInset.bottom}px`);
      }

      // In fullscreen TMA, Telegram overlay buttons ([✕ Закрити] and [⋮]) require at least 62px clearance
      const effectiveTop = Math.max(safeTop, contentTop, isTg ? 62 : 0);
      root.style.setProperty("--tma-top-padding", `${effectiveTop}px`);
    };

    updateSafeArea();

    // Official event listeners
    tg.onEvent("safeAreaChanged", updateSafeArea);
    tg.onEvent("contentSafeAreaChanged", updateSafeArea);
    tg.onEvent("fullscreenChanged", updateSafeArea);
  } catch (err) {
    console.warn("Telegram WebApp initialization notice:", err);
  }
}

/**
 * Configure Workout Mode: lock swipes and enable confirmation on close
 */
export function setWorkoutActiveMode(isActive: boolean): void {
  if (typeof window === "undefined") return;
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    if (isActive) {
      if (typeof tg.disableVerticalSwipes === "function") tg.disableVerticalSwipes();
      if (typeof tg.enableClosingConfirmation === "function") tg.enableClosingConfirmation();
    } else {
      if (typeof tg.disableClosingConfirmation === "function") tg.disableClosingConfirmation();
    }
  } catch {}
}

/**
 * Native Taptic Engine Haptic Feedback
 */
export type HapticType =
  | "impact"
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "rigid"
  | "soft"
  | "success"
  | "warning"
  | "error";

export function triggerHaptic(type: HapticType = "medium"): void {
  if (typeof window === "undefined") return;

  const tg = window.Telegram?.WebApp;
  const haptic = tg?.HapticFeedback;

  if (haptic) {
    try {
      if (type === "selection") {
        haptic.selectionChanged();
        return;
      }
      if (type === "success" || type === "warning" || type === "error") {
        haptic.notificationOccurred(type);
        return;
      }
      if (type === "light" || type === "medium" || type === "heavy" || type === "rigid" || type === "soft") {
        haptic.impactOccurred(type);
        return;
      }
      // default impact
      haptic.impactOccurred("medium");
      return;
    } catch {
      // fallback
    }
  }

  // Fallback for desktop / regular browser vibration
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      if (type === "success") {
        navigator.vibrate([80, 40, 100]);
      } else if (type === "warning" || type === "error") {
        navigator.vibrate([120, 60, 120]);
      } else if (type === "heavy") {
        navigator.vibrate(80);
      } else if (type === "selection" || type === "light") {
        navigator.vibrate(20);
      } else {
        navigator.vibrate(50);
      }
    } catch {}
  }
}

/**
 * Native Telegram BackButton integration
 */
export function registerTgBackButton(onBack: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const tg = window.Telegram?.WebApp;
  const backBtn = tg?.BackButton;

  if (!backBtn) return () => {};

  try {
    backBtn.onClick(onBack);
    backBtn.show();

    return () => {
      try {
        backBtn.offClick(onBack);
        backBtn.hide();
      } catch {}
    };
  } catch {
    return () => {};
  }
}
