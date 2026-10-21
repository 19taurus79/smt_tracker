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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md animate-in fade-in transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Content Container: Removed heavy double-padding on mobile */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/98 p-2.5 sm:p-4.5 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </div>
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
