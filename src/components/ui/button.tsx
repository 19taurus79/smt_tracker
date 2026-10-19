import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          {
            "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500":
              variant === "default",
            "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500":
              variant === "destructive",
            "border border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/20":
              variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-white/10 text-foreground": variant === "ghost",
            "text-emerald-400 underline-offset-4 hover:underline": variant === "link",
            "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-cyan-400":
              variant === "accent",
          },
          {
            "h-11 px-4 py-2": size === "default",
            "h-9 px-3 text-xs rounded-lg": size === "sm",
            "h-13 px-8 text-base rounded-2xl": size === "lg",
            "h-10 w-10 p-0 rounded-xl": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
