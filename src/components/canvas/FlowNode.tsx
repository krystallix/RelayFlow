"use client";

import React from "react";
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
  onPortMouseDown: (portId: number, portPos: { x: number; y: number }, e: React.MouseEvent | React.TouchEvent) => void;
  onNodeMouseDown: (nodeId: string | number, e: React.MouseEvent) => void;
  onNodeTouchStart?: (nodeId: string | number, e: React.TouchEvent) => void;
  onContextMenu?: (node: CircuitNode, e: React.MouseEvent) => void;
  onPortHover?: (node: CircuitNode, portId: number, e: React.MouseEvent) => void;
  onPortLeave?: () => void;
}

export const FlowNode: React.FC<FlowNodeProps> = ({
  node,
  isSelected,
  onPortMouseDown,
  onNodeMouseDown,
  onNodeTouchStart,
  onContextMenu,
  onPortHover,
  onPortLeave,
}) => {
  const { theme, isSimulating, toggleComponentState, setComponentPressed, nodes: allNodes, wireDraft } = useCircuitStore();
  const isDark = theme === "dark";

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
          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
            node.isEnergized
              ? "bg-red-500 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.9)] scale-110"
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

  const isSpring =
    node.componentId.toLowerCase().startsWith("button") ||
    node.componentId.toLowerCase().startsWith("emergency") ||
    comp?.type === "button";
  const isHold =
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
  const showComment = Boolean(node.comment);
  const hasLabel = showTag || showComment || isTimer;

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

  // Cross-reference: find all other nodes that share the same tag
  const pairedNodes = node.tag
    ? allNodes.filter((n) => n.tag === node.tag && n.id !== node.id)
    : [];

  // Show _on.svg for activated switches/contacts (frameIndex === 1) or energized lamps
  const shouldShowOnVariant =
    (isSwitchOrContact && node.frameIndex === 1) ||
    (Boolean(node.isEnergized) && (node.componentId === "lamp" || node.componentId === "lampBlink"));

  const svgPath = shouldShowOnVariant ? `/symbols/${node.componentId}_on.svg` : comp?.svgPath;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSimulating) {
      e.stopPropagation();
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
        onContextMenu?.(node, e);
      }}
      className={`absolute select-none group ${
        isInteractive
          ? "cursor-pointer"
          : isSimulating
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing"
      } ${
        isSelected
          ? "border border-dashed border-amber-400/80 bg-amber-500/[0.04]"
          : "hover:border hover:border-dashed hover:border-amber-400/40"
      }`}
    >
      {/* Schematic Annotation Label (Tag & Comment & Timer - Simurelay CAD Style) */}
      {hasLabel && (
        <div
          style={labelStyle}
          className={`absolute flex flex-col gap-0.5 pointer-events-none select-none text-xs font-mono whitespace-nowrap z-20 px-1.5 py-0.5 rounded-md transition-all ${
            isDark
              ? "bg-[#090b10]/40 border border-white/5 shadow-xs"
              : "bg-white/45 border border-slate-200/50 shadow-xs"
          } ${labelContainerClass}`}
        >
          {/* Tag & Cross-reference row */}
          {(showTag || pairedNodes.length > 0) && (
            <div className="flex items-center gap-1.5">
              {showTag && (
                <span className={`font-bold tracking-tight text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                  {node.tag}
                </span>
              )}
              {pairedNodes.length > 0 && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-sans font-semibold border ${
                    isDark
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                  title={`Paired with ${pairedNodes.length} component(s): ${pairedNodes.map((p) => p.name).join(", ")}`}
                >
                  ↔ {pairedNodes.length}
                </span>
              )}
            </div>
          )}

          {/* Comment description row */}
          {showComment && (
            <span className={`text-[10px] font-normal leading-tight ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              {node.comment}
            </span>
          )}

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
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                node.isEnergized
                  ? "bg-red-500 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.9)] scale-110"
                  : isDark
                  ? "bg-zinc-200 border-zinc-500 shadow-sm"
                  : "bg-slate-800 border-slate-600 shadow-sm"
              }`}
            />
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

          {/* Inner Circular Arrow Motor Rotation Indicator */}
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
                <defs>
                  <marker
                    id={`arrowhead-${node.id}`}
                    markerWidth="6"
                    markerHeight="6"
                    refX="4"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 6 3, 0 6"
                      fill={node.motorDirection === "ccw" ? "#3b82f6" : "#22c55e"}
                    />
                  </marker>
                </defs>
                {/* Perfect circular arc inside the motor circle (R=58px centered at width/2, height/2) */}
                <path
                  d={
                    node.motorDirection === "ccw"
                      ? `M ${width / 2 + 58} ${height / 2} A 58 58 0 1 0 ${width / 2 - 20} ${height / 2 + 54}`
                      : `M ${width / 2 - 58} ${height / 2} A 58 58 0 1 1 ${width / 2 + 20} ${height / 2 + 54}`
                  }
                  fill="none"
                  stroke={node.motorDirection === "ccw" ? "#3b82f6" : "#22c55e"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  markerEnd={`url(#arrowhead-${node.id})`}
                />
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
              onPortMouseDown(
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
              onPortMouseDown(
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
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center group/port cursor-crosshair z-30"
            title={`Terminal ${transformed.tag || transformed.id} (${transformed.type})`}
          >
            {/* Magnetic Glow Ring: visible & pulsing on mobile or when drafting/selected, glows on hover */}
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 ${
                wireDraft || isSelected
                  ? "opacity-95 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse"
                  : "opacity-40 md:opacity-0 group-hover:opacity-100 group-hover/port:scale-125"
              } ${
                isDark
                  ? "bg-black/90 border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  : "bg-white border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>

            {/* Terminal Tag Tooltip on Direct Port Hover: points OUTWARD away from symbol */}
            <span
              className={`absolute opacity-0 group-hover/port:opacity-100 text-[9px] font-mono px-1 py-0.5 rounded border whitespace-nowrap pointer-events-none transition-opacity z-30 ${
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
};
