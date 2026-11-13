"use client";

import React, { useState, useEffect, useRef } from "react";
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
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
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
  isEditing: externalIsEditing,
  onEditingChange,
  onRotateRight,
  onRotateLeft,
  onCopy,
  onPaste,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  const setIsEditing = (val: boolean) => {
    setInternalIsEditing(val);
    onEditingChange?.(val);
  };

  const tagInputRef = useRef<HTMLInputElement>(null);

  const [tagValue, setTagValue] = useState(node.tag || "");
  const [commentValue, setCommentValue] = useState(node.comment || "");
  const [timeValue, setTimeValue] = useState<number>(node.valueTimeOn ?? 3);
  const [lampColor, setLampColor] = useState<"red" | "green" | "yellow" | "blue" | "white">(
    node.lampColor || "green"
  );
  const [buttonColor, setButtonColor] = useState<"red" | "green" | "yellow" | "blue" | "white" | "black">(
    node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black")
  );
  const modKey = useModifierKey();

  const updateNodeData = useCircuitStore((state) => state.updateNodeData);
  const comp = catalog[node.componentId];
  const isTimerCoil =
    node.componentId.includes("Delay") ||
    comp?.tagType === "timerCoils" ||
    comp?.timerType !== undefined;
  const isPanelLamp = node.componentId === "panelLamp";
  const isPanelButton =
    node.componentId === "panelButtonMomentary" || node.componentId === "panelButtonLatching";

  useEffect(() => {
    setTagValue(node.tag || "");
    setCommentValue(node.comment || "");
    setTimeValue((node.valueTimeOn || node.valueTimeOff) ?? 3);
    setLampColor(node.lampColor || "green");
    setButtonColor(node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black"));
  }, [node.tag, node.comment, node.valueTimeOn, node.valueTimeOff, node.lampColor, node.buttonColor, node.componentId]);

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        tagInputRef.current?.focus();
        tagInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

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

  const handleCancelEdit = () => {
    setTagValue(node.tag || "");
    setCommentValue(node.comment || "");
    setTimeValue((node.valueTimeOn || node.valueTimeOff) ?? 3);
    setLampColor(node.lampColor || "green");
    setButtonColor(node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black"));
    setIsEditing(false);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateNodeData(node.id, {
      tag: tagValue.trim() || null,
      comment: commentValue.trim() || null,
      valueTimeOn: isTimerCoil ? Number(timeValue) : undefined,
      valueTimeOff: isTimerCoil ? Number(timeValue) : undefined,
      lampColor: isPanelLamp ? lampColor : undefined,
      buttonColor: isPanelButton ? buttonColor : undefined,
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
            {node.componentId === "panelLamp" ? (
              <div
                className={`w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs ${
                  node.lampColor === "red"
                    ? "bg-red-500"
                    : node.lampColor === "yellow"
                    ? "bg-amber-400"
                    : node.lampColor === "blue"
                    ? "bg-blue-500"
                    : node.lampColor === "white"
                    ? "bg-white"
                    : "bg-emerald-500"
                }`}
              />
            ) : node.componentId === "panelButtonMomentary" || node.componentId === "panelButtonLatching" ? (
              <div
                className={`w-3.5 h-3.5 rounded-full border border-black/40 flex items-center justify-center shadow-xs ${
                  (node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black")) === "red"
                    ? "bg-red-500"
                    : (node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black")) === "yellow"
                    ? "bg-amber-400"
                    : (node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black")) === "blue"
                    ? "bg-blue-500"
                    : (node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black")) === "white"
                    ? "bg-white"
                    : (node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black")) === "black"
                    ? "bg-zinc-900"
                    : "bg-emerald-500"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
              </div>
            ) : comp?.svgPath ? (
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

        {/* 1.5 Quick Color Picker for Panel Pilot Lamp (positioned left of Rotate buttons) */}
        {isPanelLamp && (
          <>
            <div className="flex items-center gap-1 px-1">
              {(
                [
                  { id: "red", bg: "bg-red-500", ring: "ring-red-400" },
                  { id: "green", bg: "bg-emerald-500", ring: "ring-emerald-400" },
                  { id: "yellow", bg: "bg-amber-400", ring: "ring-amber-300" },
                  { id: "blue", bg: "bg-blue-500", ring: "ring-blue-400" },
                  { id: "white", bg: "bg-white", ring: "ring-slate-300" },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLampColor(c.id);
                    updateNodeData(node.id, { lampColor: c.id });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`w-4 h-4 rounded-full ${c.bg} border border-black/30 transition-all cursor-pointer ${
                    (node.lampColor || "green") === c.id
                      ? `ring-2 ${c.ring} scale-110 shadow-xs`
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                  title={`Color: ${c.id.toUpperCase()}`}
                  aria-label={c.id}
                />
              ))}
            </div>

            <div className={`w-[1px] h-4 mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          </>
        )}

        {/* 1.6 Quick Color Picker for Panel Pushbutton & Switch (left of Rotate buttons) */}
        {isPanelButton && (
          <>
            <div className="flex items-center gap-1 px-1">
              {(
                [
                  { id: "green", bg: "bg-emerald-500", ring: "ring-emerald-400" },
                  { id: "red", bg: "bg-red-500", ring: "ring-red-400" },
                  { id: "yellow", bg: "bg-amber-400", ring: "ring-amber-300" },
                  { id: "blue", bg: "bg-blue-500", ring: "ring-blue-400" },
                  { id: "white", bg: "bg-white", ring: "ring-slate-300" },
                  { id: "black", bg: "bg-zinc-900", ring: "ring-zinc-400" },
                ] as const
              ).map((c) => {
                const currentColor =
                  node.buttonColor ||
                  (node.componentId === "panelButtonMomentary" ? "green" : "black");
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setButtonColor(c.id);
                      updateNodeData(node.id, { buttonColor: c.id });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-4 h-4 rounded-full ${c.bg} border border-black/30 transition-all cursor-pointer ${
                      currentColor === c.id
                        ? `ring-2 ${c.ring} scale-110 shadow-xs`
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={`Cap Color: ${c.id.toUpperCase()}`}
                    aria-label={c.id}
                  />
                );
              })}
            </div>

            <div className={`w-[1px] h-4 mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          </>
        )}

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
              ref={tagInputRef}
              type="text"
              placeholder="Tag (e.g. -KM1)"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  handleCancelEdit();
                }
              }}
              className={`flex-1 px-2 py-1 rounded-lg text-xs font-mono border focus:outline-none focus:border-zinc-500 ${
                isDark
                  ? "bg-black/40 border-white/10 text-white"
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
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  handleCancelEdit();
                }
              }}
              className={`flex-1 px-2 py-1 rounded-lg text-xs border focus:outline-none focus:border-zinc-500 ${
                isDark
                  ? "bg-black/40 border-white/10 text-white"
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
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    handleCancelEdit();
                  }
                }}
                className={`flex-1 px-2 py-1 rounded-lg text-xs font-mono border focus:outline-none focus:border-zinc-500 ${
                  isDark
                    ? "bg-black/40 border-white/10 text-white"
                    : "bg-slate-50 border-slate-300 text-slate-800"
                }`}
              />
              <span className="text-[11px] text-zinc-400">sec</span>
            </div>
          )}

          {isPanelLamp && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 w-3.5 text-center shrink-0">🎨</span>
              <div className="flex items-center gap-1.5 flex-1 py-1">
                {(
                  [
                    { id: "red", bg: "bg-red-500", ring: "ring-red-400" },
                    { id: "green", bg: "bg-emerald-500", ring: "ring-emerald-400" },
                    { id: "yellow", bg: "bg-amber-400", ring: "ring-amber-300" },
                    { id: "blue", bg: "bg-blue-500", ring: "ring-blue-400" },
                    { id: "white", bg: "bg-white", ring: "ring-slate-300" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setLampColor(c.id);
                      updateNodeData(node.id, { lampColor: c.id });
                    }}
                    className={`w-5 h-5 rounded-full ${c.bg} border border-black/30 transition-all cursor-pointer ${
                      lampColor === c.id
                        ? `ring-2 ${c.ring} scale-110 shadow-sm`
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={c.id.toUpperCase()}
                  />
                ))}
              </div>
            </div>
          )}

          {isPanelButton && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 w-3.5 text-center shrink-0">🎨</span>
              <div className="flex items-center gap-1.5 flex-1 py-1">
                {(
                  [
                    { id: "green", bg: "bg-emerald-500", ring: "ring-emerald-400" },
                    { id: "red", bg: "bg-red-500", ring: "ring-red-400" },
                    { id: "yellow", bg: "bg-amber-400", ring: "ring-amber-300" },
                    { id: "blue", bg: "bg-blue-500", ring: "ring-blue-400" },
                    { id: "white", bg: "bg-white", ring: "ring-slate-300" },
                    { id: "black", bg: "bg-zinc-900", ring: "ring-zinc-400" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setButtonColor(c.id);
                      updateNodeData(node.id, { buttonColor: c.id });
                    }}
                    className={`w-5 h-5 rounded-full ${c.bg} border border-black/30 transition-all cursor-pointer ${
                      buttonColor === c.id
                        ? `ring-2 ${c.ring} scale-110 shadow-sm`
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={`Cap Color: ${c.id.toUpperCase()}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-1.5 mt-0.5">
            <button
              type="button"
              onClick={handleCancelEdit}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10 text-zinc-400" : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-2.5 py-0.5 rounded font-semibold text-[11px] transition-colors border cursor-pointer ${
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
