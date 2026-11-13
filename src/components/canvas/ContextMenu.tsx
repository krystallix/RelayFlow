"use client";

import React, { useEffect, useRef } from "react";
import {
  RotateCw,
  Copy,
  Trash2,
  Edit3,
  GitBranch,
  Search,
  Maximize2,
  RotateCcw,
  Gauge,
  CheckSquare,
  Play,
  Square,
  Sparkles,
  BringToFront,
  SendToBack,
} from "lucide-react";
import { CircuitNode, CircuitWire } from "@/engine/types";
import { useIsMac, useModifierKey } from "@/utils/platform";

export type ContextMenuTarget =
  | { type: "node"; node: CircuitNode; worldPos: { x: number; y: number } }
  | { type: "wire"; wire: CircuitWire; worldPos: { x: number; y: number } }
  | { type: "canvas"; worldPos: { x: number; y: number } };

interface ContextMenuProps {
  x: number;
  y: number;
  target: ContextMenuTarget;
  isDark: boolean;
  isSimulating: boolean;
  probeActive: boolean;
  onClose: () => void;
  onRotateNode?: (nodeId: string | number) => void;
  onDuplicate?: () => void;
  onDeleteNode?: (nodeId: string | number) => void;
  onDeleteWire?: (wireId: string | number) => void;
  onInsertJunction?: (wireId: string | number, pos: { x: number; y: number }) => void;
  onBringToFront?: (id: string | number) => void;
  onSendToBack?: (id: string | number) => void;
  onEditNode?: (node: CircuitNode) => void;
  onToggleNodeState?: (nodeId: string | number) => void;
  onOpenSearch?: () => void;
  onZoomToFit?: () => void;
  onResetZoom?: () => void;
  onAutoLayout?: () => void;
  onSelectAll?: () => void;
  onToggleProbe?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  target,
  isDark,
  isSimulating,
  probeActive,
  onClose,
  onRotateNode,
  onDuplicate,
  onDeleteNode,
  onDeleteWire,
  onInsertJunction,
  onBringToFront,
  onSendToBack,
  onEditNode,
  onToggleNodeState,
  onOpenSearch,
  onZoomToFit,
  onResetZoom,
  onAutoLayout,
  onSelectAll,
  onToggleProbe,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isMac = useIsMac();
  const modKey = useModifierKey();

  // Close on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  // Adjust coordinates if menu would bleed offscreen
  const screenW = typeof window !== "undefined" ? window.innerWidth : 400;
  const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
  const adjustedX = Math.max(10, Math.min(x, screenW - 220));
  const adjustedY = Math.max(10, Math.min(y, screenH - 280));

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className={`fixed z-50 min-w-[200px] rounded-xl border p-1 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-100 ${
        isDark
          ? "bg-[#141824]/95 border-white/10 text-zinc-200 shadow-black/60"
          : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60"
      }`}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. NODE CONTEXT MENU */}
      {target.type === "node" && (
        <>
          <div className="px-3 py-1.5 border-b border-white/5 text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
            <span className="truncate max-w-[130px]">{target.node.name}</span>
            {target.node.tag && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isDark ? "bg-white/10 text-zinc-200 border-white/10" : "bg-slate-200 text-slate-800 border-slate-300"
              }`}>
                {target.node.tag}
              </span>
            )}
          </div>

          <div className="py-1">
            {isSimulating && (
              <button
                type="button"
                onClick={() => {
                  onToggleNodeState?.(target.node.id);
                  onClose();
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-left font-medium transition-colors cursor-pointer ${
                  isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                }`}
              >
                <Play className="w-3.5 h-3.5 text-zinc-400" />
                <span>Toggle Component State</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onRotateNode?.(target.node.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Rotate 90° CW</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onDuplicate?.();
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Duplicate</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{modKey}+D</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEditNode?.(target.node);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Edit Tag / Delay...</span>
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              type="button"
              onClick={() => {
                onBringToFront?.(target.node.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BringToFront className="w-3.5 h-3.5 text-zinc-400" />
                <span>Bring to Front</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{modKey}+]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSendToBack?.(target.node.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SendToBack className="w-3.5 h-3.5 text-zinc-400" />
                <span>Send to Back</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{modKey}+[</span>
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              onClick={() => {
                onDeleteNode?.(target.node.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors ${
                isDark ? "text-zinc-300 hover:bg-white/10" : "text-slate-800 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Delete</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Del</span>
            </button>
          </div>
        </>
      )}

      {/* 2. WIRE CONTEXT MENU */}
      {target.type === "wire" && (
        <>
          <div className="px-3 py-1.5 border-b border-white/5 text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
            <span>Wire Segment</span>
            {target.wire.potential && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isDark ? "bg-white/10 text-zinc-200 border-white/10" : "bg-slate-200 text-slate-800 border-slate-300"
              }`}>
                {target.wire.potential}
              </span>
            )}
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onInsertJunction?.(target.wire.id, target.worldPos);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span>Insert Junction Dot (Splice)</span>
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              type="button"
              onClick={() => {
                onBringToFront?.(target.wire.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BringToFront className="w-3.5 h-3.5 text-zinc-400" />
                <span>Bring to Front</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{modKey}+]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSendToBack?.(target.wire.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SendToBack className="w-3.5 h-3.5 text-zinc-400" />
                <span>Send to Back</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{modKey}+[</span>
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              type="button"
              onClick={() => {
                onDeleteWire?.(target.wire.id);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-white/10" : "text-slate-800 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Delete Wire</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Del</span>
            </button>
          </div>
        </>
      )}

      {/* 3. CANVAS CONTEXT MENU */}
      {target.type === "canvas" && (
        <div className="py-1">
          <button
            type="button"
            onClick={() => {
              onAutoLayout?.();
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Auto Layout Circuit</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{isMac ? "⌥L" : "Alt+L"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenSearch?.();
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add Symbol...</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{modKey}+K</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleProbe?.();
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              <span>{probeActive ? "Hide Virtual Multimeter" : "Virtual Multimeter Probe"}</span>
            </div>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                probeActive ? "bg-white/10 text-zinc-200" : "text-zinc-500"
              }`}
            >
              {probeActive ? "ON" : "OFF"}
            </span>
          </button>

          <div className="my-1 border-t border-white/5" />

          <button
            type="button"
            onClick={() => {
              onZoomToFit?.();
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-left font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Zoom to Fit Circuit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResetZoom?.();
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-left font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Zoom (100%)</span>
          </button>

          <div className="my-1 border-t border-white/5" />

          <button
            type="button"
            onClick={() => {
              onSelectAll?.();
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-left font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span>Select All</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{modKey}+A</span>
          </button>
        </div>
      )}
    </div>
  );
};
