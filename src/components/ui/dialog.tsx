"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain"
      style={{
        paddingTop: "max(8px, var(--tma-top-padding, 0px))",
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Content Container: Native Bottom Sheet on Mobile, Centered Modal on Desktop */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[calc(100dvh-max(8px,var(--tma-top-padding,0px))-8px)]",
          "flex flex-col rounded-t-[28px] sm:rounded-3xl border-t sm:border border-white/10",
          "bg-slate-900/98 shadow-2xl backdrop-blur-2xl",
          "animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250",
          "p-3 sm:p-4 pb-[max(16px,var(--tma-bottom-padding,0px))] overflow-hidden",
          className
        )}
      >
        {/* Native Mobile Drag Handle Pill */}
        <div className="w-10 h-1.5 rounded-full bg-white/25 mx-auto mt-0.5 mb-2 shrink-0 sm:hidden" />
        {children}
      </div>
    </div>
  );
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 py-1", className)}
      {...props}
    />
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1 text-left mb-3 shrink-0", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2
        className={cn("text-lg sm:text-xl font-bold tracking-tight text-white min-w-0 flex-1", className)}
        {...props}
      >
        {children}
      </h2>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs sm:text-sm text-slate-400 mt-0.5", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-3 mt-3 border-t border-white/10 shrink-0",
        className
      )}
      {...props}
    />
  );
}
