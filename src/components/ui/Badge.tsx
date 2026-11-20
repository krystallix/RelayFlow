"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "amber" | "emerald" | "red" | "blue";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-zinc-300 dark:border-white/10",
  amber:
    "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300 dark:border-amber-500/30",
  emerald:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300 dark:border-emerald-500/30",
  red:
    "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300 dark:border-red-500/30",
  blue:
    "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300 dark:border-blue-500/30",
};

/**
 * Compact status pill/badge component.
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold leading-tight",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
};
