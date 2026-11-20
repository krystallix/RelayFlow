"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: "left" | "right";
  /**
   * When false, renders without a blocking backdrop so canvas interactions remain active.
   */
  modal?: boolean;
  widthClassName?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Slide-over side panel supporting both non-blocking inspector sheets and modal drawers.
 */
export const SideSheet: React.FC<SideSheetProps> = ({
  isOpen,
  onClose,
  side = "right",
  modal = false,
  widthClassName = "w-80 sm:w-96",
  className,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const panel = (
    <aside
      aria-hidden={!isOpen}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "fixed top-14 bottom-0 z-40 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#131620] dark:text-zinc-100",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        side === "right"
          ? isOpen
            ? "translate-x-0"
            : "translate-x-full pointer-events-none"
          : isOpen
          ? "translate-x-0"
          : "-translate-x-full pointer-events-none",
        widthClassName,
        className
      )}
    >
      {children}
    </aside>
  );

  if (!modal) return panel;
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex"
      onClick={onClose}
    >
      {panel}
    </div>
  );
};

export interface SideSheetHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const SideSheetHeader: React.FC<SideSheetHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  className,
}) => (
  <div
    className={cn(
      "px-5 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0",
      className
    )}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && (
        <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="font-semibold text-zinc-900 dark:text-white text-sm tracking-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const SideSheetBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex-1 overflow-y-auto px-5 py-4 space-y-6 text-xs", className)}
    {...props}
  />
);

export const SideSheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "p-4 border-t border-zinc-100 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02] flex items-center justify-between shrink-0",
      className
    )}
    {...props}
  />
);
