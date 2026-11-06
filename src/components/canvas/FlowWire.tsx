"use client";

import React, { useState } from "react";
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
  obstacles?: Array<{ x: number; y: number; width: number; height: number }>;
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onContextMenu?: (wire: CircuitWire, e: React.MouseEvent) => void;
  onWireHover?: (wire: CircuitWire, e: React.MouseEvent) => void;
  onWireLeave?: () => void;
  onStartDragSegment?: (wire: CircuitWire, orientation: "horizontal" | "vertical", defaultMid: number) => void;
}

function getNearestPointOnSegments(mouse: Point, points: Point[]): { point: Point; dist: number } {
  let bestDist = Infinity;
  let bestPoint = points[0] || mouse;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    let projX = mouse.x;
    let projY = mouse.y;

    if (Math.abs(a.x - b.x) < 0.1) {
      projX = a.x;
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      let snappedY = Math.round(mouse.y / 30) * 30;
      snappedY = Math.max(minY, Math.min(maxY, snappedY));
      projY = snappedY;
    } else {
      projY = a.y;
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      let snappedX = Math.round(mouse.x / 30) * 30;
      snappedX = Math.max(minX, Math.min(maxX, snappedX));
      projX = snappedX;
    }

    const dist = Math.hypot(mouse.x - projX, mouse.y - projY);
    if (dist < bestDist) {
      bestDist = dist;
      bestPoint = { x: projX, y: projY };
    }
  }

  return { point: bestPoint, dist: bestDist };
}

export const FlowWire: React.FC<FlowWireProps> = ({
  wire,
  fromNode,
  toNode,
  isSelected,
  routingMode,
  obstacles = [],
  screenToWorld,
  onContextMenu,
  onWireHover,
  onWireLeave,
  onStartDragSegment,
}) => {
  const { selectWire, isSimulating, wireDraft, connectWireToWire, theme } = useCircuitStore();
  const isDark = theme === "dark";

  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  if (!fromNode) return null;

  const compFrom = catalog[fromNode.componentId];
  const portFrom = compFrom?.nodes?.find((n: any) => n.id === wire.fromPortId);
  if (!portFrom) return null;

  const pFromTransformed = SimulationEngine.getTransformedPort(
    fromNode.position,
    portFrom.dx,
    portFrom.dy,
    portFrom.direction,
    fromNode.rotation
  );

  const p1: Point = { x: pFromTransformed.x, y: pFromTransformed.y };

  const isTapWire = Boolean(wire.toWireId && wire.tapPoint);
  let p2: Point;
  let dir2: number;

  if (isTapWire && wire.tapPoint) {
    p2 = wire.tapPoint;
    if (Math.abs(p1.y - p2.y) >= Math.abs(p1.x - p2.x)) {
      dir2 = p1.y <= p2.y ? 0 : 2;
    } else {
      dir2 = p1.x <= p2.x ? 3 : 1;
    }
  } else {
    if (!toNode) return null;
    const compTo = catalog[toNode.componentId];
    const portTo = compTo?.nodes?.find((n: any) => n.id === wire.toPortId);
    if (!portTo) return null;

    const pToTransformed = SimulationEngine.getTransformedPort(
      toNode.position,
      portTo.dx,
      portTo.dy,
      portTo.direction,
      toNode.rotation
    );
    p2 = { x: pToTransformed.x, y: pToTransformed.y };
    dir2 = pToTransformed.direction;
  }

  const effectiveMargins = isTapWire ? { ...wire.margins, end: -30 } : wire.margins;

  const routed =
    routingMode === "bezier"
      ? ManhattanRouter.routeBezier(p1, pFromTransformed.direction, p2, dir2)
      : ManhattanRouter.routeOrthogonal(
          p1,
          pFromTransformed.direction,
          p2,
          dir2,
          effectiveMargins,
          obstacles
        );

  const isHot = wire.isHot;

  // Extract the middle segment for draw.io dragging
  let midHandle: Point | null = null;
  let segmentOrientation: "horizontal" | "vertical" = "horizontal";
  let defaultMid = 0;
  let segStart: Point | null = null;
  let segEnd: Point | null = null;

  if (routingMode === "orthogonal" && routed.points && routed.points.length >= 4) {
    const pStart = routed.points.length >= 6 ? routed.points[2] : routed.points[1];
    const pEnd = routed.points.length >= 6 ? routed.points[3] : routed.points[routed.points.length - 2];
    segStart = pStart;
    segEnd = pEnd;

    const isHoriz = Math.abs(pStart.y - pEnd.y) < 2;
    segmentOrientation = isHoriz ? "horizontal" : "vertical";

    if (isHoriz) {
      midHandle = { x: (pStart.x + pEnd.x) / 2, y: pStart.y };
      const stubStart = routed.points.length >= 6 ? routed.points[1] : pStart;
      const stubEnd = routed.points.length >= 6 ? routed.points[4] : pEnd;
      defaultMid = (stubStart.y + stubEnd.y) / 2;
    } else {
      midHandle = { x: pStart.x, y: (pStart.y + pEnd.y) / 2 };
      const stubStart = routed.points.length >= 6 ? routed.points[1] : pStart;
      const stubEnd = routed.points.length >= 6 ? routed.points[4] : pEnd;
      defaultMid = (stubStart.x + stubEnd.x) / 2;
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const { point, dist } = getNearestPointOnSegments(world, routed.points);
    if (dist < 30) {
      setHoverPos(point);
    } else {
      setHoverPos(null);
    }
  };

  const handleWireMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently drafting a wire from a component terminal, clicking anywhere on the wire attaches to it!
    if (wireDraft) {
      e.preventDefault();
      const world = screenToWorld(e.clientX, e.clientY);
      const { point } = getNearestPointOnSegments(world, routed.points);
      connectWireToWire(wire.id, point);
      return;
    }

    // Normal click: strictly focus / select the wire
    selectWire(wire.id, e.shiftKey);
  };

  const handleWireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wireDraft) return;
    selectWire(wire.id, e.shiftKey);
  };

  const handleStartDragSegment = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (wireDraft) {
      e.preventDefault();
      const world = screenToWorld(e.clientX, e.clientY);
      const { point } = getNearestPointOnSegments(world, routed.points);
      connectWireToWire(wire.id, point);
      return;
    }

    if (isSimulating || !midHandle) return;
    e.preventDefault();
    onStartDragSegment?.(wire, segmentOrientation, defaultMid);
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
      onMouseDown={handleWireMouseDown}
      onClick={handleWireClick}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(wire, e);
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onWireHover?.(wire, e);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoverPos(null);
        onWireLeave?.();
      }}
      className="cursor-pointer group"
    >
      {/* 1. Broad Invisible Click / Hit Target */}
      <path
        d={routed.svgPath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="pointer-events-auto"
        onMouseDown={handleWireMouseDown}
      />

      {/* 2. Middle Segment Line Drag Hit Target (draw.io style drag directly on line) */}
      {segStart && segEnd && !isSimulating && (
        <line
          x1={segStart.x}
          y1={segStart.y}
          x2={segEnd.x}
          y2={segEnd.y}
          stroke="transparent"
          strokeWidth={18}
          className={`pointer-events-auto ${
            wireDraft
              ? "cursor-crosshair"
              : segmentOrientation === "horizontal"
              ? "cursor-ns-resize"
              : "cursor-ew-resize"
          }`}
          onMouseDown={handleStartDragSegment}
        />
      )}

      {/* 3. Glow Layer (when Hot, Selected, or Hovered) */}
      {(isHot || isSelected || isHovered) && (
        <path
          d={routed.svgPath}
          fill="none"
          stroke={wireColor}
          strokeWidth={isSelected ? 4 : isHovered ? 3.5 : 2}
          strokeOpacity={isSelected ? 0.35 : isHovered ? 0.25 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* 4. Core Wire Path */}
      <path
        d={routed.svgPath}
        fill="none"
        stroke={wireColor}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors group-hover:stroke-amber-400"
      />

      {/* 5. Active Current Animation (Flowing Dashes) */}
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

      {/* 6. Terminal Connection Anchor Dots / Tap Junction Dot */}
      <circle
        cx={p1.x}
        cy={p1.y}
        r={isSelected ? 3.5 : 2.5}
        fill={wireColor}
        className="transition-all"
      />
      {isTapWire ? (
        <circle
          cx={p2.x}
          cy={p2.y}
          r={4.5}
          fill={wireColor}
          stroke={isDark ? "#090b10" : "#ffffff"}
          strokeWidth={1.5}
          className="transition-all"
        />
      ) : (
        <circle
          cx={p2.x}
          cy={p2.y}
          r={isSelected ? 3.5 : 2.5}
          fill={wireColor}
          className="transition-all"
        />
      )}

      {/* 7. Magnetic snap target indicator when connecting wire from component terminal */}
      {wireDraft && hoverPos && !isSimulating && (
        <g transform={`translate(${hoverPos.x}, ${hoverPos.y})`} className="pointer-events-none">
          <circle r={11} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="3 3" />
          <circle r={5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.5} />
        </g>
      )}
    </g>
  );
};
