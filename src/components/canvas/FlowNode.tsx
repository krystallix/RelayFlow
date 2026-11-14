"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { CircuitNode } from "@/engine/types";
import { useCircuitStore } from "@/store/useCircuitStore";
import catalogData from "@/constants/components-catalog.json";
import { SimulationEngine } from "@/engine/SimulationEngine";
import { SymbolRenderer } from "./SymbolRenderer";

const catalog = catalogData as Record<string, any>;

interface FlowNodeProps {
  node: CircuitNode;
  isSelected: boolean;
  connectedPortIds?: Set<number>;
  pairedCount?: number;
  isEditingComment?: boolean;
  initialCommentChar?: string | null;
  onStartEditComment?: (nodeId: string | number) => void;
  onEndEditComment?: () => void;
  onPortMouseDown: (nodeId: string | number, portId: number, portPos: { x: number; y: number }, e: React.MouseEvent | React.TouchEvent) => void;
  onNodeMouseDown: (nodeId: string | number, e: React.MouseEvent) => void;
  onNodeTouchStart?: (nodeId: string | number, e: React.TouchEvent) => void;
  onContextMenu?: (node: CircuitNode, e: React.MouseEvent) => void;
  onPortHover?: (node: CircuitNode, portId: number, e: React.MouseEvent) => void;
  onPortLeave?: () => void;
}

function areNodePropsEqual(prev: FlowNodeProps, next: FlowNodeProps): boolean {
  if (prev.node !== next.node) {
    if (prev.node.position.x !== next.node.position.x) return false;
    if (prev.node.position.y !== next.node.position.y) return false;
    if (prev.node.rotation !== next.node.rotation) return false;
    if (prev.node.tag !== next.node.tag) return false;
    if (prev.node.comment !== next.node.comment) return false;
    if (prev.node.isEnergized !== next.node.isEnergized) return false;
    if (prev.node.isPressed !== next.node.isPressed) return false;
    if (prev.node.frameIndex !== next.node.frameIndex) return false;
    if (prev.node.motorDirection !== next.node.motorDirection) return false;
    if (prev.node.timerElapsed !== next.node.timerElapsed) return false;
    if (prev.node.valueTimeOn !== next.node.valueTimeOn) return false;
    if (prev.node.valueTimeOff !== next.node.valueTimeOff) return false;
    if (prev.node.tagVisibility !== next.node.tagVisibility) return false;
    if (prev.node.lampColor !== next.node.lampColor) return false;
    if (prev.node.buttonColor !== next.node.buttonColor) return false;
  }
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.pairedCount !== next.pairedCount) return false;
  if (prev.isEditingComment !== next.isEditingComment) return false;
  if (prev.initialCommentChar !== next.initialCommentChar) return false;

  if (prev.connectedPortIds !== next.connectedPortIds) {
    if (!prev.connectedPortIds || !next.connectedPortIds) return false;
    if (prev.connectedPortIds.size !== next.connectedPortIds.size) return false;
  }

  return true;
}

export const FlowNode: React.FC<FlowNodeProps> = React.memo(({
  node,
  isSelected,
  connectedPortIds,
  pairedCount,
  isEditingComment = false,
  initialCommentChar = null,
  onStartEditComment,
  onEndEditComment,
  onPortMouseDown,
  onNodeMouseDown,
  onNodeTouchStart,
  onContextMenu,
  onPortHover,
  onPortLeave,
}) => {
  const theme = useCircuitStore((s) => s.theme);
  const isSimulating = useCircuitStore((s) => s.isSimulating);
  const isReadOnlyViewer = useCircuitStore((s) => s.isReadOnlyViewer);
  const toggleComponentState = useCircuitStore((s) => s.toggleComponentState);
  const setComponentPressed = useCircuitStore((s) => s.setComponentPressed);
  const hasWireDraft = useCircuitStore((s) => Boolean(s.wireDraft));
  const updateNodeData = useCircuitStore((s) => s.updateNodeData);
  const componentTagSize = useCircuitStore((s) => s.canvasPreferences.componentTagSize);
  const commentTextSize = useCircuitStore((s) => s.canvasPreferences.commentTextSize);
  const highContrastBadges = useCircuitStore((s) => s.canvasPreferences.highContrastBadges);
  const showCommentText = useCircuitStore((s) => s.canvasPreferences.showCommentText);
  const showTerminalPinsAlways = useCircuitStore((s) => s.canvasPreferences.showTerminalPinsAlways);
  const isDark = theme === "dark";
  const [commentEditValue, setCommentEditValue] = useState(node.comment || "");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const prevIsEditingRef = useRef(false);

  useEffect(() => {
    if (isEditingComment && !prevIsEditingRef.current) {
      if (initialCommentChar) {
        setCommentEditValue((node.comment || "") + initialCommentChar);
      } else {
        setCommentEditValue(node.comment || "");
      }
    } else if (!isEditingComment) {
      setCommentEditValue(node.comment || "");
    }
    prevIsEditingRef.current = Boolean(isEditingComment);
  }, [isEditingComment, initialCommentChar, node.comment]);

  useEffect(() => {
    if (isEditingComment) {
      const timer = setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
          const len = commentInputRef.current.value.length;
          commentInputRef.current.setSelectionRange(len, len);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isEditingComment]);

  if (node.componentId === "junctionDot") {
    return (
      <div
        style={{
          transform: `translate(${node.position.x - 14}px, ${node.position.y - 14}px)`,
          width: "28px",
          height: "28px",
          touchAction: "none",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onNodeMouseDown(node.id, e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onNodeTouchStart?.(node.id, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu?.(node, e);
        }}
        className={`absolute flex items-center justify-center cursor-pointer select-none group z-20 ${
          isSelected ? "ring-2 ring-amber-400 ring-offset-2 rounded-full" : ""
        }`}
        title="Junction Dot (Click to select & delete)"
      >
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors duration-150 ${
            node.isEnergized
              ? "bg-red-500 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.9)]"
              : isDark
              ? "bg-zinc-200 border-zinc-500 shadow-sm"
              : "bg-slate-800 border-slate-600 shadow-sm"
          }`}
        />
      </div>
    );
  }

  const comp = catalog[node.componentId];

  const width = comp?.width || 120;
  const height = comp?.height || 120;
  const nodes = comp?.nodes || [];

  const isPanelDevice =
    node.componentId.startsWith("panelButton") || node.componentId === "panelLamp";

  const isSpring =
    node.componentId === "panelButtonMomentary" ||
    node.componentId.toLowerCase().startsWith("button") ||
    node.componentId.toLowerCase().startsWith("emergency") ||
    comp?.type === "button";
  const isHold =
    node.componentId === "panelButtonLatching" ||
    node.componentId.toLowerCase().startsWith("switch") ||
    node.componentId.toLowerCase().startsWith("breaker") ||
    node.componentId.toLowerCase().startsWith("isolator") ||
    node.componentId.toLowerCase().startsWith("overload") ||
    comp?.type === "switch";

  const isInteractive = isSimulating && (isSpring || isHold);
  const isClosed = node.frameIndex === 1;
  const isPressed = Boolean(node.isPressed);

  const isSwitchOrContact =
    isSpring ||
    isHold ||
    comp?.type === "relayContact" ||
    node.componentId.toLowerCase().includes("contact");

  const isMotor = node.componentId.toLowerCase().startsWith("motor");
  const isTimer =
    node.componentId.includes("Delay") ||
    comp?.tagType === "timerCoils" ||
    comp?.timerType !== undefined;

  // Pre-calculate transformed port coordinates for port rendering & safe label clearance
  const transformedPorts = nodes.map((port: any) => ({
    ...port,
    ...SimulationEngine.getTransformedPort(
      { x: width / 2, y: height / 2 },
      port.dx,
      port.dy,
      port.direction,
      node.rotation
    ),
  }));

  const isHorizontal = node.rotation === 1 || node.rotation === 3;
  const isTagVisible = node.tagVisibility !== false;
  const showTag = isTagVisible && Boolean(node.tag);
  const showComment = (Boolean(node.comment) && showCommentText) || Boolean(isEditingComment);
  const hasLabel = showTag || showComment || isTimer || Boolean(isEditingComment);

  // Smart CAD label placement:
  // - For vertical symbols (rotation 0°/180°), ports are top & bottom. Place label on RIGHT (or LEFT if right ports).
  // - For horizontal symbols (rotation 90°/270°), ports are left & right. Place label centered ABOVE the rotated symbol.
  // This guarantees ZERO collisions with symbol graphic, wires, or adjacent components!
  let labelStyle: React.CSSProperties = {};
  let labelContainerClass = "";

  if (isHorizontal) {
    const visualHalfHeight = width / 2;
    const visualTop = height / 2 - visualHalfHeight;
    const topPos = Math.min(-14, visualTop - 26);
    labelStyle = {
      top: `${topPos}px`,
      left: "50%",
      transform: "translateX(-50%)",
    };
    labelContainerClass = "items-center text-center";
  } else {
    const hasRightPorts = transformedPorts.some((p: any) => p.x >= width - 15);
    if (!hasRightPorts) {
      labelStyle = {
        left: `calc(100% + 10px)`,
        top: `${Math.max(10, Math.min(22, height * 0.15))}px`,
      };
      labelContainerClass = "items-start text-left";
    } else {
      labelStyle = {
        right: `calc(100% + 10px)`,
        top: `${Math.max(10, Math.min(22, height * 0.15))}px`,
      };
      labelContainerClass = "items-end text-right";
    }
  }

  // Cross-reference: count of other components that share the same tag
  const effectivePairedCount =
    pairedCount !== undefined
      ? pairedCount
      : node.tag
      ? useCircuitStore.getState().nodes.filter((n) => n.tag === node.tag && n.id !== node.id).length
      : 0;

  const effectiveConnectedPortIds = useMemo(() => {
    if (connectedPortIds) return connectedPortIds;
    const fallbackWires = useCircuitStore.getState().wires;
    const set = new Set<number>();
    for (const wire of fallbackWires) {
      if (wire.fromNodeId === node.id) set.add(wire.fromPortId);
      if (wire.toNodeId === node.id) set.add(wire.toPortId);
    }
    return set;
  }, [connectedPortIds, node.id]);

  // Show _on.svg for activated switches/contacts (frameIndex === 1) or energized loads
  const isLoadWithOnVariant =
    node.componentId.startsWith("coil") ||
    (node.componentId.startsWith("motor") && !node.componentId.toLowerCase().includes("breaker")) ||
    node.componentId === "buzzer" ||
    node.componentId === "ring" ||
    node.componentId === "siren" ||
    node.componentId === "lamp" ||
    node.componentId === "lampBlink";

  const shouldShowOnVariant =
    (isSwitchOrContact && node.frameIndex === 1) ||
    (Boolean(node.isEnergized) && isLoadWithOnVariant);

  const svgPath = shouldShowOnVariant ? `/symbols/${node.componentId}_on.svg` : comp?.svgPath;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSimulating) {
      e.stopPropagation();
      if (isSpring && e.button === 0) {
        setComponentPressed(node.id, true);
      }
      return;
    }
    if (isReadOnlyViewer) {
      return;
    }
    onNodeMouseDown(node.id, e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isSimulating) {
      if (isSpring) {
        setComponentPressed(node.id, true);
      }
      return;
    }
    if (isReadOnlyViewer) {
      return;
    }
    onNodeTouchStart?.(node.id, e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isSimulating) {
      if (isSpring) {
        setComponentPressed(node.id, false);
      } else if (isHold) {
        toggleComponentState(node.id);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSimulating) {
      e.stopPropagation();
      if (isInteractive) {
        toggleComponentState(node.id);
      }
    }
  };

  return (
    <div
      style={{
        transform: `translate(${node.position.x - width / 2}px, ${node.position.y - height / 2}px)`,
        width: `${width}px`,
        height: `${height}px`,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isReadOnlyViewer) return;
        onContextMenu?.(node, e);
      }}
      className={`absolute select-none group ${
        isInteractive
          ? "cursor-pointer"
          : isSimulating || isReadOnlyViewer
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing"
      }`}
    >
      {/* Selection & Hover highlight box (zero layout shift, no jitter/shake) */}
      {!isReadOnlyViewer && (
        <div
          className={`absolute inset-0 pointer-events-none rounded-sm transition-colors duration-100 ${
            isSelected
              ? "border border-dashed border-amber-400/80 bg-amber-500/[0.04]"
              : "group-hover:border group-hover:border-dashed group-hover:border-amber-400/40"
          }`}
        />
      )}

      {/* Schematic Annotation Label (Tag & Comment & Timer - Simurelay CAD Style) */}
      {hasLabel && (
        <div
          style={labelStyle}
          className={`absolute flex flex-col gap-0.5 pointer-events-none select-none text-xs font-mono whitespace-nowrap z-20 px-1.5 py-0.5 rounded-md transition-colors ${
            !highContrastBadges
              ? "bg-transparent border-transparent shadow-none"
              : isDark
              ? "bg-[#090b10]/95 border border-white/10 shadow-xs"
              : "bg-white/95 border border-slate-200 shadow-xs"
          } ${labelContainerClass}`}
        >
          {/* Tag & Cross-reference row */}
          {(showTag || effectivePairedCount > 0) && (
            <div className="flex items-center gap-1.5">
              {showTag && (
                <span
                  style={{ fontSize: `${typeof componentTagSize === "number" ? componentTagSize : 12}px` }}
                  className={`font-bold tracking-tight ${isDark ? "text-amber-400" : "text-amber-600"}`}
                >
                  {node.tag}
                </span>
              )}
              {effectivePairedCount > 0 && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-sans font-semibold border ${
                    !highContrastBadges
                      ? isDark
                        ? "bg-transparent text-amber-400 border-amber-400/30"
                        : "bg-transparent text-amber-700 border-amber-400/40"
                      : isDark
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                  title={`Paired with ${effectivePairedCount} component(s)`}
                >
                  ↔ {effectivePairedCount}
                </span>
              )}
            </div>
          )}

          {/* Comment description row */}
          {isEditingComment ? (
            <input
              ref={commentInputRef}
              type="text"
              value={commentEditValue}
              style={{ fontSize: `${typeof commentTextSize === "number" ? commentTextSize : 10}px` }}
              onChange={(e) => setCommentEditValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  commentInputRef.current?.blur();
                } else if (e.key === "Escape") {
                  setCommentEditValue(node.comment || "");
                  onEndEditComment?.();
                }
              }}
              onBlur={() => {
                updateNodeData(node.id, { comment: commentEditValue.trim() || null });
                onEndEditComment?.();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={`font-normal leading-tight px-1 py-0.5 rounded outline-none border pointer-events-auto min-w-[70px] max-w-[180px] ${
                isDark
                  ? "bg-zinc-900 text-zinc-100 border-amber-400 shadow-xs"
                  : "bg-white text-slate-900 border-amber-500 shadow-xs"
              }`}
              placeholder="Comment..."
            />
          ) : showComment ? (
            <span
              style={{ fontSize: `${typeof commentTextSize === "number" ? commentTextSize : 10}px` }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!isSimulating && onStartEditComment) {
                  onStartEditComment(node.id);
                }
              }}
              className={`font-normal leading-tight pointer-events-auto cursor-text ${isDark ? "text-zinc-400" : "text-slate-500"}`}
              title="Double-click to edit comment"
            >
              {node.comment}
            </span>
          ) : null}

          {/* Live Timer Countdown Badge */}
          {isTimer && (
            <div
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border mt-0.5 shadow-xs ${
                node.isEnergized
                  ? "bg-amber-500 text-black border-amber-400 animate-pulse"
                  : isDark
                  ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                  : "bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <Clock className="w-2.5 h-2.5" />
              <span>
                {node.timerElapsed !== undefined && node.timerElapsed > 0
                  ? `${node.timerElapsed.toFixed(1)}s / ${(node.valueTimeOn ?? 3)}s`
                  : `${(node.valueTimeOn ?? 3)}s`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pure Symbol Graphics (Direct Canvas Drawing) */}
      <div
        className="w-full h-full flex items-center justify-center relative overflow-visible pointer-events-none"
      >
        <div
          style={{
            transform: `rotate(${node.rotation * 90}deg)`,
            transition: "transform 0.15s ease",
          }}
          className="w-full h-full flex items-center justify-center pointer-events-none relative z-10"
        >
          {node.componentId === "junctionDot" ? (
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 transition-colors duration-150 ${
                node.isEnergized
                  ? "bg-red-500 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                  : isDark
                  ? "bg-zinc-200 border-zinc-500 shadow-sm"
                  : "bg-slate-800 border-slate-600 shadow-sm"
              }`}
            />
          ) : node.componentId === "panelButtonMomentary" || node.componentId === "panelButtonLatching" ? (
            <div className="w-[52px] h-[52px] rounded-full relative flex items-center justify-center pointer-events-none select-none">
              {(() => {
                const color = node.buttonColor || (node.componentId === "panelButtonMomentary" ? "green" : "black");
                const isPressed = Boolean(node.isPressed);
                const isLatched = node.componentId === "panelButtonLatching" && node.frameIndex === 1;

                const buttonPalettes: Record<
                  string,
                  {
                    capFill: string;
                    capStroke: string;
                    pressedFill: string;
                    pressedStroke: string;
                    pipColor: string;
                    accentColor: string;
                  }
                > = {
                  green: {
                    capFill: "#10b981",
                    capStroke: "#059669",
                    pressedFill: "#047857",
                    pressedStroke: "#065f46",
                    pipColor: "#ffffff",
                    accentColor: "#34d399",
                  },
                  red: {
                    capFill: "#ef4444",
                    capStroke: "#dc2626",
                    pressedFill: "#b91c1c",
                    pressedStroke: "#991b1b",
                    pipColor: "#ffffff",
                    accentColor: "#f87171",
                  },
                  yellow: {
                    capFill: "#f59e0b",
                    capStroke: "#d97706",
                    pressedFill: "#b45309",
                    pressedStroke: "#92400e",
                    pipColor: "#ffffff",
                    accentColor: "#fbbf24",
                  },
                  blue: {
                    capFill: "#3b82f6",
                    capStroke: "#2563eb",
                    pressedFill: "#1d4ed8",
                    pressedStroke: "#1e40af",
                    pipColor: "#ffffff",
                    accentColor: "#60a5fa",
                  },
                  white: {
                    capFill: "#f8fafc",
                    capStroke: "#cbd5e1",
                    pressedFill: "#cbd5e1",
                    pressedStroke: "#94a3b8",
                    pipColor: "#0f172a",
                    accentColor: "#ffffff",
                  },
                  black: {
                    capFill: isDark ? "#27272a" : "#334155",
                    capStroke: isDark ? "#52525b" : "#1e293b",
                    pressedFill: isDark ? "#18181b" : "#0f172a",
                    pressedStroke: isDark ? "#3f3f46" : "#020617",
                    pipColor: "#ffffff",
                    accentColor: "#94a3b8",
                  },
                };

                const pal = buttonPalettes[color] || buttonPalettes.green;

                if (node.componentId === "panelButtonLatching") {
                  // Industrial Rotary Selector Switch with Smooth Mechanical Jarum/Needle Rotation
                  return (
                    <svg width="52" height="52" viewBox="0 0 52 52" className="overflow-visible">
                      {/* Recessed Mounting Base Bezel */}
                      <circle
                        cx="26"
                        cy="26"
                        r="23"
                        fill={isDark ? "#18181b" : "#f8fafc"}
                        stroke={isLatched ? pal.accentColor : (isDark ? "#3f3f46" : "#cbd5e1")}
                        strokeWidth={isLatched ? "2" : "1.5"}
                        className="transition-colors duration-200"
                      />
                      {/* Position Tick Marks: 0 (OFF - Top Left) & 1 (ON - Top Right) */}
                      <line
                        x1="12"
                        y1="12"
                        x2="16"
                        y2="16"
                        stroke={!isLatched ? (isDark ? "#e4e4e7" : "#0f172a") : (isDark ? "#52525b" : "#94a3b8")}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="transition-colors duration-200"
                      />
                      <line
                        x1="40"
                        y1="12"
                        x2="36"
                        y2="16"
                        stroke={isLatched ? pal.accentColor : (isDark ? "#52525b" : "#94a3b8")}
                        strokeWidth={isLatched ? "2.5" : "1.5"}
                        strokeLinecap="round"
                        className="transition-colors duration-200"
                      />
                      {/* Active ON LED Indicator Pip at position 1 */}
                      <circle
                        cx="40"
                        cy="12"
                        r={isLatched ? 3 : 2}
                        fill={isLatched ? pal.accentColor : (isDark ? "#27272a" : "#cbd5e1")}
                        className="transition-all duration-200"
                      />
                      {/* Center Rotary Knob Body */}
                      <circle
                        cx="26"
                        cy="26"
                        r="14"
                        fill={pal.capFill}
                        stroke={pal.capStroke}
                        strokeWidth="1.5"
                      />
                      {/* Rotary Selector Jarum / Needle (Rotates smoothly: -45° OFF <-> +45° ON around center 26px, 26px) */}
                      <g
                        style={{
                          transformOrigin: "26px 26px",
                          transformBox: "view-box",
                          transform: isLatched ? "rotate(45deg)" : "rotate(-45deg)",
                          transition: "transform 220ms cubic-bezier(0.34, 1.35, 0.64, 1)",
                        }}
                      >
                        {/* Needle Bar */}
                        <line
                          x1="26"
                          y1="26"
                          x2="26"
                          y2="14"
                          stroke={pal.pipColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        {/* Center Pivot Pip */}
                        <circle cx="26" cy="26" r="4" fill={pal.pipColor} />
                      </g>
                    </svg>
                  );
                }

                // Momentary Pushbutton: Distinct, unmistakable mechanical press feedback
                return (
                  <svg width="52" height="52" viewBox="0 0 52 52" className="overflow-visible">
                    {/* Mounting Bezel with Chamber Well */}
                    <circle
                      cx="26"
                      cy="26"
                      r="23"
                      fill={isPressed ? (isDark ? "#09090b" : "#cbd5e1") : (isDark ? "#18181b" : "#f1f5f9")}
                      stroke={isPressed ? pal.accentColor : (isDark ? "#52525b" : "#94a3b8")}
                      strokeWidth={isPressed ? "2.5" : "1.5"}
                      className="transition-all duration-75"
                    />
                    {/* Button Cap: Noticeably depresses from r=18 down to r=14 when pressed! */}
                    <circle
                      cx="26"
                      cy="26"
                      r={isPressed ? 14 : 18}
                      fill={isPressed ? pal.pressedFill : pal.capFill}
                      stroke={isPressed ? pal.pressedStroke : pal.capStroke}
                      strokeWidth="1.5"
                      className="transition-all duration-75"
                    />
                    {/* Center Tactile Target: Solid bright pip when pressed, clean tactile ring when idle */}
                    <circle
                      cx="26"
                      cy="26"
                      r={isPressed ? 4 : 7}
                      fill={isPressed ? pal.pipColor : "none"}
                      stroke={pal.pipColor}
                      strokeWidth="1.5"
                      className="transition-all duration-75 opacity-90"
                    />
                  </svg>
                );
              })()}
            </div>
          ) : node.componentId === "panelLamp" ? (
            <div className="w-[52px] h-[52px] rounded-full relative flex items-center justify-center pointer-events-none select-none">
              {(() => {
                const color = node.lampColor || "green";
                const isLit = Boolean(node.isEnergized || node.frameIndex === 1);

                const palette: Record<
                  string,
                  { onFill: string; onStroke: string; offFill: string; offStroke: string; markOn: string; markOff: string }
                > = {
                  red: {
                    onFill: "#ef4444",
                    onStroke: "#dc2626",
                    offFill: isDark ? "#450a0a" : "#fee2e2",
                    offStroke: isDark ? "#7f1d1d" : "#fca5a5",
                    markOn: "#ffffff",
                    markOff: isDark ? "#991b1b" : "#f87171",
                  },
                  green: {
                    onFill: "#10b981",
                    onStroke: "#059669",
                    offFill: isDark ? "#022c22" : "#d1fae5",
                    offStroke: isDark ? "#064e3b" : "#6ee7b7",
                    markOn: "#ffffff",
                    markOff: isDark ? "#065f46" : "#34d399",
                  },
                  yellow: {
                    onFill: "#f59e0b",
                    onStroke: "#d97706",
                    offFill: isDark ? "#451a03" : "#fef3c7",
                    offStroke: isDark ? "#78350f" : "#fcd34d",
                    markOn: "#ffffff",
                    markOff: isDark ? "#92400e" : "#fbbf24",
                  },
                  blue: {
                    onFill: "#3b82f6",
                    onStroke: "#2563eb",
                    offFill: isDark ? "#172554" : "#dbeafe",
                    offStroke: isDark ? "#1e3a8a" : "#93c5fd",
                    markOn: "#ffffff",
                    markOff: isDark ? "#1d4ed8" : "#60a5fa",
                  },
                  white: {
                    onFill: "#f8fafc",
                    onStroke: "#cbd5e1",
                    offFill: isDark ? "#27272a" : "#f1f5f9",
                    offStroke: isDark ? "#52525b" : "#cbd5e1",
                    markOn: "#0f172a",
                    markOff: isDark ? "#71717a" : "#94a3b8",
                  },
                };

                const current = palette[color] || palette.green;

                return (
                  <svg width="52" height="52" viewBox="0 0 52 52" className="overflow-visible">
                    {/* Minimalist Outer Bezel */}
                    <circle
                      cx="26"
                      cy="26"
                      r="23"
                      fill={isDark ? "#18181b" : "#f1f5f9"}
                      stroke={isLit ? current.onStroke : (isDark ? "#52525b" : "#94a3b8")}
                      strokeWidth={isLit ? "2" : "1.5"}
                      className="transition-colors duration-150"
                    />
                    {/* Flat Minimalist Colored Lens */}
                    <circle
                      cx="26"
                      cy="26"
                      r="17"
                      fill={isLit ? current.onFill : current.offFill}
                      stroke={isLit ? current.onStroke : current.offStroke}
                      strokeWidth="1.5"
                      className="transition-colors duration-150"
                    />
                    {/* Clean Minimalist Pilot Lamp Cross Reticle */}
                    <line
                      x1="15"
                      y1="15"
                      x2="37"
                      y2="37"
                      stroke={isLit ? current.markOn : current.markOff}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="37"
                      y1="15"
                      x2="15"
                      y2="37"
                      stroke={isLit ? current.markOn : current.markOff}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                );
              })()}
            </div>
          ) : comp?.svgPath ? (
            <SymbolRenderer
              svgPath={svgPath}
              componentId={node.componentId}
              name={node.name}
              rotation={node.rotation}
              isEnergized={node.isEnergized}
              isDark={isDark}
            />
          ) : (
            <div className="text-[10px] text-zinc-500">{node.componentId}</div>
          )}

          {/* Fan Blades / Kincir Baling-Baling Motor Rotation Indicator */}
          {isMotor && node.isEnergized && (
            <div
              style={{
                width: `${width}px`,
                height: `${height}px`,
              }}
              className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                node.motorDirection === "ccw"
                  ? "animate-[spin_1s_linear_infinite_reverse]"
                  : "animate-[spin_1s_linear_infinite]"
              }`}
            >
              <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
              >
                {(() => {
                  const cx = width / 2;
                  const cy = height / 2;
                  const isDC = width === 120;
                  const R = isDC ? 34 : 50;
                  const hubR = isDC ? 5.5 : 7.5;
                  const isCCW = node.motorDirection === "ccw";
                  const colorStroke = isCCW ? "#3b82f6" : "#22c55e";
                  const colorFill = isCCW ? "rgba(59, 130, 246, 0.4)" : "rgba(34, 197, 94, 0.4)";

                  return (
                    <g transform={`translate(${cx}, ${cy})`}>
                      {/* 4 Aerodynamic Fan Blades (Baling-baling / Kincir) */}
                      {[0, 90, 180, 270].map((angle) => (
                        <path
                          key={angle}
                          transform={`rotate(${angle})`}
                          d={`M 0 -${hubR} 
                              C ${R * 0.35} -${R * 0.35}, ${R * 0.48} -${R * 0.75}, ${R * 0.22} -${R} 
                              C ${R * 0.05} -${R * 1.04}, -${R * 0.18} -${R * 0.96}, -${R * 0.16} -${R * 0.72} 
                              C -${R * 0.12} -${R * 0.48}, -${hubR * 0.6} -${hubR * 0.9}, 0 -${hubR} Z`}
                          fill={colorFill}
                          stroke={colorStroke}
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      ))}
                      {/* Center Hub (Poros Tengah) */}
                      <circle
                        cx="0"
                        cy="0"
                        r={hubR}
                        fill={colorStroke}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      {/* Center Pin Accent */}
                      <circle cx="0" cy="0" r={hubR * 0.4} fill="#ffffff" />
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Connection Ports (Magnetic Pins - Only Glow on Hover) */}
      {transformedPorts.map((transformed: any, idx: number) => {
        return (
          <div
            key={`${transformed.id}-${idx}`}
            style={{
              left: `${transformed.x}px`,
              top: `${transformed.y}px`,
              touchAction: "none",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (isReadOnlyViewer) return;
              onPortMouseDown(
                node.id,
                transformed.id,
                {
                  x: node.position.x - width / 2 + transformed.x,
                  y: node.position.y - height / 2 + transformed.y,
                },
                e
              );
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              if (isReadOnlyViewer) return;
              onPortMouseDown(
                node.id,
                transformed.id,
                {
                  x: node.position.x - width / 2 + transformed.x,
                  y: node.position.y - height / 2 + transformed.y,
                },
                e
              );
            }}
            onMouseEnter={(e) => onPortHover?.(node, transformed.id, e)}
            onMouseLeave={() => onPortLeave?.()}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center group/port z-30 ${
              isReadOnlyViewer ? "cursor-default" : "cursor-crosshair"
            }`}
            title={`Terminal ${transformed.tag || transformed.id} (${transformed.type})`}
          >
            {/* Magnetic Glow Ring: visible when drafting/selected or hovered (zero shifting/scaling animation) */}
            {!isReadOnlyViewer && (
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity duration-100 ${
                  hasWireDraft || isSelected
                    ? "opacity-95 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                    : "opacity-0 group-hover:opacity-100 group-hover/port:opacity-100"
                } ${
                  isDark
                    ? "bg-black/90 border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                    : "bg-white border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            )}

            {/* Terminal Tag Tooltip on Direct Port Hover or Always visible */}
            <span
              className={`absolute ${showTerminalPinsAlways ? "opacity-100" : "opacity-0 group-hover/port:opacity-100"} text-[9px] font-mono px-1 py-0.5 rounded border whitespace-nowrap pointer-events-none transition-opacity z-30 ${
                transformed.y <= 15
                  ? "bottom-full mb-1.5 left-1/2 -translate-x-1/2"
                  : transformed.y >= height - 15
                  ? "top-full mt-1.5 left-1/2 -translate-x-1/2"
                  : transformed.x <= 15
                  ? "right-full mr-1.5 top-1/2 -translate-y-1/2"
                  : "left-full ml-1.5 top-1/2 -translate-y-1/2"
              } ${
                isDark
                  ? "bg-black/95 text-amber-300 border-amber-500/40 shadow-lg"
                  : "bg-white text-slate-800 border-slate-300 shadow-md"
              }`}
            >
              {transformed.tag || transformed.id}
            </span>
          </div>
        );
      })}
    </div>
  );
}, areNodePropsEqual);
FlowNode.displayName = "FlowNode";
