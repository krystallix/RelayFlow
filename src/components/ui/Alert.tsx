"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "warning" | "error" | "success";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info:
    "bg-slate-50 border-slate-200 text-slate-700 dark:bg-white/[0.03] dark:border-white/10 dark:text-zinc-300",
  warning:
    "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200",
  error:
    "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-300",
  success:
    "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
};

/**
 * Inline callout banner for notices, warnings, and errors.
 */
export const Alert: React.FC<AlertProps> = ({
  className,
  variant = "info",
  icon,
  children,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "p-3 rounded-xl border flex items-start gap-2.5 text-xs",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};
