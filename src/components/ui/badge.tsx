import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30":
            variant === "default" || variant === "success",
          "border-transparent bg-cyan-500/20 text-cyan-400 border-cyan-500/30":
            variant === "secondary",
          "border-transparent bg-rose-500/20 text-rose-400 border-rose-500/30":
            variant === "destructive",
          "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30":
            variant === "warning",
          "border-white/20 text-slate-300": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
