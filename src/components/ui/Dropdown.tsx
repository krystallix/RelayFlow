"use client";

import React, { useEffect, useRef } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  widthClassName?: string;
  className?: string;
}

/**
 * Dropdown menu container with automatic click-outside and Escape handling.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  align = "left",
  widthClassName = "w-56",
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1.5 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100",
            "bg-white border-slate-200 text-slate-700",
            "dark:bg-[#161a23] dark:border-white/15 dark:text-zinc-200",
            align === "right" ? "right-0" : "left-0",
            widthClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  checked?: boolean;
  shortcut?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  icon,
  checked,
  shortcut,
  disabled,
  className,
  children,
  ...props
}) => (
  <button
    type="button"
    disabled={disabled}
    className={cn(
      "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors",
      disabled
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-slate-100 text-slate-800 dark:hover:bg-white/10 dark:text-zinc-200 cursor-pointer",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2 min-w-0">
      {icon && <span className="shrink-0 text-zinc-400">{icon}</span>}
      <span className="truncate">{children}</span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {shortcut && <span className="text-[10px] text-zinc-400 font-mono">{shortcut}</span>}
      {checked && <Check className="w-3.5 h-3.5 text-zinc-400" />}
    </div>
  </button>
);

export const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("my-1 border-t border-slate-200 dark:border-white/10", className)} />
);

export interface DropdownSubmenuProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  checked?: boolean;
  onTriggerClick?: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}

/**
 * Hover-triggered flyout submenu nested inside a Dropdown.
 */
export const DropdownSubmenu: React.FC<DropdownSubmenuProps> = ({
  label,
  icon,
  checked,
  onTriggerClick,
  children,
  widthClassName = "w-52",
}) => (
  <div className="relative group/submenu">
    <button
      type="button"
      onClick={onTriggerClick}
      className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors hover:bg-slate-100 text-slate-800 dark:hover:bg-white/10 dark:text-zinc-200 cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="shrink-0 text-zinc-400">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {checked && <Check className="w-3.5 h-3.5 text-zinc-400" />}
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </div>
    </button>
    <div
      className={cn(
        "hidden group-hover/submenu:block absolute left-full top-0 ml-1 rounded-xl border p-1 shadow-2xl z-50",
        "bg-white border-slate-200 text-slate-700",
        "dark:bg-[#161a23] dark:border-white/15 dark:text-zinc-200",
        widthClassName
      )}
    >
      {children}
    </div>
  </div>
);
