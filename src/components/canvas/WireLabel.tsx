"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCircuitStore } from "@/store/useCircuitStore";

interface WireLabelProps {
  wireId: string | number;
  label: string;
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
  isHot?: boolean;
  isSelected?: boolean;
}

export const WireLabel: React.FC<WireLabelProps> = ({
  wireId,
  label,
  x,
  y,
  orientation,
  isHot = false,
  isSelected = false,
}) => {
  const { theme, updateWireLabel, isSimulating } = useCircuitStore();
  const isDark = theme === "dark";

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(label);
  }, [label]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSimulating) return;
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateWireLabel(wireId, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setEditValue(label);
      setIsEditing(false);
    }
  };

  // Badge positioning:
  // For horizontal segments: place badge right above the wire line (offset Y = -8)
  // For vertical segments: place badge to the right of the wire line (offset X = +7)
  const offsetX = orientation === "horizontal" ? 0 : 7;
  const offsetY = orientation === "horizontal" ? -8 : 0;

  const badgeBg = isDark
    ? isHot
      ? "bg-amber-950/95 text-amber-300 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
      : isSelected
      ? "bg-zinc-900/95 text-cyan-300 border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
      : "bg-[#090b10]/95 text-zinc-300 border-white/20 hover:border-amber-400/60 hover:text-amber-300 shadow-xs"
    : isHot
    ? "bg-amber-100 text-amber-900 border-amber-500 shadow-xs"
    : isSelected
    ? "bg-cyan-50 text-cyan-900 border-cyan-500 shadow-xs"
    : "bg-white text-zinc-800 border-zinc-300 hover:border-amber-500 shadow-xs";

  return (
    <foreignObject
      x={x + offsetX - 20}
      y={y + offsetY - 8}
      width={40}
      height={16}
      className="overflow-visible pointer-events-auto select-none"
    >
      <div className="w-full h-full flex items-center justify-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-10 h-3.5 px-1 text-[9px] font-mono font-bold text-center rounded border bg-black text-amber-300 border-amber-400 focus:outline-none"
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            title={`Wire Net #${label} (Double-click to rename)`}
            className={`cursor-pointer px-1 py-0 rounded text-[9px] font-mono font-bold border transition-all duration-150 leading-tight ${badgeBg}`}
          >
            {label}
          </div>
        )}
      </div>
    </foreignObject>
  );
};
