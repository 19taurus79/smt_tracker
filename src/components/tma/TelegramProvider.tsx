"use client";

import React, { useEffect } from "react";
import { initTelegramWebApp, getTelegramUser, isTelegramWebApp } from "@/lib/tma/telegram";
import { initCloudSync } from "@/lib/tma/cloudStorage";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { isCoachAccount, MASTER_COACH_USERNAME } from "@/lib/auth/roles";

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const { linkedTelegramUser, linkTelegramAccount, setCoachTelegramUsername } = useSettingsStore();

  useEffect(() => {
    // 1. Initialize Telegram Mini App environment
    // Requests fullscreen (Bot API 8.0), disables vertical swipes, applies Safe Areas & theme colors
    initTelegramWebApp();

    // 2. Auto-authenticate / link Telegram account immediately on startup
    if (typeof window !== "undefined") {
      const tgUser = getTelegramUser();
      if (tgUser && (!linkedTelegramUser || linkedTelegramUser.id !== tgUser.id)) {
        const isCoach = isCoachAccount(tgUser.username, tgUser.id);
        linkTelegramAccount({
          id: tgUser.id,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          username: tgUser.username,
          authDate: Date.now(),
          isCoach,
        });

        if (!isCoach) {
          setCoachTelegramUsername(MASTER_COACH_USERNAME);
        }
      }

      // 3. Initialize Telegram CloudStorage Cross-Device Sync (Mobile <-> Desktop)
      initCloudSync();
    }
  }, [linkedTelegramUser, linkTelegramAccount, setCoachTelegramUsername]);

  return <>{children}</>;
}
