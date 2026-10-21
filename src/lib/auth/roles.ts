// Role-Based Access Control (RBAC) & Telegram Authentication Linking
import { LinkedTelegramAccount, UserRole } from "@/types/body";

export const MASTER_COACH_USERNAME = (
  process.env.NEXT_PUBLIC_COACH_USERNAME || "coach_alex"
).replace(/^@/, "");

export const BOT_USERNAME = (
  process.env.NEXT_PUBLIC_BOT_USERNAME || "smt_workout_bot"
).replace(/^@/, "");

/**
 * Checks if a user is the Master Coach
 */
export function isCoachAccount(username?: string, id?: number): boolean {
  if (!username && !id) return false;
  const cleanMaster = MASTER_COACH_USERNAME.toLowerCase();
  if (username && username.toLowerCase().replace(/^@/, "") === cleanMaster) {
    return true;
  }
  return false;
}

/**
 * Resolves current user role
 */
export function resolveUserRole(account?: LinkedTelegramAccount | null): UserRole {
  if (!account) return "guest";
  if (account.isCoach || isCoachAccount(account.username, account.id)) {
    return "coach";
  }
  return "trainee";
}

/**
 * Generates the 1-click Telegram linking URL for standalone PWA
 */
export function generateTelegramLinkUrl(): string {
  const sessionId = Math.random().toString(36).substring(2, 10);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("smt_link_sid", sessionId);
    } catch {
      // ignore
    }
  }
  return `https://t.me/${BOT_USERNAME}?start=link_${sessionId}`;
}
