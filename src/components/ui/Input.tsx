"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Styled text input with optional leading icon or trailing element.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, leftIcon, rightElement, ...props }, ref) => {
    if (!leftIcon && !rightElement) {
      return (
        <input
          ref={ref}
          className={cn(
            "w-full h-9 px-3 rounded-xl border text-xs transition-colors outline-none",
            "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white",
            "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/25 dark:focus:bg-white/[0.07]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
      );
    }

    return (
      <div className={cn("relative flex items-center w-full", containerClassName)}>
        {leftIcon && (
          <span className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-9 rounded-xl border text-xs transition-colors outline-none",
            "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white",
            "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/25 dark:focus:bg-white/[0.07]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftIcon ? "pl-9" : "pl-3",
            rightElement ? "pr-9" : "pr-3",
            className
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-2.5 flex items-center">{rightElement}</span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
