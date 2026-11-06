"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { CircuitNode, CircuitWire } from "@/engine/types";
import { MapPin, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";

interface MiniMapProps {
  nodes: CircuitNode[];
  wires: CircuitWire[];
  panOffset: { x: number; y: number };
  zoomScale: number;
  onPanChange: (newPan: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  wires,
  panOffset,
  zoomScale,
  onPanChange,
  containerRef,
  isDark,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<SVGSVGElement | null>(null);

  // Mini-map dimensions
  const MAP_WIDTH = 180;
  const MAP_HEIGHT = 120;
  const PADDING = 200;

  // Calculate circuit bounding box in world coordinates
  const bounds = React.useMemo(() => {
    if (nodes.length === 0) {
      return { minX: -200, minY: -200, maxX: 1200, maxY: 800, width: 1400, height: 1000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
      if (node.position.x + 120 > maxX) maxX = node.position.x + 120;
      if (node.position.y + 120 > maxY) maxY = node.position.y + 120;
    }

    // Include current visible viewport in bounds so viewfinder doesn't clip
    if (containerRef.current) {
      const vLeft = -panOffset.x / zoomScale;
      const vTop = -panOffset.y / zoomScale;
      const vRight = vLeft + containerRef.current.clientWidth / zoomScale;
      const vBottom = vTop + containerRef.current.clientHeight / zoomScale;

      if (vLeft < minX) minX = vLeft;
      if (vTop < minY) minY = vTop;
      if (vRight > maxX) maxX = vRight;
      if (vBottom > maxY) maxY = vBottom;
    }

    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = Math.max(800, maxX - minX);
    const height = Math.max(600, maxY - minY);

    return { minX, minY, maxX, maxY, width, height };
  }, [nodes, panOffset, zoomScale, containerRef]);

  // World coordinates to mini-map coordinates
  const worldToMap = useCallback(
    (wx: number, wy: number) => {
      const scaleX = MAP_WIDTH / bounds.width;
      const scaleY = MAP_HEIGHT / bounds.height;
      const scale = Math.min(scaleX, scaleY);

      const mx = (wx - bounds.minX) * scale + (MAP_WIDTH - bounds.width * scale) / 2;
      const my = (wy - bounds.minY) * scale + (MAP_HEIGHT - bounds.height * scale) / 2;
      return { x: mx, y: my, scale };
    },
    [bounds]
  );

  // Mini-map coordinates to world coordinates
  const mapToWorld = useCallback(
    (mx: number, my: number) => {
      const scaleX = MAP_WIDTH / bounds.width;
      const scaleY = MAP_HEIGHT / bounds.height;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (MAP_WIDTH - bounds.width * scale) / 2;
      const offsetY = (MAP_HEIGHT - bounds.height * scale) / 2;

      const wx = (mx - offsetX) / scale + bounds.minX;
      const wy = (my - offsetY) / scale + bounds.minY;
      return { x: wx, y: wy };
    },
    [bounds]
  );

  // Viewport rectangle in world coordinates
  const viewportWorld = React.useMemo(() => {
    const cWidth = containerRef.current?.clientWidth || 1000;
    const cHeight = containerRef.current?.clientHeight || 800;

    const left = -panOffset.x / zoomScale;
    const top = -panOffset.y / zoomScale;
    const width = cWidth / zoomScale;
    const height = cHeight / zoomScale;

    return { left, top, width, height };
  }, [panOffset, zoomScale, containerRef]);

  // Convert viewport world rect to map rect
  const vTopLeft = worldToMap(viewportWorld.left, viewportWorld.top);
  const vBottomRight = worldToMap(
    viewportWorld.left + viewportWorld.width,
    viewportWorld.top + viewportWorld.height
  );
  const vWidth = Math.max(12, vBottomRight.x - vTopLeft.x);
  const vHeight = Math.max(8, vBottomRight.y - vTopLeft.y);

  // Pan canvas to clicked point on minimap
  const handleMapInteract = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mapRef.current || !containerRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const targetWorld = mapToWorld(mx, my);
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;

    // Center viewport at this target world coordinate
    const newPanX = cWidth / 2 - targetWorld.x * zoomScale;
    const newPanY = cHeight / 2 - targetWorld.y * zoomScale;

    onPanChange({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    handleMapInteract(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !mapRef.current || !containerRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const mx = Math.max(0, Math.min(MAP_WIDTH, e.clientX - rect.left));
      const my = Math.max(0, Math.min(MAP_HEIGHT, e.clientY - rect.top));

      const targetWorld = mapToWorld(mx, my);
      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;

      const newPanX = cWidth / 2 - targetWorld.x * zoomScale;
      const newPanY = cHeight / 2 - targetWorld.y * zoomScale;

      onPanChange({ x: newPanX, y: newPanY });
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
  }, [isDragging, mapToWorld, zoomScale, onPanChange, containerRef]);

  // Build node center positions lookup for wire rendering
  const nodeCenters = React.useMemo(() => {
    const map = new Map<string | number, { x: number; y: number }>();
    for (const node of nodes) {
      const m = worldToMap(node.position.x + 40, node.position.y + 40);
      map.set(node.id, { x: m.x, y: m.y });
    }
    return map;
  }, [nodes, worldToMap]);

  return (
    <div
      className={`fixed bottom-16 right-3 md:bottom-14 md:right-4 z-30 flex flex-col rounded-xl border shadow-xl backdrop-blur-md transition-all overflow-hidden ${
        isDark
          ? "bg-[#10141e]/90 border-white/10 text-zinc-300"
          : "bg-white/95 border-slate-200 text-slate-700 shadow-slate-300/50"
      }`}
    >
      {/* Header bar with toggle */}
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
        <div className="flex items-center gap-1">
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
            className={`rounded-lg cursor-crosshair ${
              isDark ? "bg-[#080a0f]" : "bg-slate-100"
            }`}
          >
            {/* Wires */}
            {wires.map((wire) => {
              const p1 = nodeCenters.get(wire.fromNodeId);
              const p2 = nodeCenters.get(wire.toNodeId);
              if (!p1 || !p2) return null;
              return (
                <line
                  key={`mw-${wire.id}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={
                    wire.isHot
                      ? "#ef4444"
                      : isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.25)"
                  }
                  strokeWidth={1}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const m = worldToMap(node.position.x, node.position.y);
              const fillColor = node.isEnergized ? "#ef4444" : isDark ? "#64748b" : "#94a3b8";

              return (
                <rect
                  key={`mn-${node.id}`}
                  x={m.x}
                  y={m.y}
                  width={Math.max(4, 10 * (m.scale || 0.1))}
                  height={Math.max(4, 10 * (m.scale || 0.1))}
                  rx={1}
                  fill={fillColor}
                  className="transition-colors"
                />
              );
            })}

            {/* Viewfinder Camera Rectangle */}
            <rect
              x={vTopLeft.x}
              y={vTopLeft.y}
              width={vWidth}
              height={vHeight}
              fill={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
              stroke={isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)"}
              strokeWidth={1.5}
              strokeDasharray="2 2"
              rx={2}
              className="pointer-events-none"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
