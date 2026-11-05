"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { FlowNode } from "./FlowNode";
import { FlowWire } from "./FlowWire";
import { NodePopover } from "./NodePopover";
import { MiniMap } from "./MiniMap";
import { ContextMenu, ContextMenuTarget } from "./ContextMenu";
import { VirtualProbeHUD, ProbeReading } from "./VirtualProbeHUD";
import {
  AlertTriangle,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Gauge,
  Map as MapIcon,
  Crosshair,
  Play,
  Square,
} from "lucide-react";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import catalogData from "@/constants/components-catalog.json";
import { CircuitNode, CircuitWire } from "@/engine/types";

const catalog = catalogData as Record<string, any>;

interface FlowCanvasProps {
  zoomScale: number;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
}

interface DraggingNodeState {
  nodeId: string | number;
  startWorldPos: { x: number; y: number };
  initialPositions: Map<string | number, { x: number; y: number }>;
  hasMoved: boolean;
  shiftKey: boolean;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  zoomScale,
  panOffset,
  setPanOffset,
  setZoomScale,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Direct Node Dragging state
  const [draggingNodeState, setDraggingNodeState] = useState<DraggingNodeState | null>(null);

  // Marquee selection
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Quick Spotlight Symbol Search (Tab / Space on Canvas)
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [quickSearchPos, setQuickSearchPos] = useState({ x: 300, y: 300 });
  const mouseWorldPosRef = useRef({ x: 300, y: 300 });

  // Smart Alignment Guidelines
  interface SmartGuideline {
    type: "horizontal" | "vertical";
    coord: number;
    start: number;
    end: number;
  }
  const [smartGuidelines, setSmartGuidelines] = useState<SmartGuideline[]>([]);

  // Right-Click Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: ContextMenuTarget;
  } | null>(null);

  // Virtual Multimeter / Voltage Probe Tool
  const [probeActive, setProbeActive] = useState(false);
  const [probeReading, setProbeReading] = useState<ProbeReading | null>(null);

  // Mini-Map visibility
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Real-time Cursor Coordinates
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });

  const {
    nodes,
    wires,
    selectedNodeIds,
    selectedWireIds,
    wireRoutingMode,
    wireDraft,
    theme,
    showGrid,
    isSimulating,
    shortCircuit,
    shortCircuitMessage,
    clipboard,
    addNode,
    rotateSelectedNodes,
    rotateNode,
    deleteSelection,
    deleteNode,
    deleteWire,
    duplicateSelection,
    copySelection,
    pasteSelection,
    clearSelection,
    selectAll,
    selectNode,
    toggleComponentState,
    setComponentPressed,
    updateNodesPositions,
    startSimulation,
    stopSimulation,
    tickTimerSimulation,
    splitWireAtJunction,
    undo,
    redo,
    recentComponentIds,
    startWireDraft,
    updateWireDraft,
    completeWireDraft,
    cancelWireDraft,
  } = useCircuitStore();

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoomScale;
    const y = (clientY - rect.top - panOffset.y) / zoomScale;
    return { x, y };
  };

  // Zoom to Fit (Fits all circuit nodes neatly inside viewport)
  const handleZoomToFit = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) {
      setZoomScale(1);
      setPanOffset({ x: 100, y: 50 });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.x + 120 > maxX) maxX = n.position.x + 120;
      if (n.position.y + 120 > maxY) maxY = n.position.y + 120;
    }

    const padding = 120;
    const circuitW = maxX - minX + padding * 2;
    const circuitH = maxY - minY + padding * 2;

    const cW = containerRef.current.clientWidth;
    const cH = containerRef.current.clientHeight;

    const fitScale = Math.min(Math.max(0.3, Math.min(cW / circuitW, cH / circuitH)), 1.8);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoomScale(fitScale);
    setPanOffset({
      x: cW / 2 - centerX * fitScale,
      y: cH / 2 - centerY * fitScale,
    });
  }, [nodes, containerRef, setZoomScale, setPanOffset]);

  const handleZoomIn = () => setZoomScale((prev) => Math.min(3, prev * 1.15));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.2, prev * 0.85));
  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 100, y: 50 });
  };

  // Virtual Multimeter Probe Handlers
  const handleWireHover = (wire: CircuitWire, e: React.MouseEvent) => {
    if (!probeActive) return;
    setProbeReading({
      potential: wire.potential || null,
      isEnergized: Boolean(wire.isHot),
      name: "Wire Conductor",
      screenPos: { x: e.clientX, y: e.clientY },
    });
  };

  const handleWireLeave = () => {
    if (probeActive) setProbeReading(null);
  };

  const handlePortHover = (node: CircuitNode, portId: number, e: React.MouseEvent) => {
    if (!probeActive) return;
    const comp = catalog[node.componentId];
    const port = comp?.nodes?.find((n: any) => n.id === portId);

    let potential: string | null = null;
    const connectedWire = wires.find(
      (w) =>
        (w.fromNodeId === node.id && w.fromPortId === portId) ||
        (w.toNodeId === node.id && w.toPortId === portId)
    );

    if (connectedWire?.potential) {
      potential = connectedWire.potential;
    } else if (node.componentId === "sourceL1") potential = "L1";
    else if (node.componentId === "sourceL2") potential = "L2";
    else if (node.componentId === "sourceL3") potential = "L3";
    else if (node.componentId === "sourceN") potential = "N";
    else if (node.componentId === "sourcePlus") potential = "+24V";
    else if (node.componentId === "sourceNegative") potential = "-24V";
    else if (node.componentId === "sourceL1L2L3" || node.componentId === "sourceL1L2L3N") {
      if (portId === 0) potential = "L1";
      else if (portId === 1) potential = "L2";
      else if (portId === 2) potential = "L3";
      else if (portId === 3) potential = "N";
    }

    setProbeReading({
      potential,
      isEnergized: Boolean(node.isEnergized || connectedWire?.isHot),
      name: node.name,
      terminalTag: port?.tag || String(portId),
      screenPos: { x: e.clientX, y: e.clientY },
    });
  };

  const handlePortLeave = () => {
    if (probeActive) setProbeReading(null);
  };

  // Context Menu Handlers
  const handleNodeContextMenu = (node: CircuitNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: { type: "node", node, worldPos },
    });
  };

  const handleWireContextMenu = (wire: CircuitWire, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: { type: "wire", wire, worldPos },
    });
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (contextMenu) setContextMenu(null);

    // If drawing a wire and clicking empty area, cancel draft
    if (wireDraft) {
      cancelWireDraft();
      return;
    }

    // Middle click or Space+Click initiates Pan
    if (e.button === 1 || isSpacePressed || (e.button === 0 && e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      if (!e.shiftKey) clearSelection();
      return;
    }

    if (e.button === 0) {
      // Start marquee selection on empty area
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setMarquee({ startX: worldPos.x, startY: worldPos.y, currentX: worldPos.x, currentY: worldPos.y });
      if (!e.shiftKey) clearSelection();
    }
  };

  // Node Mouse Down (initiates drag or click)
  const handleNodeMouseDown = (nodeId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    if (isSimulating) {
      toggleComponentState(nodeId);
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);

    // Determine nodes to drag together
    let targetIds: (string | number)[] = [nodeId];
    if (selectedNodeIds.has(nodeId)) {
      targetIds = Array.from(selectedNodeIds);
    } else if (!e.shiftKey) {
      selectNode(nodeId, false);
      targetIds = [nodeId];
    }

    const initialPositions = new Map<string | number, { x: number; y: number }>();
    for (const id of targetIds) {
      const n = nodes.find((node) => node.id === id);
      if (n) {
        initialPositions.set(id, { ...n.position });
      }
    }

    setDraggingNodeState({
      nodeId,
      startWorldPos: worldPos,
      initialPositions,
      hasMoved: false,
      shiftKey: e.shiftKey,
    });
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    mouseWorldPosRef.current = worldPos;
    setCursorCoords({
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
    });

    // 1. Handle active node dragging (120 FPS live update) with Magnetic Alignment Smart Guides
    if (draggingNodeState) {
      let dx = worldPos.x - draggingNodeState.startWorldPos.x;
      let dy = worldPos.y - draggingNodeState.startWorldPos.y;

      if (Math.hypot(dx, dy) > 3) {
        draggingNodeState.hasMoved = true;
      }

      if (draggingNodeState.hasMoved) {
        // Smart magnetic alignment snapping & guidelines
        const newGuidelines: SmartGuideline[] = [];
        const SNAP_THRESHOLD = 8;
        const primaryNode = nodes.find((n) => n.id === draggingNodeState.nodeId);

        if (primaryNode) {
          const initPos = draggingNodeState.initialPositions.get(primaryNode.id) || primaryNode.position;
          let candidateX = initPos.x + dx;
          let candidateY = initPos.y + dy;

          // Check vertical alignment (same X)
          for (const other of nodes) {
            if (draggingNodeState.initialPositions.has(other.id)) continue;
            if (Math.abs(candidateX - other.position.x) <= SNAP_THRESHOLD) {
              dx = other.position.x - initPos.x;
              candidateX = other.position.x;
              newGuidelines.push({
                type: "vertical",
                coord: other.position.x,
                start: Math.min(candidateY, other.position.y) - 60,
                end: Math.max(candidateY, other.position.y) + 60,
              });
              break;
            }
          }

          // Check horizontal alignment (same Y)
          for (const other of nodes) {
            if (draggingNodeState.initialPositions.has(other.id)) continue;
            if (Math.abs(candidateY - other.position.y) <= SNAP_THRESHOLD) {
              dy = other.position.y - initPos.y;
              candidateY = other.position.y;
              newGuidelines.push({
                type: "horizontal",
                coord: other.position.y,
                start: Math.min(candidateX, other.position.x) - 60,
                end: Math.max(candidateX, other.position.x) + 60,
              });
              break;
            }
          }
        }

        setSmartGuidelines(newGuidelines);

        const updates = Array.from(draggingNodeState.initialPositions.entries()).map(([id, pos]) => ({
          id,
          position: {
            x: pos.x + dx,
            y: pos.y + dy,
          },
        }));
        updateNodesPositions(updates, false); // live drag
      }
      return;
    }

    // 2. Update active wire draft line
    if (wireDraft) {
      updateWireDraft(worldPos);
    }

    // 3. Pan canvas
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // 4. Marquee selection
    if (marquee) {
      setMarquee((prev) => (prev ? { ...prev, currentX: worldPos.x, currentY: worldPos.y } : null));
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    setSmartGuidelines([]);

    if (draggingNodeState) {
      if (draggingNodeState.hasMoved) {
        // Commit final snapped positions with undo history
        const finalUpdates = Array.from(draggingNodeState.initialPositions.entries()).map(([id]) => {
          const n = nodes.find((node) => node.id === id);
          return {
            id,
            position: n?.position || { x: 0, y: 0 },
          };
        });
        updateNodesPositions(finalUpdates, true);
      } else {
        // Simple Click without movement
        if (isSimulating) {
          toggleComponentState(draggingNodeState.nodeId);
        } else {
          selectNode(draggingNodeState.nodeId, draggingNodeState.shiftKey);
        }
      }
      setDraggingNodeState(null);
    }

    // Process Marquee Selection
    if (marquee) {
      const minX = Math.min(marquee.startX, marquee.currentX);
      const maxX = Math.max(marquee.startX, marquee.currentX);
      const minY = Math.min(marquee.startY, marquee.currentY);
      const maxY = Math.max(marquee.startY, marquee.currentY);

      if (maxX - minX > 5 || maxY - minY > 5) {
        const newlySelected = new Set(e.shiftKey ? selectedNodeIds : []);
        for (const node of nodes) {
          const comp = catalog[node.componentId];
          const w = comp?.width || 120;
          const h = comp?.height || 120;
          const nodeLeft = node.position.x - w / 2;
          const nodeRight = node.position.x + w / 2;
          const nodeTop = node.position.y - h / 2;
          const nodeBottom = node.position.y + h / 2;

          // Check bounding box intersection
          if (
            nodeLeft <= maxX &&
            nodeRight >= minX &&
            nodeTop <= maxY &&
            nodeBottom >= minY
          ) {
            newlySelected.add(node.id);
          }
        }

        useCircuitStore.setState({
          selectedNodeIds: newlySelected,
          selectedWireIds: new Set(),
        });
      }
      setMarquee(null);
    }

    setIsPanning(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent zooming canvas when quick search spotlight is open
    if (showQuickSearch) return;

    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(0.2, zoomScale * zoomFactor), 3);

    // Zoom centered on cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoomScale),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoomScale),
      }));
    }

    setZoomScale(newZoom);
  };

  // Drop component from sidebar
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentId = e.dataTransfer.getData("componentId");
    if (!componentId) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    addNode(componentId, worldPos);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Port mouse interaction
  const handlePortMouseDown = (
    portId: number,
    portPos: { x: number; y: number },
    nodeId: string | number
  ) => {
    if (wireDraft) {
      // Connect to target port
      completeWireDraft(nodeId, portId);
    } else {
      // Start dragging new wire
      startWireDraft(nodeId, portId, portPos);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === "Space") {
        setIsSpacePressed(true);
      }
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        setQuickSearchPos({ ...mouseWorldPosRef.current });
        setShowQuickSearch(true);
        setQuickSearchQuery("");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelection();
      } else if (e.key === "F5") {
        e.preventDefault();
        if (isSimulating) stopSimulation();
        else startSimulation();
      } else if (e.key === "r" || e.key === "R") {
        if (e.shiftKey) rotateSelectedNodes("ccw");
        else rotateSelectedNodes("cw");
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        copySelection();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        pasteSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        duplicateSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      } else if (e.key === "Escape") {
        cancelWireDraft();
        clearSelection();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [deleteSelection, rotateSelectedNodes, copySelection, pasteSelection, undo, redo, duplicateSelection, selectAll, cancelWireDraft, clearSelection, isSimulating, startSimulation, stopSimulation]);

  // Global mouse release for spring (momentary) buttons
  useEffect(() => {
    const handleGlobalRelease = () => {
      if (isSimulating) {
        const anyPressed = nodes.some((n) => n.isPressed);
        if (anyPressed) {
          for (const n of nodes) {
            if (n.isPressed) {
              setComponentPressed(n.id, false);
            }
          }
        }
      }
    };

    window.addEventListener("mouseup", handleGlobalRelease);
    return () => window.removeEventListener("mouseup", handleGlobalRelease);
  }, [isSimulating, nodes, setComponentPressed]);

  // Real-time Timer Tick Loop (100ms interval for countdown and motor timing)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      tickTimerSimulation(0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, tickTimerSimulation]);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const isDark = theme === "dark";

  // Single selected node for Popover
  const selectedNode =
    selectedNodeIds.size === 1 && !isSimulating
      ? nodeMap.get(Array.from(selectedNodeIds)[0])
      : null;

  const comp = selectedNode ? catalog[selectedNode.componentId] : null;
  const compHeight = comp?.height || 120;

  // Compute screen coordinates for popover relative to FlowCanvas container
  const screenNodeTopY = selectedNode
    ? panOffset.y + (selectedNode.position.y - compHeight / 2) * zoomScale
    : 0;
  const screenNodeCenterX = selectedNode
    ? panOffset.x + selectedNode.position.x * zoomScale
    : 0;
  const screenNodeBottomY = selectedNode
    ? panOffset.y + (selectedNode.position.y + compHeight / 2) * zoomScale
    : 0;

  const isNearTop = screenNodeTopY < 65;
  const popoverY = isNearTop ? screenNodeBottomY + 12 : screenNodeTopY - 14;
  const placement = isNearTop ? "bottom" : "top";

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={(e) => {
        e.preventDefault();
        if (wireDraft) {
          cancelWireDraft();
          return;
        }
        const worldPos = screenToWorld(e.clientX, e.clientY);
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          target: { type: "canvas", worldPos },
        });
      }}
      className={`flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden select-none transition-colors duration-150 ${
        isDark ? "bg-[#090b10]" : "bg-[#f8fafc]"
      } ${
        probeActive
          ? "cursor-crosshair"
          : draggingNodeState?.hasMoved
          ? "cursor-grabbing"
          : isPanning
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default"
      }`}
      style={{
        // Continuous fine mesh grid lines with low opacity (Engineering CAD style)
        backgroundImage: showGrid
          ? isDark
            ? `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`
            : `linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`
          : "none",
        backgroundSize: `${30 * zoomScale}px ${30 * zoomScale}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* Short Circuit Warning Floating Banner */}
      {shortCircuit && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/20 border border-red-500/80 text-red-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-5 h-5 text-red-400 fill-red-500/30" />
          <span className="text-xs font-semibold">{shortCircuitMessage || "Short circuit detected! Simulation halted."}</span>
        </div>
      )}

      {/* World Space Container (Transformed via Pan & Zoom) */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
          transformOrigin: "0 0",
        }}
        className="w-full h-full absolute inset-0 pointer-events-none"
      >
        {/* SVG Layer for Wires & Smart Guidelines */}
        <svg className="w-[10000px] h-[10000px] absolute -top-[5000px] -left-[5000px] pointer-events-none overflow-visible">
          <g transform="translate(5000, 5000)">
            {/* Smart Alignment Guidelines */}
            {smartGuidelines.map((guide, idx) => (
              <g key={`guide-${idx}`} className="pointer-events-none">
                {guide.type === "vertical" ? (
                  <>
                    <line
                      x1={guide.coord}
                      y1={guide.start}
                      x2={guide.coord}
                      y2={guide.end}
                      stroke={isDark ? "#94a3b8" : "#475569"}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                    <circle cx={guide.coord} cy={guide.start} r={3} fill={isDark ? "#94a3b8" : "#475569"} />
                    <circle cx={guide.coord} cy={guide.end} r={3} fill={isDark ? "#94a3b8" : "#475569"} />
                  </>
                ) : (
                  <>
                    <line
                      x1={guide.start}
                      y1={guide.coord}
                      x2={guide.end}
                      y2={guide.coord}
                      stroke={isDark ? "#94a3b8" : "#475569"}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                    <circle cx={guide.start} cy={guide.coord} r={3} fill={isDark ? "#94a3b8" : "#475569"} />
                    <circle cx={guide.end} cy={guide.coord} r={3} fill={isDark ? "#94a3b8" : "#475569"} />
                  </>
                )}
              </g>
            ))}

            {wires.map((wire) => (
              <FlowWire
                key={wire.id}
                wire={wire}
                fromNode={nodeMap.get(wire.fromNodeId)}
                toNode={nodeMap.get(wire.toNodeId)}
                isSelected={selectedWireIds.has(wire.id)}
                routingMode={wireRoutingMode}
                onContextMenu={handleWireContextMenu}
                onWireHover={handleWireHover}
                onWireLeave={handleWireLeave}
              />
            ))}

            {/* Wire Draft Line (Active Connection under cursor) */}
            {wireDraft && (
              <g className="pointer-events-none">
                <path
                  d={
                    wireRoutingMode === "orthogonal"
                      ? ManhattanRouter.routeOrthogonal(
                          wireDraft.startPos,
                          2,
                          wireDraft.currentMousePos,
                          0
                        ).svgPath
                      : `M ${wireDraft.startPos.x} ${wireDraft.startPos.y} L ${wireDraft.currentMousePos.x} ${wireDraft.currentMousePos.y}`
                  }
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4, 4"
                />
                {/* Magnetic Port Start Dot */}
                <circle
                  cx={wireDraft.startPos.x}
                  cy={wireDraft.startPos.y}
                  r={5}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                {/* Cursor Target Dot */}
                <circle
                  cx={wireDraft.currentMousePos.x}
                  cy={wireDraft.currentMousePos.y}
                  r={4.5}
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth={1}
                />
              </g>
            )}
          </g>
        </svg>

        {/* DOM Layer for Component Nodes */}
        <div className="pointer-events-auto">
          {nodes.map((node) => (
            <FlowNode
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              onPortMouseDown={(portId, portPos, e) => handlePortMouseDown(portId, portPos, node.id)}
              onNodeMouseDown={handleNodeMouseDown}
              onContextMenu={handleNodeContextMenu}
              onPortHover={handlePortHover}
              onPortLeave={handlePortLeave}
            />
          ))}
        </div>

        {/* Marquee Selection Rectangle */}
        {marquee && (
          <div
            style={{
              left: `${Math.min(marquee.startX, marquee.currentX)}px`,
              top: `${Math.min(marquee.startY, marquee.currentY)}px`,
              width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
              height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
            }}
            className="absolute border border-amber-400 bg-amber-500/10 rounded pointer-events-none"
          />
        )}
      </div>

      {/* Node Action Popover (when symbol is selected) */}
      {selectedNode && !draggingNodeState?.hasMoved && (
        <div
          style={{
            left: `${screenNodeCenterX}px`,
            top: `${popoverY}px`,
            transform: isNearTop ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          className="absolute z-40 pointer-events-auto"
        >
          <NodePopover
            node={selectedNode}
            isDark={isDark}
            canPaste={Boolean(clipboard && clipboard.nodes.length > 0)}
            placement={placement}
            onRotateRight={() => rotateSelectedNodes("cw")}
            onRotateLeft={() => rotateSelectedNodes("ccw")}
            onCopy={() => copySelection()}
            onPaste={() =>
              pasteSelection({
                x: selectedNode.position.x + 30,
                y: selectedNode.position.y + 30,
              })
            }
            onDelete={() => deleteSelection()}
          />
        </div>
      )}

      {/* Floating Bottom CAD Control Deck */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Real-time Cursor World Coordinates & CAD Snap Indicator */}
        <div
          className={`flex items-center gap-3 backdrop-blur-md border rounded-2xl px-3.5 py-1.5 text-xs shadow-xl pointer-events-auto transition-colors ${
            isDark
              ? "bg-[#121620]/90 border-white/10 text-zinc-400"
              : "bg-white/90 border-slate-200 text-slate-600 shadow-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
            <span>X: <strong className={isDark ? "text-zinc-200" : "text-slate-800"}>{cursorCoords.x}</strong></span>
            <span>Y: <strong className={isDark ? "text-zinc-200" : "text-slate-800"}>{cursorCoords.y}</strong></span>
          </div>
          <span className={isDark ? "text-zinc-700" : "text-slate-300"}>|</span>
          <span className="text-[10px] text-zinc-500 font-mono">Snap: 30px</span>
        </div>

        {/* Center: Navigation, Zoom & Precision Multimeter Controls */}
        <div
          className={`flex items-center gap-1.5 backdrop-blur-md border rounded-2xl p-1 text-xs shadow-xl pointer-events-auto transition-colors ${
            isDark
              ? "bg-[#121620]/90 border-white/10 text-zinc-300"
              : "bg-white/90 border-slate-200 text-slate-700 shadow-slate-200"
          }`}
        >
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-400 hover:text-white" : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Zoom to 100% */}
          <button
            onClick={handleResetZoom}
            title="Reset Zoom (100%)"
            className={`px-2 py-1 rounded-xl font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            {Math.round(zoomScale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-400 hover:text-white" : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom to Fit Circuit */}
          <button
            onClick={handleZoomToFit}
            title="Zoom to Fit Circuit (Align & Center)"
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Fit</span>
          </button>

          <span className={`h-4 w-px mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

          {/* Virtual Multimeter Probe Tool Toggle */}
          <button
            onClick={() => setProbeActive((prev) => !prev)}
            title="Virtual Multimeter / Voltage Probe HUD"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              probeActive
                ? isDark
                  ? "bg-white/10 text-zinc-200 border border-white/20"
                  : "bg-slate-200 text-slate-900 border border-slate-300"
                : isDark
                ? "hover:bg-white/10 text-zinc-400 hover:text-zinc-200"
                : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-zinc-400" />
            <span>Probe {probeActive ? "ON" : "OFF"}</span>
          </button>

          <span className={`h-4 w-px mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

          {/* Mini-Map Navigator Toggle */}
          <button
            onClick={() => setShowMiniMap((prev) => !prev)}
            title="Toggle Mini-Map Navigator"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              showMiniMap
                ? isDark
                  ? "bg-white/10 text-zinc-200 border border-white/20"
                  : "bg-slate-200 text-slate-900 border border-slate-300"
                : isDark
                ? "hover:bg-white/10 text-zinc-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        {/* Right: Project Statistics & Simulation Status */}
        <div
          className={`flex items-center gap-3 backdrop-blur-md border rounded-2xl px-3.5 py-1.5 text-xs shadow-xl pointer-events-auto transition-colors ${
            isDark
              ? "bg-[#121620]/90 border-white/10 text-zinc-400"
              : "bg-white/90 border-slate-200 text-slate-600 shadow-slate-200"
          }`}
        >
          <span className="font-mono text-[11px]">
            Nodes: <strong className={isDark ? "text-white" : "text-slate-900"}>{nodes.length}</strong> | Wires:{" "}
            <strong className={isDark ? "text-white" : "text-slate-900"}>{wires.length}</strong>
          </span>
          <span className={isDark ? "text-zinc-700" : "text-slate-300"}>|</span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span
              className={`w-2 h-2 rounded-full ${
                shortCircuit
                  ? "bg-red-500 animate-ping"
                  : isSimulating
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            <span className={shortCircuit ? "text-red-400" : isSimulating ? "text-emerald-400" : "text-zinc-400"}>
              {shortCircuit ? "SHORT CIRCUIT" : isSimulating ? "SIMULATING" : "STANDBY"}
            </span>
          </div>
        </div>
      </div>

      {/* Mini-Map Navigator Widget */}
      {showMiniMap && (
        <MiniMap
          nodes={nodes}
          wires={wires}
          panOffset={panOffset}
          zoomScale={zoomScale}
          onPanChange={setPanOffset}
          containerRef={containerRef}
          isDark={isDark}
        />
      )}

      {/* Virtual Multimeter / Voltage Probe Tool HUD */}
      {probeActive && (
        <VirtualProbeHUD
          reading={probeReading}
          isSimulating={isSimulating}
          isDark={isDark}
        />
      )}

      {/* Right-Click Smart Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          isDark={isDark}
          isSimulating={isSimulating}
          probeActive={probeActive}
          onClose={() => setContextMenu(null)}
          onRotateNode={(id) => rotateNode(id, "cw")}
          onDuplicate={() => duplicateSelection()}
          onDeleteNode={(id) => deleteNode(id)}
          onDeleteWire={(id) => deleteWire(id)}
          onInsertJunction={(wireId, pos) => splitWireAtJunction(wireId, pos)}
          onEditNode={(node) => {
            selectNode(node.id, false);
          }}
          onToggleNodeState={(id) => toggleComponentState(id)}
          onOpenSearch={() => {
            setQuickSearchPos({ ...mouseWorldPosRef.current });
            setShowQuickSearch(true);
            setQuickSearchQuery("");
          }}
          onZoomToFit={handleZoomToFit}
          onResetZoom={handleResetZoom}
          onSelectAll={() => selectAll()}
          onToggleProbe={() => setProbeActive((prev) => !prev)}
        />
      )}

      {/* Quick Search Spotlight Modal (Ctrl+K or /) */}
      {showQuickSearch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowQuickSearch(false)}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-3 shadow-2xl animate-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#121620] border-white/15 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search symbol (e.g. coil, switch, motor)..."
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-500"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowQuickSearch(false);
                }}
              />
              <span className="text-[10px] text-zinc-500 font-mono">ESC</span>
            </div>

            <div className="max-h-64 overflow-y-auto mt-2 space-y-1">
              {Object.entries(catalog)
                .filter(([id, comp]: [string, any]) => {
                  const q = quickSearchQuery.toLowerCase();
                  return comp.name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
                })
                .slice(0, 8)
                .map(([id, comp]: [string, any]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      addNode(id, {
                        x: Math.round(quickSearchPos.x / 30) * 30,
                        y: Math.round(quickSearchPos.y / 30) * 30,
                      });
                      setShowQuickSearch(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                      isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 flex items-center justify-center rounded bg-amber-500/10 p-1">
                        <img
                          src={comp.svgPath}
                          alt={comp.name}
                          className={`w-full h-full object-contain ${isDark ? "" : "filter invert"}`}
                        />
                      </div>
                      <span className="font-medium">{comp.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{comp.category}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
