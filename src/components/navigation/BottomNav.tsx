"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  Calendar,
  Ruler,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/workout", label: "Тренинг", icon: Dumbbell, hasBadge: true },
  { href: "/program", label: "Сетка", icon: Calendar },
  { href: "/body", label: "Замеры", icon: Ruler },
  { href: "/analytics", label: "Графики", icon: TrendingUp },
  { href: "/settings", label: "Опции", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { activeWorkoutId } = useWorkoutStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl ios-safe-bottom">
      <div className="mx-auto flex h-14 sm:h-16 max-w-lg items-center justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showPill = item.hasBadge && activeWorkoutId;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 py-1 transition-all text-xs font-medium select-none",
                isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 transition-transform",
                    isActive && "scale-110 text-emerald-400"
                  )}
                />
                {showPill && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
