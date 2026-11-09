"use client";

import React, { useState } from "react";
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Check,
} from "lucide-react";
import { CircuitNode } from "@/engine/types";
import catalogData from "@/constants/components-catalog.json";
import { useCircuitStore } from "@/store/useCircuitStore";

const catalog = catalogData as Record<string, any>;

interface MultiNodePopoverProps {
  selectedNodes: CircuitNode[];
  isDark: boolean;
  placement?: "top" | "bottom";
  onRotateRight: () => void;
  onRotateLeft: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const MultiNodePopover: React.FC<MultiNodePopoverProps> = ({
  selectedNodes,
  isDark,
  placement = "top",
  onRotateRight,
  onRotateLeft,
  onCopy,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAlignSubmenu, setShowAlignSubmenu] = useState(false);

  const updateNodesPositions = useCircuitStore((state) => state.updateNodesPositions);

  const count = selectedNodes.length;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Align Vertical (Left, Center X, Right)
  const alignVertical = (mode: "left" | "center" | "right") => {
    if (selectedNodes.length < 2) return;

    if (mode === "center") {
      const avgX =
        selectedNodes.reduce((acc, n) => acc + n.position.x, 0) / selectedNodes.length;
      const targetX = Math.round(avgX / 30) * 30;

      const updates = selectedNodes.map((n) => ({
        id: n.id,
        position: { x: targetX, y: n.position.y },
      }));
      updateNodesPositions(updates, true);
    } else if (mode === "left") {
      const leftEdges = selectedNodes.map((n) => {
        const w = catalog[n.componentId]?.width || 120;
        return n.position.x - w / 2;
      });
      const minLeft = Math.min(...leftEdges);

      const updates = selectedNodes.map((n) => {
        const w = catalog[n.componentId]?.width || 120;
        return {
          id: n.id,
          position: {
            x: Math.round((minLeft + w / 2) / 30) * 30,
            y: n.position.y,
          },
        };
      });
      updateNodesPositions(updates, true);
    } else if (mode === "right") {
      const rightEdges = selectedNodes.map((n) => {
        const w = catalog[n.componentId]?.width || 120;
        return n.position.x + w / 2;
      });
      const maxRight = Math.max(...rightEdges);

      const updates = selectedNodes.map((n) => {
        const w = catalog[n.componentId]?.width || 120;
        return {
          id: n.id,
          position: {
            x: Math.round((maxRight - w / 2) / 30) * 30,
            y: n.position.y,
          },
        };
      });
      updateNodesPositions(updates, true);
    }
  };

  // Align Horizontal (Top, Center Y, Bottom)
  const alignHorizontal = (mode: "top" | "center" | "bottom") => {
    if (selectedNodes.length < 2) return;

    if (mode === "center") {
      const avgY =
        selectedNodes.reduce((acc, n) => acc + n.position.y, 0) / selectedNodes.length;
      const targetY = Math.round(avgY / 30) * 30;

      const updates = selectedNodes.map((n) => ({
        id: n.id,
        position: { x: n.position.x, y: targetY },
      }));
      updateNodesPositions(updates, true);
    } else if (mode === "top") {
      const topEdges = selectedNodes.map((n) => {
        const h = catalog[n.componentId]?.height || 120;
        return n.position.y - h / 2;
      });
      const minTop = Math.min(...topEdges);

      const updates = selectedNodes.map((n) => {
        const h = catalog[n.componentId]?.height || 120;
        return {
          id: n.id,
          position: {
            x: n.position.x,
            y: Math.round((minTop + h / 2) / 30) * 30,
          },
        };
      });
      updateNodesPositions(updates, true);
    } else if (mode === "bottom") {
      const bottomEdges = selectedNodes.map((n) => {
        const h = catalog[n.componentId]?.height || 120;
        return n.position.y + h / 2;
      });
      const maxBottom = Math.max(...bottomEdges);

      const updates = selectedNodes.map((n) => {
        const h = catalog[n.componentId]?.height || 120;
        return {
          id: n.id,
          position: {
            x: n.position.x,
            y: Math.round((maxBottom - h / 2) / 30) * 30,
          },
        };
      });
      updateNodesPositions(updates, true);
    }
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`relative flex flex-col rounded-2xl border shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 select-none z-50 ${
        isDark
          ? "bg-[#11141e]/95 border-white/15 text-zinc-300 shadow-black/80"
          : "bg-white/95 border-slate-200 text-slate-700 shadow-slate-300"
      }`}
    >
      {/* Main Action Bar */}
      <div className="flex items-center gap-0.5 p-1.5 text-xs">
        {/* Selection Count Badge */}
        <div
          className={`px-2 py-1 mr-1 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 ${
            isDark
              ? "bg-white/10 text-zinc-200 border border-white/10"
              : "bg-slate-100 text-slate-800 border border-slate-200"
          }`}
          title={`${count} components selected`}
        >
          <span>{count}</span>
          <span className="text-[9px] uppercase font-sans tracking-wider opacity-70">items</span>
        </div>

        {/* ALIGN TOOL TRIGGER (Single Monochrome Icon) */}
        <button
          type="button"
          onClick={() => setShowAlignSubmenu((prev) => !prev)}
          title="Alignment Options (Left, Center, Right, Top, Middle, Bottom)"
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            showAlignSubmenu
              ? isDark
                ? "bg-white/15 text-white border border-white/20 shadow-xs"
                : "bg-slate-200 text-slate-900 border border-slate-300 shadow-xs"
              : isDark
              ? "hover:bg-white/10 hover:text-white text-zinc-300"
              : "hover:bg-slate-100 hover:text-slate-900 text-slate-700"
          }`}
        >
          <AlignStartVertical className="w-4 h-4" />
        </button>

        <span className={`h-4 w-px mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* ROTATE CCW */}
        <button
          type="button"
          onClick={onRotateLeft}
          title="Rotate Selection Left 90°"
          className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-100 hover:text-slate-900 text-slate-700"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* ROTATE CW */}
        <button
          type="button"
          onClick={onRotateRight}
          title="Rotate Selection Right 90°"
          className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-100 hover:text-slate-900 text-slate-700"
          }`}
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* COPY */}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Selected Components"
          className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-100 hover:text-slate-900 text-slate-700"
          }`}
        >
          {copied ? <Check className="w-4 h-4 text-zinc-100" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* DELETE */}
        <button
          type="button"
          onClick={onDelete}
          title="Delete Selection (Del)"
          className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark ? "hover:bg-white/10 hover:text-white text-zinc-400" : "hover:bg-slate-200 hover:text-slate-900 text-slate-500"
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Alignment Submenu (Monochrome Icons) */}
      {showAlignSubmenu && (
        <div
          className={`px-2 py-1.5 border-t flex items-center gap-1 text-xs animate-in slide-in-from-top-1 duration-150 ${
            isDark ? "border-white/10 bg-[#1c1c1c]" : "border-slate-200 bg-slate-50/90"
          }`}
        >
          <span className="text-[10px] text-zinc-400 font-medium px-1 uppercase tracking-wider font-mono">
            Align
          </span>

          {/* ALIGN LEFT */}
          <button
            type="button"
            onClick={() => alignVertical("left")}
            title="Align Left Edges"
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-200 hover:text-slate-900 text-slate-700"
            }`}
          >
            <AlignStartVertical className="w-4 h-4" />
          </button>

          {/* ALIGN CENTER X (Vertical Center) */}
          <button
            type="button"
            onClick={() => alignVertical("center")}
            title="Align Centers (Vertical)"
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-200 hover:text-slate-900 text-slate-700"
            }`}
          >
            <AlignCenterVertical className="w-4 h-4" />
          </button>

          {/* ALIGN RIGHT */}
          <button
            type="button"
            onClick={() => alignVertical("right")}
            title="Align Right Edges"
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-200 hover:text-slate-900 text-slate-700"
            }`}
          >
            <AlignEndVertical className="w-4 h-4" />
          </button>

          <span className={`h-4 w-px mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

          {/* ALIGN TOP */}
          <button
            type="button"
            onClick={() => alignHorizontal("top")}
            title="Align Top Edges"
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-200 hover:text-slate-900 text-slate-700"
            }`}
          >
            <AlignStartHorizontal className="w-4 h-4" />
          </button>

          {/* ALIGN CENTER Y (Horizontal Center) */}
          <button
            type="button"
            onClick={() => alignHorizontal("center")}
            title="Align Centers (Horizontal)"
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-200 hover:text-slate-900 text-slate-700"
            }`}
          >
            <AlignCenterHorizontal className="w-4 h-4" />
          </button>

          {/* ALIGN BOTTOM */}
          <button
            type="button"
            onClick={() => alignHorizontal("bottom")}
            title="Align Bottom Edges"
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark ? "hover:bg-white/10 hover:text-white text-zinc-300" : "hover:bg-slate-200 hover:text-slate-900 text-slate-700"
            }`}
          >
            <AlignEndHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
