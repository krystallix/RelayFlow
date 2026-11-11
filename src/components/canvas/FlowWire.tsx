"use client";

import React, { useState } from "react";
import { CircuitNode, CircuitWire, Point } from "@/engine/types";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import { WireNetResolver } from "@/engine/router/WireNetResolver";
import { WireLabel } from "./WireLabel";
import { SimulationEngine } from "@/engine/SimulationEngine";
import catalogData from "@/constants/components-catalog.json";
import { useCircuitStore } from "@/store/useCircuitStore";

const catalog = catalogData as Record<string, any>;

interface FlowWireProps {
  wire: CircuitWire;
  label?: string | null;
  showLabel?: boolean;
  fromNode?: CircuitNode;
  toNode?: CircuitNode;
  isSelected: boolean;
  routingMode: "orthogonal" | "bezier";
  isLOD?: boolean;
  obstacles?: Array<{ x: number; y: number; width: number; height: number }>;
  nodeMap?: Map<string | number, CircuitNode>;
  wireMap?: Map<string | number, CircuitWire>;
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onContextMenu?: (wire: CircuitWire, e: React.MouseEvent) => void;
  onWireHover?: (wire: CircuitWire, e: React.MouseEvent) => void;
  onWireLeave?: () => void;
  onStartDragSegment?: (wire: CircuitWire, orientation: "horizontal" | "vertical", defaultMid: number) => void;
  onStartDragCorner?: (
    wire: CircuitWire,
    cornerIndex: number,
    cornerPoint: Point,
    points: Point[],
    dir1: number,
    dir2: number,
    e: React.MouseEvent
  ) => void;
  onStartDragTapPoint?: (wire: CircuitWire, tapPoint: Point, e: React.MouseEvent) => void;
}

function areWirePropsEqual(prev: FlowWireProps, next: FlowWireProps): boolean {
  if (prev.wire.id !== next.wire.id) return false;
  if (prev.wire.isHot !== next.wire.isHot) return false;
  if (prev.wire.potential !== next.wire.potential) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.label !== next.label) return false;
  if (prev.showLabel !== next.showLabel) return false;
  if (prev.routingMode !== next.routingMode) return false;
  if (prev.isLOD !== next.isLOD) return false;

  // Check margins
  const pm = prev.wire.margins;
  const nm = next.wire.margins;
  if (pm?.start !== nm?.start || pm?.center !== nm?.center || pm?.end !== nm?.end) return false;

  // Check tapPoint
  if (prev.wire.tapPoint?.x !== next.wire.tapPoint?.x || prev.wire.tapPoint?.y !== next.wire.tapPoint?.y) return false;
  if (prev.wire.toWireId !== next.wire.toWireId) return false;

  // Check connected nodes
  if (prev.fromNode !== next.fromNode) {
    if (!prev.fromNode || !next.fromNode) return false;
    if (
      prev.fromNode.position.x !== next.fromNode.position.x ||
      prev.fromNode.position.y !== next.fromNode.position.y ||
      prev.fromNode.rotation !== next.fromNode.rotation
    )
      return false;
  }

  if (prev.toNode !== next.toNode) {
    if (!prev.toNode || !next.toNode) return false;
    if (
      prev.toNode.position.x !== next.toNode.position.x ||
      prev.toNode.position.y !== next.toNode.position.y ||
      prev.toNode.rotation !== next.toNode.rotation
    )
      return false;
  }

  // If this wire is tapped into another wire (toWireId), check if host wire or its endpoints moved
  if (next.wire.toWireId) {
    const hostWireId = next.wire.toWireId;
    const prevHost = prev.wireMap?.get(hostWireId);
    const nextHost = next.wireMap?.get(hostWireId);
    if (!prevHost || !nextHost) return false;
    if (prevHost.tapPoint?.x !== nextHost.tapPoint?.x || prevHost.tapPoint?.y !== nextHost.tapPoint?.y) return false;

    const prevHostFrom = prev.nodeMap?.get(prevHost.fromNodeId);
    const nextHostFrom = next.nodeMap?.get(nextHost.fromNodeId);
    if (
      prevHostFrom?.position.x !== nextHostFrom?.position.x ||
      prevHostFrom?.position.y !== nextHostFrom?.position.y ||
      prevHostFrom?.rotation !== nextHostFrom?.rotation
    )
      return false;

    const prevHostTo = prev.nodeMap?.get(prevHost.toNodeId);
    const nextHostTo = next.nodeMap?.get(nextHost.toNodeId);
    if (
      prevHostTo?.position.x !== nextHostTo?.position.x ||
      prevHostTo?.position.y !== nextHostTo?.position.y ||
      prevHostTo?.rotation !== nextHostTo?.rotation
    )
      return false;
  }

  return true;
}

export const FlowWire: React.FC<FlowWireProps> = React.memo(({
  wire,
  label,
  showLabel = true,
  fromNode,
  toNode,
  isSelected,
  routingMode,
  isLOD = false,
  obstacles = [],
  nodeMap,
  wireMap,
  screenToWorld,
  onContextMenu,
  onWireHover,
  onWireLeave,
  onStartDragSegment,
  onStartDragCorner,
  onStartDragTapPoint,
}) => {
  const selectWire = useCircuitStore((s) => s.selectWire);
  const isSimulating = useCircuitStore((s) => s.isSimulating);
  const hasWireDraft = useCircuitStore((s) => Boolean(s.wireDraft));
  const connectWireToWire = useCircuitStore((s) => s.connectWireToWire);
  const theme = useCircuitStore((s) => s.theme);
  const isDark = theme === "dark";

  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Use parent-provided memoized maps for optimal O(1) resolution without reallocating
  const effectiveNodeMap = React.useMemo(
    () => nodeMap || new Map(useCircuitStore.getState().nodes.map((n) => [n.id, n])),
    [nodeMap]
  );
  const effectiveWireMap = React.useMemo(
    () => wireMap || new Map(useCircuitStore.getState().wires.map((w) => [w.id, w])),
    [wireMap]
  );

  const endpoints = ManhattanRouter.resolveWireEndpoints(wire, effectiveNodeMap, effectiveWireMap);
  if (!endpoints) return null;

  const { p1, dir1, p2, dir2, isTapWire } = endpoints;

  const effectiveMargins = isTapWire ? { ...wire.margins, end: -30 } : wire.margins;

  const ignoreObstacleIds = React.useMemo(
    () => (wire.toWireId ? [wire.fromNodeId] : [wire.fromNodeId, wire.toNodeId]),
    [wire.fromNodeId, wire.toNodeId, wire.toWireId]
  );

  const routed =
    routingMode === "bezier"
      ? ManhattanRouter.routeBezier(p1, dir1, p2, dir2)
      : ManhattanRouter.routeOrthogonal(
          p1,
          dir1,
          p2,
          dir2,
          effectiveMargins,
          obstacles,
          ignoreObstacleIds
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

  // Wire number label placement (Dual Ferrule on long wire, Single Midpoint on short wire)
  const effectiveLabel = label || wire.label;
  const labelPlacements =
    routingMode === "orthogonal"
      ? WireNetResolver.getOptimalLabelPositions(routed.points)
      : Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) >= 80
      ? [
          { x: p1.x + (p2.x - p1.x) * 0.2, y: p1.y + (p2.y - p1.y) * 0.2, orientation: "horizontal" as const },
          { x: p1.x + (p2.x - p1.x) * 0.8, y: p1.y + (p2.y - p1.y) * 0.8, orientation: "horizontal" as const },
        ]
      : [
          {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
            orientation: "horizontal" as const,
          },
        ];

  const handleMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const { point, dist } = ManhattanRouter.getNearestPointOnSegments(world, routed.points);
    if (dist < 30) {
      setHoverPos(point);
    } else {
      setHoverPos(null);
    }
  };

  const handleWireMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently drafting a wire from a component terminal, clicking anywhere on the wire attaches to it!
    const currentWireDraft = useCircuitStore.getState().wireDraft;
    if (currentWireDraft) {
      e.preventDefault();
      const world = screenToWorld(e.clientX, e.clientY);
      const { point } = ManhattanRouter.getNearestPointOnSegments(world, routed.points);
      connectWireToWire(wire.id, point);
      return;
    }

    // Normal click: strictly focus / select the wire
    selectWire(wire.id, e.shiftKey);
  };

  const handleWireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (useCircuitStore.getState().wireDraft) return;
    selectWire(wire.id, e.shiftKey);
  };

  const handleStartDragSegment = (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentWireDraft = useCircuitStore.getState().wireDraft;
    if (currentWireDraft) {
      e.preventDefault();
      const world = screenToWorld(e.clientX, e.clientY);
      const { point } = ManhattanRouter.getNearestPointOnSegments(world, routed.points);
      connectWireToWire(wire.id, point);
      return;
    }

    if (isSimulating || !midHandle) return;
    e.preventDefault();
    onStartDragSegment?.(wire, segmentOrientation, defaultMid);
  };

  // Extract all corners (sudut garis)
  const cornerPoints: Array<{ index: number; point: Point }> = [];
  if (routingMode === "orthogonal" && routed.points && routed.points.length >= 3) {
    for (let i = 1; i < routed.points.length - 1; i++) {
      cornerPoints.push({ index: i, point: routed.points[i] });
    }
  } else if (routingMode === "orthogonal" && routed.points && routed.points.length === 2) {
    // For a straight line, offer a midpoint handle so the user can easily pull out a corner
    const midX = (routed.points[0].x + routed.points[1].x) / 2;
    const midY = (routed.points[0].y + routed.points[1].y) / 2;
    cornerPoints.push({ index: 1, point: { x: midX, y: midY } });
  }

  const handleStartDragCorner = (
    cornerIndex: number,
    cornerPoint: Point,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const currentWireDraft = useCircuitStore.getState().wireDraft;
    if (currentWireDraft) {
      connectWireToWire(wire.id, cornerPoint);
      return;
    }
    if (isSimulating) return;
    onStartDragCorner?.(
      wire,
      cornerIndex,
      cornerPoint,
      routed.points,
      dir1,
      dir2,
      e
    );
  };

  // Uniform Wire color (clean CAD standard, amber highlight for selection)
  const getWireColor = () => {
    if (isSelected) return "#f59e0b"; // Highlight selection in clear visible amber
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
        strokeWidth={28}
        className="pointer-events-auto"
        onMouseDown={handleWireMouseDown}
        onTouchStart={(e) => {
          e.stopPropagation();
          const currentWireDraft = useCircuitStore.getState().wireDraft;
          if (currentWireDraft) {
            const touch = e.touches[0];
            if (touch) {
              const world = screenToWorld(touch.clientX, touch.clientY);
              const { point } = ManhattanRouter.getNearestPointOnSegments(world, routed.points);
              connectWireToWire(wire.id, point);
            }
            return;
          }
          selectWire(wire.id, false);
        }}
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
            hasWireDraft
              ? "cursor-crosshair"
              : segmentOrientation === "horizontal"
              ? "cursor-ns-resize"
              : "cursor-ew-resize"
          }`}
          onMouseDown={handleStartDragSegment}
        />
      )}

      {/* 3. Glow Layer (when Hot, Selected, or Hovered) */}
      {(isSelected || (!isLOD && (isHot || isHovered))) && (
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
        className="transition-colors"
      />
      {isTapWire ? (
        <g
          className="cursor-move pointer-events-auto group/tap-handle"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isSimulating || hasWireDraft) return;
            onStartDragTapPoint?.(wire, p2, e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            selectWire(wire.id, e.shiftKey);
          }}
        >
          {/* Generous 30px invisible hit target for easy click & drag */}
          <circle cx={p2.x} cy={p2.y} r={15} fill="transparent" />

          {/* Interactive guide ring on hover or selection */}
          {(isHovered || isSelected) && !isSimulating && (
            <circle
              cx={p2.x}
              cy={p2.y}
              r={7.5}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              className="pointer-events-none transition-colors"
            />
          )}

          {/* Solid junction dot */}
          <circle
            cx={p2.x}
            cy={p2.y}
            r={isHovered || isSelected ? 5 : 4}
            fill={isHovered ? "#f59e0b" : wireColor}
            stroke={isDark ? "#090b10" : "#ffffff"}
            strokeWidth={1.5}
            className="transition-colors drop-shadow-sm"
          />
        </g>
      ) : (
        <circle
          cx={p2.x}
          cy={p2.y}
          r={isSelected ? 3.5 : 2.5}
          fill={wireColor}
          className="transition-colors"
        />
      )}

      {/* 7. Interactive Corner Handles (Sudut Garis) - appear immediately on hover or selection */}
      {(isHovered || isSelected) && !isSimulating && !hasWireDraft && !isLOD && (
        <g className="corner-handles">
          {cornerPoints.map((corner, idx) => (
            <g
              key={`${wire.id}-corner-${corner.index}-${idx}`}
              transform={`translate(${corner.point.x}, ${corner.point.y})`}
              className="cursor-move pointer-events-auto group/handle"
              onMouseDown={(e) => handleStartDragCorner(corner.index, corner.point, e)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Invisible touch/mouse hit area (generous 30px target) */}
              <circle r={15} fill="transparent" />

              {/* Outer ring */}
              <circle
                r={6}
                fill={isDark ? "#111827" : "#ffffff"}
                stroke="#f59e0b"
                strokeWidth={2}
                className="drop-shadow-sm transition-colors group-hover/handle:stroke-amber-300"
              />

              {/* Solid inner accent dot */}
              <circle
                r={2.5}
                fill="#f59e0b"
                className="transition-colors group-hover/handle:fill-amber-300"
              />
            </g>
          ))}
        </g>
      )}

      {/* 8. Magnetic snap target indicator when connecting wire from component terminal */}
      {hasWireDraft && hoverPos && !isSimulating && (
        <g transform={`translate(${hoverPos.x}, ${hoverPos.y})`} className="pointer-events-none">
          <circle r={11} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="3 3" />
          <circle r={5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.5} />
        </g>
      )}

      {/* 8. Wire Number Label (CAD Equipotential Net Badge) */}
      {showLabel && effectiveLabel && labelPlacements.length > 0 && (
        <>
          {labelPlacements.map((pos, idx) => (
            <WireLabel
              key={`${wire.id}-label-${idx}`}
              wireId={wire.id}
              label={effectiveLabel}
              x={pos.x}
              y={pos.y}
              orientation={pos.orientation}
              isHot={isHot}
              isSelected={isSelected}
            />
          ))}
        </>
      )}
    </g>
  );
}, areWirePropsEqual);
FlowWire.displayName = "FlowWire";
