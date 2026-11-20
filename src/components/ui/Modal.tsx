"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
  className?: string;
}

/**
 * Centered dialog modal with backdrop blur, Escape-to-close, and zoom-in animation.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidthClassName = "max-w-md",
  className,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 select-none",
          "bg-white border-slate-200 text-slate-800",
          "dark:bg-[#131620] dark:border-white/15 dark:text-white",
          maxWidthClassName,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export interface ModalHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Standard modal header with icon badge, title, optional subtitle, and close button.
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  className,
}) => (
  <div
    className={cn(
      "flex items-center justify-between pb-3 border-b mb-4",
      "border-slate-200 dark:border-white/10",
      className
    )}
  >
    <div className="flex items-center gap-2 min-w-0">
      {icon && (
        <div className="p-1.5 rounded-lg border shrink-0 bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="font-bold text-sm tracking-tight truncate">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal truncate max-w-[260px]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("space-y-4", className)} {...props} />;

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-white/10",
      className
    )}
    {...props}
  />
);
