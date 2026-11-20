"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible custom checkbox with optional label and description.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex items-start gap-3 p-2.5 -mx-2 rounded-lg transition-colors group select-none",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer",
        className
      )}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-all",
            checked
              ? "bg-zinc-900 border-zinc-900 text-white shadow-xs dark:bg-white dark:border-white dark:text-zinc-950"
              : "border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-white/20 dark:bg-white/5 dark:group-hover:border-white/40"
          )}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
              {label}
            </div>
          )}
          {description && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
              {description}
            </div>
          )}
        </div>
      )}
    </label>
  );
};
