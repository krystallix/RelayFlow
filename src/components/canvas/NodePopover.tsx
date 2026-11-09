"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCw,
  RotateCcw,
  Copy,
  ClipboardPaste,
  Trash2,
  Check,
  Sparkles,
  Tag as TagIcon,
  Pencil,
  Clock,
  X,
} from "lucide-react";
import { CircuitNode } from "@/engine/types";
import catalogData from "@/constants/components-catalog.json";
import { useCircuitStore } from "@/store/useCircuitStore";
import { useModifierKey } from "@/utils/platform";

const catalog = catalogData as Record<string, any>;

interface NodePopoverProps {
  node: CircuitNode;
  isDark: boolean;
  canPaste: boolean;
  placement?: "top" | "bottom";
  onRotateRight: () => void;
  onRotateLeft: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

export const NodePopover: React.FC<NodePopoverProps> = ({
  node,
  isDark,
  canPaste,
  placement = "top",
  onRotateRight,
  onRotateLeft,
  onCopy,
  onPaste,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tagValue, setTagValue] = useState(node.tag || "");
  const [commentValue, setCommentValue] = useState(node.comment || "");
  const [timeValue, setTimeValue] = useState<number>(node.valueTimeOn ?? 3);
  const modKey = useModifierKey();

  const updateNodeData = useCircuitStore((state) => state.updateNodeData);
  const comp = catalog[node.componentId];
  const isTimerCoil =
    node.componentId.includes("Delay") ||
    comp?.tagType === "timerCoils" ||
    comp?.timerType !== undefined;

  useEffect(() => {
    setTagValue(node.tag || "");
    setCommentValue(node.comment || "");
    setTimeValue((node.valueTimeOn || node.valueTimeOff) ?? 3);
  }, [node.tag, node.comment, node.valueTimeOn, node.valueTimeOff]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handlePaste = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canPaste) return;
    onPaste();
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateNodeData(node.id, {
      tag: tagValue.trim() || null,
      comment: commentValue.trim() || null,
      valueTimeOn: isTimerCoil ? Number(timeValue) : undefined,
      valueTimeOff: isTimerCoil ? Number(timeValue) : undefined,
    });
    setIsEditing(false);
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`relative flex flex-col gap-1.5 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md border select-none transition-all duration-150 animate-in fade-in zoom-in-95 ${
        isDark
          ? "bg-[#0d111a]/95 border-white/15 text-zinc-300 shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
          : "bg-white/95 border-slate-200 text-slate-700 shadow-xl shadow-slate-300/60"
      }`}
    >
      {/* Main Action Bar */}
      <div className="flex items-center gap-1">
        {/* 1. Component Icon & Label (Clickable to Edit Tag) */}
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono font-medium max-w-[150px] truncate cursor-pointer transition-colors ${
            isDark
              ? "bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10"
              : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
          }`}
          title="Click to edit Tag / Comment"
        >
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {comp?.svgPath ? (
              <img
                src={comp.svgPath}
                alt={node.name}
                className={`w-4 h-4 object-contain pointer-events-none ${
                  isDark ? "" : "filter invert"
                }`}
              />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </div>
          <span className="font-semibold text-[11px] truncate">
            {node.tag || comp?.name || "Symbol"}
          </span>
          <Pencil className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
        </button>

        <div className={`w-[1px] h-4 mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* 2. Rotate Right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotateRight();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            isDark
              ? "text-zinc-300 hover:text-white hover:bg-white/10 active:bg-white/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200"
          }`}
          title="Rotate Right 90° (CW)"
          aria-label="Rotate Right"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* 3. Rotate Left */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotateLeft();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            isDark
              ? "text-zinc-300 hover:text-white hover:bg-white/10 active:bg-white/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200"
          }`}
          title="Rotate Left 90° (CCW)"
          aria-label="Rotate Left"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className={`w-[1px] h-4 mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* 4. Copy */}
        <button
          type="button"
          onClick={handleCopy}
          onMouseDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            isDark
              ? "text-zinc-300 hover:text-white hover:bg-white/10 active:bg-white/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200"
          }`}
          title={`Copy (${modKey}+C)`}
          aria-label="Copy"
        >
          {copied ? (
            <Check className="w-4 h-4 text-zinc-100" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* 5. Paste */}
        <button
          type="button"
          disabled={!canPaste}
          onClick={handlePaste}
          onMouseDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            !canPaste
              ? "opacity-35 cursor-not-allowed text-zinc-500"
              : isDark
              ? "text-zinc-300 hover:text-white hover:bg-white/10 active:bg-white/15 cursor-pointer"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
          }`}
          title={canPaste ? `Paste (${modKey}+V)` : "Paste (Clipboard kosong)"}
          aria-label="Paste"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>

        <div className={`w-[1px] h-4 mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* 6. Delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            isDark
              ? "text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:bg-slate-300"
          }`}
          title="Delete (Del)"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Tag & Comment Editor Dropdown */}
      {isEditing && (
        <form
          onSubmit={handleSaveEdit}
          className={`mt-1 pt-2 border-t flex flex-col gap-1.5 ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Tag (e.g. -KM1)"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              className={`flex-1 px-2 py-1 rounded-lg text-xs font-mono border focus:outline-none focus:border-zinc-500 ${
                isDark
                  ? "bg-[#1c1c1c] border-white/10 text-white"
                  : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 w-3.5 text-center shrink-0">#</span>
            <input
              type="text"
              placeholder="Comment (e.g. Main Motor)"
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              className={`flex-1 px-2 py-1 rounded-lg text-xs border focus:outline-none focus:border-zinc-500 ${
                isDark
                  ? "bg-[#1c1c1c] border-white/10 text-white"
                  : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
            />
          </div>

          {isTimerCoil && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="number"
                min="0.5"
                max="3600"
                step="0.5"
                placeholder="Delay (seconds)"
                value={timeValue}
                onChange={(e) => setTimeValue(parseFloat(e.target.value) || 0)}
                className={`flex-1 px-2 py-1 rounded-lg text-xs font-mono border focus:outline-none focus:border-zinc-500 ${
                  isDark
                    ? "bg-[#1c1c1c] border-white/10 text-white"
                    : "bg-slate-50 border-slate-300 text-slate-800"
                }`}
              />
              <span className="text-[11px] text-zinc-400">sec</span>
            </div>
          )}

          <div className="flex justify-end gap-1.5 mt-0.5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                isDark ? "hover:bg-white/10 text-zinc-400" : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-2.5 py-0.5 rounded font-semibold text-[11px] transition-colors border ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 border-white"
                  : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
              }`}
            >
              Apply
            </button>
          </div>
        </form>
      )}

      {/* Caret Pointer */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border ${
          placement === "bottom"
            ? `-top-1 border-b-0 border-r-0 ${
                isDark ? "bg-[#0d111a] border-white/15" : "bg-white border-slate-200"
              }`
            : `-bottom-1 border-t-0 border-l-0 ${
                isDark ? "bg-[#0d111a] border-white/15" : "bg-white border-slate-200"
              }`
        }`}
      />
    </div>
  );
};
