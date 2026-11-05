"use client";

import React from "react";
import { CircuitNode, CircuitWire, Point } from "@/engine/types";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import { SimulationEngine } from "@/engine/SimulationEngine";
import catalogData from "@/constants/components-catalog.json";
import { useCircuitStore } from "@/store/useCircuitStore";

const catalog = catalogData as Record<string, any>;

interface FlowWireProps {
  wire: CircuitWire;
  fromNode?: CircuitNode;
  toNode?: CircuitNode;
  isSelected: boolean;
  routingMode: "orthogonal" | "bezier";
  onContextMenu?: (wire: CircuitWire, e: React.MouseEvent) => void;
  onWireHover?: (wire: CircuitWire, e: React.MouseEvent) => void;
  onWireLeave?: () => void;
}

export const FlowWire: React.FC<FlowWireProps> = ({
  wire,
  fromNode,
  toNode,
  isSelected,
  routingMode,
  onContextMenu,
  onWireHover,
  onWireLeave,
}) => {
  const { selectWire, isSimulating, wireDraft, splitWireAtJunction, theme } = useCircuitStore();
  const isDark = theme === "dark";

  if (!fromNode || !toNode) return null;

  const compFrom = catalog[fromNode.componentId];
  const compTo = catalog[toNode.componentId];

  const portFrom = compFrom?.nodes?.find((n: any) => n.id === wire.fromPortId);
  const portTo = compTo?.nodes?.find((n: any) => n.id === wire.toPortId);

  if (!portFrom || !portTo) return null;

  const pFromTransformed = SimulationEngine.getTransformedPort(
    fromNode.position,
    portFrom.dx,
    portFrom.dy,
    portFrom.direction,
    fromNode.rotation
  );

  const pToTransformed = SimulationEngine.getTransformedPort(
    toNode.position,
    portTo.dx,
    portTo.dy,
    portTo.direction,
    toNode.rotation
  );

  const p1: Point = { x: pFromTransformed.x, y: pFromTransformed.y };
  const p2: Point = { x: pToTransformed.x, y: pToTransformed.y };

  const routed =
    routingMode === "bezier"
      ? ManhattanRouter.routeBezier(p1, pFromTransformed.direction, p2, pToTransformed.direction)
      : ManhattanRouter.routeOrthogonal(
          p1,
          pFromTransformed.direction,
          p2,
          pToTransformed.direction,
          wire.margins
        );

  const isHot = wire.isHot;

  const handleWireClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently drafting a wire, clicking on an existing wire auto-splices it with a junction!
    if (wireDraft) {
      splitWireAtJunction(wire.id, { x: e.nativeEvent.offsetX || p1.x, y: e.nativeEvent.offsetY || p1.y });
      return;
    }

    selectWire(wire.id, e.shiftKey);
  };

  // Uniform Wire color (clean CAD standard, zero phase differentiation)
  const getWireColor = () => {
    if (isSelected) return "#f59e0b"; // Highlight selection
    if (isHot) return "#ef4444"; // Uniform energized wire color across all potentials
    return isDark ? "#94a3b8" : "#334155"; // Uniform idle schematic wire
  };

  const wireColor = getWireColor();

  return (
    <g
      onClick={handleWireClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(wire, e);
      }}
      onMouseEnter={(e) => onWireHover?.(wire, e)}
      onMouseLeave={() => onWireLeave?.()}
      className="cursor-pointer group"
    >
      {/* 1. Broad Invisible Click / Hit Target */}
      <path
        d={routed.svgPath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="pointer-events-auto"
      />

      {/* 2. Glow Layer (when Hot or Selected) */}
      {(isHot || isSelected) && (
        <path
          d={routed.svgPath}
          fill="none"
          stroke={wireColor}
          strokeWidth={isSelected ? 4 : 2}
          strokeOpacity={isSelected ? 0.3 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* 3. Core Wire Path */}
      <path
        d={routed.svgPath}
        fill="none"
        stroke={wireColor}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors group-hover:stroke-zinc-400"
      />

      {/* 4. Active Current Animation (Flowing Dashes) */}
      {isHot && isSimulating && (
        <path
          d={routed.svgPath}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeDasharray="4, 8"
          strokeLinecap="round"
          className="animate-[flow_1s_linear_infinite]"
        />
      )}

      {/* 5. Terminal Connection Anchor Dots */}
      <circle
        cx={p1.x}
        cy={p1.y}
        r={isSelected ? 3.5 : 2.5}
        fill={wireColor}
        className="transition-all"
      />
      <circle
        cx={p2.x}
        cy={p2.y}
        r={isSelected ? 3.5 : 2.5}
        fill={wireColor}
        className="transition-all"
      />
    </g>
  );
};
