"use client";

import React from "react";
import { CircuitNode } from "@/engine/types";
import { useCircuitStore } from "@/store/useCircuitStore";
import catalogData from "@/constants/components-catalog.json";
import { SimulationEngine } from "@/engine/SimulationEngine";

const catalog = catalogData as Record<string, any>;

interface FlowNodeProps {
  node: CircuitNode;
  isSelected: boolean;
  onPortMouseDown: (portId: number, portPos: { x: number; y: number }, e: React.MouseEvent) => void;
  onNodeMouseDown: (nodeId: string | number, e: React.MouseEvent) => void;
  onContextMenu?: (node: CircuitNode, e: React.MouseEvent) => void;
  onPortHover?: (node: CircuitNode, portId: number, e: React.MouseEvent) => void;
  onPortLeave?: () => void;
}

export const FlowNode: React.FC<FlowNodeProps> = ({
  node,
  isSelected,
  onPortMouseDown,
  onNodeMouseDown,
  onContextMenu,
  onPortHover,
  onPortLeave,
}) => {
  const { theme, isSimulating, toggleComponentState, setComponentPressed, nodes: allNodes } = useCircuitStore();
  const isDark = theme === "dark";
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

  // Cross-reference: find all other nodes that share the same tag
  const pairedNodes = node.tag
    ? allNodes.filter((n) => n.tag === node.tag && n.id !== node.id)
    : [];

  // Show _on.svg for closed switches/contacts or energized lamps
  const shouldShowOnVariant =
    (isSwitchOrContact && isClosed) ||
    (Boolean(node.isEnergized) && (node.componentId === "lamp" || node.componentId === "lampBlink"));

  const svgPath = shouldShowOnVariant ? `/symbols/${node.componentId}_on.svg` : comp?.svgPath;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSimulating) {
      e.stopPropagation();
      return;
    }
    onNodeMouseDown(node.id, e);
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
      }}
      onMouseDown={handleMouseDown}
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
        isSelected ? "border border-dashed border-amber-400/80 bg-amber-500/[0.04]" : ""
      }`}
    >
      {/* Schematic Annotation Label (Tag & Comment - Simurelay CAD Style) */}
      {(node.tag || node.comment) && (
        <div className="absolute -top-5 left-1 flex items-center gap-1.5 pointer-events-none text-xs font-mono select-none z-10 whitespace-nowrap">
          {node.tag && (
            <span className={`font-bold tracking-tight ${isDark ? "text-amber-400" : "text-amber-700"}`}>
              {node.tag}
            </span>
          )}
          {node.comment && (
            <span className={`text-[10px] font-normal ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              ({node.comment})
            </span>
          )}
          {/* Cross-Reference Badge: shows count of paired contacts/coils */}
          {pairedNodes.length > 0 && (
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-sans font-semibold border ${
                isDark
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}
              title={`Paired with ${pairedNodes.length} component(s): ${pairedNodes.map((p) => p.name).join(", ")}`}
            >
              ↔ {pairedNodes.length}
            </span>
          )}
        </div>
      )}

      {/* Live Timer Countdown Badge (Simurelay Style) */}
      {isTimer && (
        <div
          className={`absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border z-20 pointer-events-none ${
            node.isEnergized
              ? "bg-amber-500 text-black border-amber-400 animate-pulse"
              : isDark
              ? "bg-zinc-800 text-zinc-300 border-zinc-700"
              : "bg-slate-200 text-slate-700 border-slate-300"
          }`}
        >
          {node.timerElapsed !== undefined && node.timerElapsed > 0
            ? `${node.timerElapsed.toFixed(1)}s / ${(node.valueTimeOn ?? 3)}s`
            : `${(node.valueTimeOn ?? 3)}s`}
        </div>
      )}

      {/* Pure Symbol Graphics (Direct Canvas Drawing, Zero Card Box) */}
      <div
        className="w-full h-full flex items-center justify-center relative overflow-visible pointer-events-none"
      >
        <div
          style={{
            transform: `rotate(${node.rotation * 90}deg)`,
            transition: "transform 0.15s ease",
          }}
          className="w-full h-full flex items-center justify-center pointer-events-none relative"
        >
          {comp?.svgPath ? (
            <img
              src={svgPath}
              alt={node.name}
              className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-150 ${
                isDark
                  ? node.isEnergized
                    ? "brightness-125"
                    : "opacity-95"
                  : node.isEnergized
                    ? "filter invert brightness-110"
                    : "filter invert opacity-95"
              }`}
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
      {nodes.map((port: any) => {
        const transformed = SimulationEngine.getTransformedPort(
          { x: width / 2, y: height / 2 },
          port.dx,
          port.dy,
          port.direction,
          node.rotation
        );

        return (
          <div
            key={port.id}
            style={{
              left: `${transformed.x}px`,
              top: `${transformed.y}px`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onPortMouseDown(
                port.id,
                {
                  x: node.position.x - width / 2 + transformed.x,
                  y: node.position.y - height / 2 + transformed.y,
                },
                e
              );
            }}
            onMouseEnter={(e) => onPortHover?.(node, port.id, e)}
            onMouseLeave={() => onPortLeave?.()}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center group/port cursor-crosshair z-20"
            title={`Terminal ${port.tag || port.id} (${port.type})`}
          >
            {/* Magnetic Glow Ring: Hidden by default, glows on symbol/port hover */}
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100 group-hover/port:scale-125 ${
                isDark
                  ? "bg-black/90 border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  : "bg-white border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>

            {/* Terminal Tag Tooltip on Direct Port Hover */}
            <span
              className={`absolute opacity-0 group-hover/port:opacity-100 -top-5 text-[9px] font-mono px-1 py-0.5 rounded border whitespace-nowrap pointer-events-none transition-opacity z-30 ${
                isDark
                  ? "bg-black/95 text-amber-300 border-amber-500/40 shadow-lg"
                  : "bg-white text-slate-800 border-slate-300 shadow-md"
              }`}
            >
              {port.tag || port.id}
            </span>
          </div>
        );
      })}
    </div>
  );
};
