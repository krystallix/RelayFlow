"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "amber"
  | "emerald";

export type ButtonSize = "xs" | "sm" | "md" | "icon" | "icon-sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200 shadow-xs",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10",
  ghost:
    "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10",
  danger:
    "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 dark:text-red-400",
  amber:
    "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs",
  emerald:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-xs",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[11px] rounded-lg gap-1.5",
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-9 px-4 text-xs rounded-xl gap-2",
  icon: "h-8 w-8 rounded-lg p-0",
  "icon-sm": "h-7 w-7 rounded-lg p-0",
};

/**
 * Reusable button primitive supporting RelayFlow dark/light variants and sizes.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", size = "sm", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
