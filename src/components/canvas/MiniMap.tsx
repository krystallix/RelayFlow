"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { CircuitNode, CircuitWire, Point } from "@/engine/types";
import { SimulationEngine } from "@/engine/SimulationEngine";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import { useCircuitStore } from "@/store/useCircuitStore";
import catalogData from "@/constants/components-catalog.json";
import { MapPin, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";

const catalog = catalogData as Record<string, any>;

interface MiniMapProps {
  nodes: CircuitNode[];
  wires: CircuitWire[];
  panOffset: { x: number; y: number };
  zoomScale: number;
  onPanChange: (newPan: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
  wireRoutesMap?: Map<string | number, { points: Point[]; svgPath: string }>;
}

export const MiniMap: React.FC<MiniMapProps> = React.memo(({
  nodes,
  wires,
  panOffset,
  zoomScale,
  onPanChange,
  containerRef,
  isDark,
  wireRoutesMap,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<SVGSVGElement | null>(null);

  const wireRoutingMode = useCircuitStore((state) => state.wireRoutingMode);

  // Mini-map dimensions
  const MAP_WIDTH = 200;
  const MAP_HEIGHT = 135;
  const PADDING = 100;

  // Node fast-lookup map
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Node obstacle boxes for orthogonal clearance
  const obstacles = useMemo(() => {
    return nodes.map((n) => {
      const c = catalog[n.componentId];
      const w = c?.width || 120;
      const h = c?.height || 120;
      return {
        id: n.id,
        x: n.position.x - w / 2,
        y: n.position.y - h / 2,
        width: w,
        height: h,
      };
    });
  }, [nodes]);

  // Compute 1:1 true CAD routed wire paths matching the canvas exactly (using precomputed routes if available)
  const routedWires = useMemo(() => {
    const list: Array<{
      id: string | number;
      path: string;
      isHot?: boolean;
      tapPoint?: Point;
    }> = [];

    const wireMap = new Map(wires.map((w) => [w.id, w]));

    for (const wire of wires) {
      // Fast path: reuse precomputed route from Canvas
      const precomputed = wireRoutesMap?.get(wire.id);
      if (precomputed?.svgPath) {
        list.push({
          id: wire.id,
          path: precomputed.svgPath,
          isHot: wire.isHot,
          tapPoint: wire.tapPoint,
        });
        continue;
      }

      const endpoints = ManhattanRouter.resolveWireEndpoints(wire, nodeMap, wireMap);
      if (!endpoints) continue;

      const { p1, dir1, p2, dir2, isTapWire } = endpoints;

      const effectiveMargins = isTapWire ? { ...wire.margins, end: -30 } : wire.margins;
      const wireObstacles = obstacles.filter(
        (b) => b.id !== wire.fromNodeId && b.id !== wire.toNodeId
      );

      const routed =
        wireRoutingMode === "bezier"
          ? ManhattanRouter.routeBezier(p1, dir1, p2, dir2)
          : ManhattanRouter.routeOrthogonal(
              p1,
              dir1,
              p2,
              dir2,
              effectiveMargins,
              wireObstacles
            );

      list.push({
        id: wire.id,
        path: routed.svgPath,
        isHot: wire.isHot,
        tapPoint: isTapWire ? p2 : undefined,
      });
    }

    return list;
  }, [wires, nodeMap, obstacles, wireRoutingMode, wireRoutesMap]);

  // Calculate circuit bounding box in world coordinates
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: -200, minY: -200, maxX: 1200, maxY: 800, width: 1400, height: 1000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const comp = catalog[node.componentId];
      const w = comp?.width || 120;
      const h = comp?.height || 120;
      const maxDim = Math.max(w, h);
      const half = maxDim / 2;

      if (node.position.x - half < minX) minX = node.position.x - half;
      if (node.position.y - half < minY) minY = node.position.y - half;
      if (node.position.x + half > maxX) maxX = node.position.x + half;
      if (node.position.y + half > maxY) maxY = node.position.y + half;
    }

    for (const wire of wires) {
      if (wire.tapPoint) {
        if (wire.tapPoint.x < minX) minX = wire.tapPoint.x;
        if (wire.tapPoint.y < minY) minY = wire.tapPoint.y;
        if (wire.tapPoint.x > maxX) maxX = wire.tapPoint.x;
        if (wire.tapPoint.y > maxY) maxY = wire.tapPoint.y;
      }
    }

    // Include current visible viewport in bounds with soft limits
    if (containerRef.current) {
      const vLeft = -panOffset.x / zoomScale;
      const vTop = -panOffset.y / zoomScale;
      const vRight = vLeft + containerRef.current.clientWidth / zoomScale;
      const vBottom = vTop + containerRef.current.clientHeight / zoomScale;

      const cCenterX = (minX + maxX) / 2;
      const cCenterY = (minY + maxY) / 2;
      const maxExtent = 1200;

      const clampedVLeft = Math.max(cCenterX - maxExtent, vLeft);
      const clampedVTop = Math.max(cCenterY - maxExtent, vTop);
      const clampedVRight = Math.min(cCenterX + maxExtent, vRight);
      const clampedVBottom = Math.min(cCenterY + maxExtent, vBottom);

      if (clampedVLeft < minX) minX = clampedVLeft;
      if (clampedVTop < minY) minY = clampedVTop;
      if (clampedVRight > maxX) maxX = clampedVRight;
      if (clampedVBottom > maxY) maxY = clampedVBottom;
    }

    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = Math.max(800, maxX - minX);
    const height = Math.max(550, maxY - minY);

    return { minX, minY, maxX, maxY, width, height };
  }, [nodes, wires, panOffset, zoomScale, containerRef]);

  // World coordinates scale and translation
  const scaleX = MAP_WIDTH / bounds.width;
  const scaleY = MAP_HEIGHT / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (MAP_WIDTH - bounds.width * scale) / 2;
  const offsetY = (MAP_HEIGHT - bounds.height * scale) / 2;

  // Viewport camera rectangle in world coordinates
  const viewportWorld = useMemo(() => {
    const cWidth = containerRef.current?.clientWidth || 1000;
    const cHeight = containerRef.current?.clientHeight || 800;

    const left = -panOffset.x / zoomScale;
    const top = -panOffset.y / zoomScale;
    const width = cWidth / zoomScale;
    const height = cHeight / zoomScale;

    return { left, top, width, height };
  }, [panOffset, zoomScale, containerRef]);

  // Pan canvas to clicked point on minimap
  const handleMapInteract = useCallback(
    (clientX: number, clientY: number) => {
      if (!mapRef.current || !containerRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const mx = Math.max(0, Math.min(MAP_WIDTH, clientX - rect.left));
      const my = Math.max(0, Math.min(MAP_HEIGHT, clientY - rect.top));

      const targetWorldX = (mx - offsetX) / scale + bounds.minX;
      const targetWorldY = (my - offsetY) / scale + bounds.minY;

      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;

      const newPanX = cWidth / 2 - targetWorldX * zoomScale;
      const newPanY = cHeight / 2 - targetWorldY * zoomScale;

      onPanChange({ x: newPanX, y: newPanY });
    },
    [offsetX, offsetY, scale, bounds, zoomScale, onPanChange, containerRef]
  );

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    handleMapInteract(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMapInteract(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMapInteract]);

  const handleFitView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current || nodes.length === 0) return;
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    onPanChange({
      x: cWidth / 2 - centerX * zoomScale,
      y: cHeight / 2 - centerY * zoomScale,
    });
  };

  return (
    <div
      className={`fixed bottom-16 right-3 md:bottom-14 md:right-4 z-30 flex flex-col rounded-xl border shadow-xl backdrop-blur-md transition-all overflow-hidden ${
        isDark
          ? "bg-[#10141e]/90 border-white/10 text-zinc-300 shadow-black/40"
          : "bg-white/95 border-slate-200 text-slate-700 shadow-slate-300/50"
      }`}
    >
      {/* Header bar with toggle and Fit-to-Center */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`px-2.5 py-1.5 flex items-center justify-between gap-3 cursor-pointer text-[11px] font-semibold tracking-wider uppercase select-none border-b transition-colors ${
          isDark
            ? "border-white/5 hover:bg-white/5 text-zinc-400"
            : "border-slate-100 hover:bg-slate-50 text-slate-600"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <span>Navigator</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFitView}
            title="Center View on Circuit"
            className={`p-0.5 rounded transition-colors ${
              isDark ? "hover:bg-white/10 text-zinc-400 hover:text-zinc-200" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
            }`}
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </div>
      </div>

      {/* Mini-map view */}
      {isExpanded && (
        <div className="p-1 relative">
          <svg
            ref={mapRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            onMouseDown={handleMouseDown}
            className={`rounded-lg cursor-crosshair select-none ${
              isDark ? "bg-[#080a0f]" : "bg-slate-100/80"
            }`}
          >
            {/* World-to-Minimap Scaled Container */}
            <g
              transform={`translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-bounds.minX}, ${-bounds.minY})`}
            >
              {/* True Orthogonal / Bezier Wires */}
              {routedWires.map((rw) => (
                <g key={`wire-${rw.id}`}>
                  <path
                    d={rw.path}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    stroke={
                      rw.isHot
                        ? "#ef4444"
                        : isDark
                        ? "#64748b"
                        : "#475569"
                    }
                    strokeWidth={rw.isHot ? 2 : 1.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Tap junction dot on wire */}
                  {rw.tapPoint && (
                    <circle
                      cx={rw.tapPoint.x}
                      cy={rw.tapPoint.y}
                      r={Math.max(4, 2.5 / scale)}
                      fill={rw.isHot ? "#ef4444" : isDark ? "#cbd5e1" : "#1e293b"}
                    />
                  )}
                </g>
              ))}

              {/* Component Symbols (Scaled with Real Geometry & Rotation) */}
              {nodes.map((node) => {
                const comp = catalog[node.componentId];
                const width = comp?.width || 120;
                const height = comp?.height || 120;
                const isJunctionDot = node.componentId === "junctionDot";
                const isMotor = node.componentId.toLowerCase().startsWith("motor");
                const isSource = node.componentId.toLowerCase().startsWith("source");
                const isEnergized = Boolean(node.isEnergized);

                if (isJunctionDot) {
                  return (
                    <circle
                      key={`mn-${node.id}`}
                      cx={node.position.x}
                      cy={node.position.y}
                      r={Math.max(4, 2.5 / scale)}
                      fill={isEnergized ? "#ef4444" : isDark ? "#cbd5e1" : "#1e293b"}
                    />
                  );
                }

                const strokeColor = isEnergized
                  ? "#ef4444"
                  : isDark
                  ? "#475569"
                  : "#94a3b8";

                const fillColor = isEnergized
                  ? isDark
                    ? "rgba(239, 68, 68, 0.35)"
                    : "rgba(239, 68, 68, 0.25)"
                  : isDark
                  ? "#1e293b"
                  : "#e2e8f0";

                return (
                  <g
                    key={`mn-${node.id}`}
                    transform={`rotate(${node.rotation * 90}, ${node.position.x}, ${node.position.y})`}
                  >
                    {isMotor || isSource ? (
                      <circle
                        cx={node.position.x}
                        cy={node.position.y}
                        r={Math.min(width, height) / 2 - 2}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isEnergized ? 2 : 1.2}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : (
                      <rect
                        x={node.position.x - width / 2}
                        y={node.position.y - height / 2}
                        width={width}
                        height={height}
                        rx={4}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isEnergized ? 2 : 1.2}
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                );
              })}

              {/* Viewfinder Camera Rectangle */}
              <rect
                x={viewportWorld.left}
                y={viewportWorld.top}
                width={viewportWorld.width}
                height={viewportWorld.height}
                vectorEffect="non-scaling-stroke"
                fill={isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(37, 99, 235, 0.08)"}
                stroke={isDark ? "rgba(56, 189, 248, 0.85)" : "rgba(37, 99, 235, 0.8)"}
                strokeWidth={1.5}
                rx={2 / scale}
                className="pointer-events-none"
              />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
});
