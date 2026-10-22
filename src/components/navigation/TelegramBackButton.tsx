"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { registerTgBackButton } from "@/lib/tma/telegram";

export function TelegramBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only show back button on inner routes
    if (pathname && pathname !== "/") {
      const cleanup = registerTgBackButton(() => {
        // If can go back in history, or fallback to home
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      });
      return cleanup;
    } else {
      try {
        window.Telegram?.WebApp?.BackButton?.hide();
      } catch {}
    }
  }, [pathname, router]);

  return null;
}
