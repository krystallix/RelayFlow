"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Elevated surface container matching RelayFlow's dark/light card aesthetic.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border shadow-2xl",
        "bg-white border-slate-200 text-slate-800",
        "dark:bg-[#131620] dark:border-white/15 dark:text-white",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
