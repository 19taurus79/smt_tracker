---
name: telegram-mini-app
description: Comprehensive expert guide for building, designing, and optimizing Telegram Mini Apps (TMA/TWA) with Next.js, React, or modern web frameworks. Use this skill when creating or modifying Telegram Mini App client interfaces, handling Telegram WebApp lifecycle (ready, expand, full-screen), theming & CSS variables, safe areas, native UI buttons (MainButton, BackButton), haptics, CloudStorage, Biometrics, and user context.
---

# Telegram Mini App (TMA) Development Skill

> **Official Telegram Web App Documentation**: [core.telegram.org/bots/webapps](https://core.telegram.org/bots/webapps)

This skill provides best practices, architectural patterns, and production-tested recipes for building Telegram Mini Apps (TWAs), specifically optimized for modern React / Next.js web applications.

---

## 1. Core Lifecycle & Initialization

Every Telegram Mini App runs inside a sandboxed WebView within the Telegram client (iOS, Android, macOS, Windows, Web). Proper lifecycle management is critical to prevent blank screens and glitches.

### Initialization Sequence

1. **Wait for DOM & Load Script**: Ensure `telegram-web-app.js` is loaded (via `<script src="https://telegram.org/js/telegram-web-app.js">` or `@twa-dev/sdk` / `@telegram-apps/sdk`).
2. **Signal Readiness**: Call `Telegram.WebApp.ready()` as soon as the initial UI is rendered. Telegram hides its native loading skeleton only after `ready()`.
3. **Expand Viewport**: Call `Telegram.WebApp.expand()` so the app opens at maximum height rather than a half-sheet (recommended for rich apps).
4. **Closing Confirmation (Optional)**: If the user might lose unsaved state (e.g. active workout, form filling), call `Telegram.WebApp.enableClosingConfirmation()`.

### Next.js / React SSR Safe Pattern

In Next.js (App Router), `window` and `Telegram` are not available on the server during SSR. Always access `Telegram.WebApp` inside `useEffect` or dynamically imported client components:

```tsx
'use client';

import { useEffect, useState } from 'react';

export function useTelegramWebApp() {
  const [isReady, setIsReady] = useState(false);
  const [tg, setTg] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const app = (window as any).Telegram.WebApp;
      app.ready();
      app.expand();
      setTg(app);
      setIsReady(true);
    }
  }, []);

  return { tg, isReady, user: tg?.initDataUnsafe?.user };
}
```

---

## 2. Theming & Telegram CSS Variables

Telegram automatically synchronizes the theme of the Mini App with the user's client (Light/Dark mode, customized accents).

### The Golden Rule: Avoid Hardcoded Colors
Always use Telegram's CSS custom properties (with fallback values for desktop/browser preview):

| CSS Variable | Theme Property | Description |
| :--- | :--- | :--- |
| `--tg-theme-bg-color` | `bg_color` | Main background color |
| `--tg-theme-text-color` | `text_color` | Primary body text |
| `--tg-theme-hint-color` | `hint_color` | Secondary / muted text |
| `--tg-theme-link-color` | `link_color` | Accent / link color |
| `--tg-theme-button-color` | `button_color` | Primary action button color |
| `--tg-theme-button-text-color` | `button_text_color` | Primary action button text |
| `--tg-theme-secondary-bg-color` | `secondary_bg_color` | Card / surface background |
| `--tg-theme-header-bg-color` | `header_bg_color` | Top header bar background |
| `--tg-theme-bottom-bar-bg-color` | `bottom_bar_bg_color` | Bottom bar background |
| `--tg-theme-section-bg-color` | `section_bg_color` | Grouped section background |
| `--tg-theme-section-separator-color` | `section_separator_color` | Divider lines |
| `--tg-theme-destructive-text-color` | `destructive_text_color` | Danger / delete actions |

### Header & Background Colors
Set the native Telegram header color and background to blend smoothly:
```typescript
Telegram.WebApp.setHeaderColor(Telegram.WebApp.themeParams.secondary_bg_color || '#18181b');
Telegram.WebApp.setBackgroundColor(Telegram.WebApp.themeParams.bg_color || '#09090b');
```

---

## 3. Safe Areas & Full-Screen (iOS / Android)

Modern mobile devices have camera cutouts (Dynamic Island, notches) and system navigation bars. Overlapping these leads to unclickable buttons.

### CSS Safe Area Insets
Telegram injects two sets of safe area variables:

```css
/* System Safe Area (hardware notches, system bars) */
padding-top: var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px));
padding-bottom: var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));

/* Content Safe Area (includes Telegram's top header / close button & bottom navigation) */
padding-top: var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, 0px));
padding-bottom: var(--tg-content-safe-area-inset-bottom, var(--tg-safe-area-inset-bottom, 0px));
```

### Full-Screen Mode
In Telegram Bot API 8.0+:
```typescript
if (Telegram.WebApp.isFullscreen === false) {
  Telegram.WebApp.requestFullscreen();
}
```
*Note: Full-screen mode hides Telegram's native title bar; ensure your UI provides an accessible back/close mechanism.*

---

## 4. Native UI Components

Using native Telegram UI components makes the app feel like a first-class citizen inside the messenger.

### MainButton & SecondaryButton
Positioned sticky at the bottom of the Telegram screen outside the web view:
```typescript
const { MainButton } = Telegram.WebApp;

// Show button with loading state
MainButton.setText('СОХРАНИТЬ ТРЕНИРОВКУ');
MainButton.show();
MainButton.enable();

MainButton.onClick(() => {
  MainButton.showProgress();
  saveWorkout().finally(() => {
    MainButton.hideProgress();
  });
});

// Always clean up listeners on unmount
return () => {
  MainButton.offClick(handleSave);
  MainButton.hide();
};
```

### BackButton
Controls the native back arrow in the top header:
```typescript
const { BackButton } = Telegram.WebApp;

if (router.canGoBack()) {
  BackButton.show();
  BackButton.onClick(() => router.back());
} else {
  BackButton.hide();
}
```

### Haptic Feedback
Provides tactile confirmation for interactions (key for workout logging, counter buttons, switches):
```typescript
const { HapticFeedback } = Telegram.WebApp;

// Impact for clicks / taps
HapticFeedback.impactOccurred('light');   // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'

// Notification for outcome
HapticFeedback.notificationOccurred('success'); // 'success' | 'warning' | 'error'

// Selection changed (e.g. picker scroll)
HapticFeedback.selectionChanged();
```

---

## 5. Native Telegram Features

### 1. Telegram Stories (`shareToStory`)
Share rich media or achievements directly to the user's Telegram Stories:
```typescript
Telegram.WebApp.shareToStory(mediaUrl, {
  text: 'Завершил тренировку в SMT Tracker! 💪',
  widget_link: {
    url: 'https://t.me/smt_tracker_bot/app',
    name: 'Открыть трекер'
  }
});
```

### 2. Telegram Stars Payments (`openInvoice`)
In-app digital goods payments using Telegram Stars (XTR):
```typescript
Telegram.WebApp.openInvoice(invoiceLink, (status) => {
  if (status === 'paid') {
    // Payment successful
  } else if (status === 'cancelled') {
    // User cancelled
  } else if (status === 'failed') {
    // Payment failed
  }
});
```

### 3. Native Storage Options
- **`Telegram.WebApp.CloudStorage`**: Lightweight key-value store synced across user devices (up to 1024 keys, 4KB per value). Ideal for UI preferences and offline drafts.
- **`Telegram.WebApp.DeviceStorage`**: Local persistent storage up to 5MB on the current device.
- **`Telegram.WebApp.SecureStorage`**: Encrypted storage backed by OS keychain/keystore.

---

## 6. Security & Backend Authentication

When communicating with external backends:
- **`Telegram.WebApp.initData`**: Signed query string generated by Telegram.
- **`Telegram.WebApp.initDataUnsafe`**: Decoded JSON on the client. **NEVER TRUST THIS CLIENT-SIDE OBJECT ON THE BACKEND FOR PERMISSIONS OR AUTHORIZATION.**
- Always validate `initData` on your server using HMAC-SHA256 with `sha256(bot_token)` as the secret key.

*(Note: If using **Telegram Serverless (`tgcloud`)**, validation is handled automatically by Telegram's infrastructure; see the `telegram-serverless` skill).*

---

## 7. Common Pitfalls & Troubleshooting Checklist

1. **Blank screen on mobile**: Ensure `tg.ready()` is invoked. Check browser console via remote debugging.
2. **Double scrollbars / rubber-band bouncing**: Set `overscroll-behavior-y: none;` on `html, body`.
3. **Bottom buttons cut off**: Verify container padding includes `var(--tg-safe-area-inset-bottom)`.
4. **Z-index bugs with modals**: Glassmorphism or backdrop filters on global containers can trap fixed modals in stacking contexts. Keep modals mounted at root level (`#modal-root` or `document.body` via React Portals).
5. **Desktop vs Mobile Behavior**: Desktop Telegram (`tdesktop`) does not support certain mobile features. Always feature-detect via `Telegram.WebApp.isVersionAtLeast(...)`.
