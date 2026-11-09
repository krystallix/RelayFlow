"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { FlowNode } from "./FlowNode";
import { FlowWire } from "./FlowWire";
import { NodePopover } from "./NodePopover";
import { MultiNodePopover } from "./MultiNodePopover";
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
  Plus,
  Undo2,
  Redo2,
  Sparkles,
} from "lucide-react";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import { WireMargins } from "@/engine/types";
import catalogData from "@/constants/components-catalog.json";
import { CircuitNode, CircuitWire } from "@/engine/types";

const catalog = catalogData as Record<string, any>;

interface FlowCanvasProps {
  zoomScale: number;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  onOpenPalette?: () => void;
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
  onOpenPalette,
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

  // Mini-Map visibility (hidden by default on mobile for screen space)
  const [showMiniMap, setShowMiniMap] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setShowMiniMap(true);
    }
  }, []);

  // Real-time Cursor Coordinates
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });

  // Touch gesture state ref for silky-smooth mobile multi-touch
  const touchStateRef = useRef<{
    mode: "none" | "pan" | "pinch" | "nodeDrag";
    lastTapTime: number;
    startDistance: number;
    startZoom: number;
    startCentroidScreen: { x: number; y: number };
    startCentroidWorld: { x: number; y: number };
    startPan: { x: number; y: number };
    startTouchPos: { x: number; y: number };
    longPressTimer: any;
    hasMoved: boolean;
  }>({
    mode: "none",
    lastTapTime: 0,
    startDistance: 0,
    startZoom: 1,
    startCentroidScreen: { x: 0, y: 0 },
    startCentroidWorld: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    startTouchPos: { x: 0, y: 0 },
    longPressTimer: null,
    hasMoved: false,
  });

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
    selectWire,
    toggleComponentState,
    setComponentPressed,
    updateNodesPositions,
    startSimulation,
    stopSimulation,
    tickTimerSimulation,
    splitWireAtJunction,
    updateWireMargins,
    undo,
    redo,
    undoStack,
    redoStack,
    autoLayout,
    recentComponentIds,
    startWireDraft,
    updateWireDraft,
    completeWireDraft,
    cancelWireDraft,
    updateNodeData,
  } = useCircuitStore();

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [draggingWireSegment, setDraggingWireSegment] = useState<{
    wireId: string | number;
    orientation: "horizontal" | "vertical";
    defaultMid: number;
    initialMargins: WireMargins;
  } | null>(null);

  const zoomScaleRef = useRef(zoomScale);
  zoomScaleRef.current = zoomScale;

  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;

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
    if (!selectedNodeIds.has(node.id)) {
      selectNode(node.id, false);
    }
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
    if (!selectedWireIds.has(wire.id)) {
      selectWire(wire.id, false);
    }
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
    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      if (!e.shiftKey) clearSelection();
      return;
    }

    // Left Click on empty canvas: Start Marquee Selection (CAD Box Selection)
    if (e.button === 0) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setMarquee({ startX: worldPos.x, startY: worldPos.y, currentX: worldPos.x, currentY: worldPos.y });
      if (!e.shiftKey) clearSelection();
    }
  };

  // Core Node Dragging (Unified for Mouse & Touch)
  const startDraggingNode = (
    nodeId: string | number,
    clientX: number,
    clientY: number,
    shiftKey: boolean = false
  ) => {
    if (isSimulating) {
      toggleComponentState(nodeId);
      return;
    }

    const worldPos = screenToWorld(clientX, clientY);

    // Determine nodes to drag together
    let targetIds: (string | number)[] = [nodeId];
    if (selectedNodeIds.has(nodeId)) {
      targetIds = Array.from(selectedNodeIds);
    } else if (!shiftKey) {
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
      shiftKey,
    });
  };

  const moveDraggingNode = (worldPos: { x: number; y: number }) => {
    if (!draggingNodeState) return;

    let dx = worldPos.x - draggingNodeState.startWorldPos.x;
    let dy = worldPos.y - draggingNodeState.startWorldPos.y;

    if (Math.hypot(dx, dy) > 3) {
      draggingNodeState.hasMoved = true;
    }

    if (draggingNodeState.hasMoved) {
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
  };

  const finishDraggingNode = () => {
    setSmartGuidelines([]);
    if (!draggingNodeState) return;

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
  };

  // Node Mouse Down (initiates drag or click)
  const handleNodeMouseDown = (nodeId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    startDraggingNode(nodeId, e.clientX, e.clientY, e.shiftKey);
  };

  // Node Touch Start (mobile node touch & drag)
  const handleNodeTouchStart = (nodeId: string | number, e: React.TouchEvent) => {
    e.stopPropagation();
    if (contextMenu) setContextMenu(null);

    const touch = e.touches[0];
    if (!touch) return;

    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    // Set long press timer for Node Context Menu on mobile (500ms)
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      const clientX = touch.clientX;
      const clientY = touch.clientY;
      const worldPos = screenToWorld(clientX, clientY);
      touchStateRef.current.longPressTimer = setTimeout(() => {
        if (!touchStateRef.current.hasMoved) {
          setContextMenu({
            x: clientX,
            y: clientY,
            target: { type: "node", node: targetNode, worldPos },
          });
        }
      }, 500);
    }

    touchStateRef.current.mode = "nodeDrag";
    touchStateRef.current.startTouchPos = { x: touch.clientX, y: touch.clientY };
    touchStateRef.current.hasMoved = false;

    startDraggingNode(nodeId, touch.clientX, touch.clientY, false);
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    mouseWorldPosRef.current = worldPos;
    setCursorCoords({
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
    });

    // 0. Live Wire Segment Dragging (draw.io style - aligned to 30px grid)
    if (draggingWireSegment) {
      if (draggingWireSegment.orientation === "horizontal") {
        const newCenter = Math.round((worldPos.y - draggingWireSegment.defaultMid) / 30) * 30;
        updateWireMargins(
          draggingWireSegment.wireId,
          { ...draggingWireSegment.initialMargins, center: newCenter },
          false
        );
      } else {
        const newCenter = Math.round((worldPos.x - draggingWireSegment.defaultMid) / 30) * 30;
        updateWireMargins(
          draggingWireSegment.wireId,
          { ...draggingWireSegment.initialMargins, center: newCenter },
          false
        );
      }
      return;
    }

    // 1. Handle active node dragging (120 FPS live update) with Magnetic Alignment Smart Guides
    if (draggingNodeState) {
      moveDraggingNode(worldPos);
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

    if (draggingWireSegment) {
      const currentWire = wires.find((w) => w.id === draggingWireSegment.wireId);
      if (currentWire) {
        updateWireMargins(draggingWireSegment.wireId, currentWire.margins || {}, true);
      }
      setDraggingWireSegment(null);
      return;
    }

    if (draggingNodeState) {
      finishDraggingNode();
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

  // Canvas Touch Start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contextMenu) setContextMenu(null);

    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    // 2-Finger Touch: Smooth Anchored Pinch Zoom & 2-finger Pan
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;

      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const currentZoom = zoomScaleRef.current;
      const currentPan = panOffsetRef.current;

      const worldCentroid = {
        x: (cx - rect.left - currentPan.x) / currentZoom,
        y: (cy - rect.top - currentPan.y) / currentZoom,
      };

      touchStateRef.current = {
        ...touchStateRef.current,
        mode: "pinch",
        startDistance: dist,
        startZoom: currentZoom,
        startCentroidScreen: { x: cx, y: cy },
        startCentroidWorld: worldCentroid,
        startPan: { ...currentPan },
        hasMoved: false,
      };
      return;
    }

    // 1-Finger Touch on Canvas Background
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      const isDoubleTap = now - touchStateRef.current.lastTapTime < 300;
      touchStateRef.current.lastTapTime = now;

      // Double tap on empty canvas zooms to fit entire schematic!
      if (isDoubleTap && !draggingNodeState) {
        handleZoomToFit();
        return;
      }

      // If drafting wire and tapped empty canvas, cancel draft
      if (wireDraft && !draggingNodeState) {
        cancelWireDraft();
        return;
      }

      const worldPos = screenToWorld(touch.clientX, touch.clientY);
      mouseWorldPosRef.current = worldPos;

      touchStateRef.current = {
        ...touchStateRef.current,
        mode: draggingNodeState ? "nodeDrag" : "pan",
        startTouchPos: { x: touch.clientX, y: touch.clientY },
        startPan: { ...panOffsetRef.current },
        hasMoved: false,
      };

      // Long press (500ms) on empty canvas opens Context Menu
      if (!draggingNodeState) {
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        touchStateRef.current.longPressTimer = setTimeout(() => {
          if (!touchStateRef.current.hasMoved) {
            setContextMenu({
              x: clientX,
              y: clientY,
              target: { type: "canvas", worldPos },
            });
          }
        }, 500);
      }
    }
  };

  // Canvas Touch Move
  const handleTouchMove = (e: React.TouchEvent) => {
    // 2-Finger Pinch Zoom
    if (e.touches.length === 2 && touchStateRef.current.mode === "pinch") {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;

      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const ratio = dist / Math.max(1, touchStateRef.current.startDistance);
      const newZoom = Math.min(Math.max(0.2, touchStateRef.current.startZoom * ratio), 3);

      const world = touchStateRef.current.startCentroidWorld;
      const newPan = {
        x: cx - rect.left - world.x * newZoom,
        y: cy - rect.top - world.y * newZoom,
      };

      zoomScaleRef.current = newZoom;
      panOffsetRef.current = newPan;
      setZoomScale(newZoom);
      setPanOffset(newPan);
      return;
    }

    // 1-Finger Drag
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStateRef.current.startTouchPos.x;
      const dy = touch.clientY - touchStateRef.current.startTouchPos.y;

      if (Math.hypot(dx, dy) > 8) {
        touchStateRef.current.hasMoved = true;
        if (touchStateRef.current.longPressTimer) {
          clearTimeout(touchStateRef.current.longPressTimer);
          touchStateRef.current.longPressTimer = null;
        }
      }

      const worldPos = screenToWorld(touch.clientX, touch.clientY);
      mouseWorldPosRef.current = worldPos;
      setCursorCoords({
        x: Math.round(worldPos.x),
        y: Math.round(worldPos.y),
      });

      // Dragging a node with touch
      if (draggingNodeState) {
        moveDraggingNode(worldPos);
        return;
      }

      // Updating wire draft with touch
      if (wireDraft) {
        updateWireDraft(worldPos);
        return;
      }

      // Panning canvas with touch
      if (touchStateRef.current.mode === "pan") {
        const newPan = {
          x: touchStateRef.current.startPan.x + dx,
          y: touchStateRef.current.startPan.y + dy,
        };
        panOffsetRef.current = newPan;
        setPanOffset(newPan);
      }
    }
  };

  // Canvas Touch End
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    if (draggingNodeState) {
      finishDraggingNode();
    }

    touchStateRef.current.mode = "none";
    touchStateRef.current.hasMoved = false;
    setSmartGuidelines([]);
  };

  // Native Wheel & Trackpad Pinch Zoom Listener (Non-passive to prevent browser page-zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Prevent zooming canvas when quick search spotlight is open
      if (showQuickSearch) return;

      // Crucial: prevent browser default behavior (page zoom & swipe navigation)
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = zoomScaleRef.current;
      const currentPan = panOffsetRef.current;

      // Trackpad pinch-to-zoom (or Ctrl+wheel / Cmd+wheel)
      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = Math.exp(-e.deltaY * 0.01);
        const newZoom = Math.min(Math.max(0.2, currentZoom * zoomFactor), 3);

        const newPan = {
          x: mouseX - (mouseX - currentPan.x) * (newZoom / currentZoom),
          y: mouseY - (mouseY - currentPan.y) * (newZoom / currentZoom),
        };

        zoomScaleRef.current = newZoom;
        panOffsetRef.current = newPan;
        setZoomScale(newZoom);
        setPanOffset(newPan);
      } else {
        // Trackpad 2-finger pan or wheel scroll
        const newPan = {
          x: currentPan.x - e.deltaX,
          y: currentPan.y - e.deltaY,
        };
        panOffsetRef.current = newPan;
        setPanOffset(newPan);
      }
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });
    container.addEventListener("gesturestart", handleGesture, { passive: false });
    container.addEventListener("gesturechange", handleGesture, { passive: false });
    container.addEventListener("gestureend", handleGesture, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheelNative);
      container.removeEventListener("gesturestart", handleGesture);
      container.removeEventListener("gesturechange", handleGesture);
      container.removeEventListener("gestureend", handleGesture);
    };
  }, [showQuickSearch, setZoomScale, setPanOffset]);

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
      } else if (e.key === "Delete") {
        deleteSelection();
      } else if (e.key === "Backspace") {
        if (selectedNodeIds.size === 1 && !isSimulating) {
          // Direct backspace deletes character from comment
          e.preventDefault();
          const targetNodeId = Array.from(selectedNodeIds)[0];
          const targetNode = nodes.find((n) => n.id === targetNodeId);
          if (targetNode) {
            const currentComment = targetNode.comment || "";
            const nextComment = currentComment.slice(0, -1);
            updateNodeData(targetNodeId, { comment: nextComment || null }, false);
          }
        } else {
          deleteSelection();
        }
      } else if (e.key === "F5") {
        e.preventDefault();
        if (isSimulating) stopSimulation();
        else startSimulation();
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
      } else if (e.altKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        autoLayout();
      } else if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        let dx = 0;
        let dy = 0;
        if (e.key === "ArrowUp") dy = -30;
        else if (e.key === "ArrowDown") dy = 30;
        else if (e.key === "ArrowLeft") dx = -30;
        else if (e.key === "ArrowRight") dx = 30;

        // 1. If nodes are selected, move them by 30px on grid
        if (selectedNodeIds.size > 0 && !isSimulating) {
          const updates = Array.from(selectedNodeIds).map((id) => {
            const n = nodes.find((node) => node.id === id);
            return {
              id,
              position: {
                x: Math.round(((n?.position.x || 0) + dx) / 30) * 30,
                y: Math.round(((n?.position.y || 0) + dy) / 30) * 30,
              },
            };
          });
          updateNodesPositions(updates, true);
        } else if (selectedWireIds.size > 0 && !isSimulating) {
          // 2. If wires are selected, nudge center position by 30px on grid
          for (const wireId of selectedWireIds) {
            const w = wires.find((wire) => wire.id === wireId);
            if (!w) continue;
            const currentCenter = w.margins?.center || 0;
            const delta = dy !== 0 ? dy : dx;
            updateWireMargins(wireId, { ...w.margins, center: currentCenter + delta }, true);
          }
        } else {
          // 3. Pan canvas smoothly with arrow keys if nothing is selected
          setPanOffset((prev) => ({ x: prev.x - dx, y: prev.y - dy }));
        }
      } else if (e.key === "Escape") {
        cancelWireDraft();
        clearSelection();
      } else if (
        selectedNodeIds.size === 1 &&
        !isSimulating &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1
      ) {
        // Direct type to comment on selected symbol (CAD smart annotation)
        const targetNodeId = Array.from(selectedNodeIds)[0];
        const targetNode = nodes.find((n) => n.id === targetNodeId);
        if (targetNode) {
          const currentComment = targetNode.comment || "";
          const nextComment = currentComment + e.key;
          updateNodeData(targetNodeId, { comment: nextComment || null }, false);
        }
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
  }, [
    deleteSelection,
    rotateSelectedNodes,
    copySelection,
    pasteSelection,
    undo,
    redo,
    duplicateSelection,
    selectAll,
    autoLayout,
    cancelWireDraft,
    clearSelection,
    isSimulating,
    startSimulation,
    stopSimulation,
    selectedNodeIds,
    selectedWireIds,
    nodes,
    wires,
    updateNodesPositions,
    updateWireMargins,
    setPanOffset,
    updateNodeData,
  ]);

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

  // Precompute component obstacle boxes for orthogonal routing clearance
  const nodeObstacles = React.useMemo(() => {
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

  // Single selected node for Popover
  const selectedNode =
    selectedNodeIds.size === 1 && !isSimulating
      ? nodeMap.get(Array.from(selectedNodeIds)[0])
      : null;

  // Multiple selected nodes for Alignment & Distribution Popover (2 or more nodes)
  const selectedNodesList =
    selectedNodeIds.size >= 2 && !isSimulating
      ? Array.from(selectedNodeIds)
          .map((id) => nodeMap.get(id))
          .filter(Boolean) as CircuitNode[]
      : [];

  const comp = selectedNode ? catalog[selectedNode.componentId] : null;
  const compHeight = comp?.height || 120;

  // Compute screen coordinates for single node popover
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

  // Compute collective bounding box for multi-node popover
  let multiPopoverCenterX = 0;
  let multiPopoverY = 0;
  let multiIsNearTop = false;

  if (selectedNodesList.length >= 2) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of selectedNodesList) {
      const c = catalog[n.componentId];
      const w = c?.width || 120;
      const h = c?.height || 120;
      minX = Math.min(minX, n.position.x - w / 2);
      maxX = Math.max(maxX, n.position.x + w / 2);
      minY = Math.min(minY, n.position.y - h / 2);
      maxY = Math.max(maxY, n.position.y + h / 2);
    }

    const screenMinX = panOffset.x + minX * zoomScale;
    const screenMaxX = panOffset.x + maxX * zoomScale;
    const screenMinY = panOffset.y + minY * zoomScale;
    const screenMaxY = panOffset.y + maxY * zoomScale;

    multiPopoverCenterX = (screenMinX + screenMaxX) / 2;
    multiIsNearTop = screenMinY < 65;
    multiPopoverY = multiIsNearTop ? screenMaxY + 14 : screenMinY - 14;
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
        draggingWireSegment
          ? draggingWireSegment.orientation === "horizontal"
            ? "cursor-ns-resize"
            : "cursor-ew-resize"
          : probeActive
          ? "cursor-crosshair"
          : draggingNodeState?.hasMoved
          ? "cursor-grabbing"
          : isPanning || isSpacePressed
          ? "cursor-grab active:cursor-grabbing"
          : marquee
          ? "cursor-crosshair"
          : "cursor-default"
      }`}
      style={{
        touchAction: "none",
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-white border border-zinc-200 text-black px-4 py-2.5 rounded-2xl shadow-2xl animate-bounce">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-xs font-semibold text-black">{shortCircuitMessage || "Short circuit detected! Simulation halted."}</span>
        </div>
      )}

      {/* Wire Drafting Active Indicator Pill (Super clear on mobile & desktop) */}
      {wireDraft && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-white text-black px-4 py-2 rounded-2xl shadow-2xl text-xs font-semibold border border-zinc-200 animate-in fade-in zoom-in-95">
          <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          <span>Tap destination terminal to complete wire</span>
          <button
            onClick={() => cancelWireDraft()}
            className="ml-1 bg-black/10 hover:bg-black/20 active:scale-95 text-black px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold transition-all"
          >
            Cancel
          </button>
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
                obstacles={nodeObstacles.filter(
                  (b) => b.id !== wire.fromNodeId && b.id !== wire.toNodeId
                )}
                screenToWorld={screenToWorld}
                onContextMenu={handleWireContextMenu}
                onWireHover={handleWireHover}
                onWireLeave={handleWireLeave}
                onStartDragSegment={(targetWire, orientation, defaultMid) => {
                  setDraggingWireSegment({
                    wireId: targetWire.id,
                    orientation,
                    defaultMid,
                    initialMargins: targetWire.margins || { start: 0, center: 0, end: 0 },
                  });
                }}
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
              onNodeTouchStart={handleNodeTouchStart}
              onContextMenu={handleNodeContextMenu}
              onPortHover={handlePortHover}
              onPortLeave={handlePortLeave}
            />
          ))}
        </div>

        {/* Marquee Selection Rectangle (CAD Blueprint Box Selection) */}
        {marquee && (
          <div
            style={{
              left: `${Math.min(marquee.startX, marquee.currentX)}px`,
              top: `${Math.min(marquee.startY, marquee.currentY)}px`,
              width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
              height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
            }}
            className={`absolute border border-dashed rounded-xs pointer-events-none z-30 ${
              isDark ? "border-white/50 bg-white/5" : "border-slate-800/40 bg-slate-900/5"
            }`}
          />
        )}
      </div>

      {/* Node Action Popover (when 1 symbol is selected) */}
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

      {/* Multi-Node Alignment & Distribution Popover (when 2 or more symbols are selected) */}
      {selectedNodesList.length >= 2 && !draggingNodeState?.hasMoved && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            left: `${multiPopoverCenterX}px`,
            top: `${multiPopoverY}px`,
            transform: multiIsNearTop ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          className="absolute z-40 pointer-events-auto"
        >
          <MultiNodePopover
            selectedNodes={selectedNodesList}
            isDark={isDark}
            placement={multiIsNearTop ? "bottom" : "top"}
            onRotateRight={() => rotateSelectedNodes("cw")}
            onRotateLeft={() => rotateSelectedNodes("ccw")}
            onCopy={() => copySelection()}
            onDelete={() => deleteSelection()}
          />
        </div>
      )}

      {/* DESKTOP Floating Bottom CAD Control Deck (Visible only on md+) */}
      <div className="hidden md:flex absolute bottom-4 left-4 right-4 z-20 items-center justify-between pointer-events-none">
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
                  ? "bg-white animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            <span className={shortCircuit ? "text-red-400" : isSimulating ? (isDark ? "text-white" : "text-slate-900") : "text-zinc-400"}>
              {shortCircuit ? "SHORT CIRCUIT" : isSimulating ? "SIMULATING" : "STANDBY"}
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE Floating Bottom CAD Control Dock (Compact & Thumb-Friendly) */}
      <div className="flex md:hidden absolute bottom-3 left-3 right-3 z-30 items-center justify-between pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div
          className={`w-full flex items-center justify-between gap-1 p-1.5 rounded-2xl border backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors ${
            isDark
              ? "bg-[#11141e]/95 border-white/10 text-zinc-300 shadow-black/80"
              : "bg-white/95 border-slate-200 text-slate-700 shadow-slate-300"
          }`}
        >
          {/* Add Component Palette Button */}
          <button
            onClick={onOpenPalette}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform border ${
              isDark
                ? "bg-white text-black border-white"
                : "bg-slate-900 text-white border-slate-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          {/* Undo */}
          <button
            onClick={() => undo()}
            disabled={undoStack.length === 0}
            className={`p-2 rounded-xl transition-all disabled:opacity-30 active:scale-95 ${
              isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={() => redo()}
            disabled={redoStack.length === 0}
            className={`p-2 rounded-xl transition-all disabled:opacity-30 active:scale-95 ${
              isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Auto Layout */}
          <button
            onClick={autoLayout}
            disabled={nodes.length === 0}
            className={`p-2 rounded-xl transition-all disabled:opacity-30 active:scale-95 ${
              isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Auto Layout"
          >
            <Sparkles className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Zoom to Fit */}
          <button
            onClick={handleZoomToFit}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Voltage Probe HUD Toggle */}
          <button
            onClick={() => setProbeActive((prev) => !prev)}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              probeActive
                ? isDark
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-slate-200 text-slate-900 border border-slate-300"
                : isDark
                ? "hover:bg-white/10 text-zinc-400"
                : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Voltage Probe HUD"
          >
            <Gauge className="w-4 h-4" />
          </button>

          {/* Mini-Map Toggle */}
          <button
            onClick={() => setShowMiniMap((prev) => !prev)}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              showMiniMap
                ? isDark
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-slate-200 text-slate-900 border border-slate-300"
                : isDark
                ? "hover:bg-white/10 text-zinc-400"
                : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Toggle Mini-Map"
          >
            <MapIcon className="w-4 h-4" />
          </button>
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
          onAutoLayout={autoLayout}
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
                      <div className={`w-6 h-6 flex items-center justify-center rounded p-1 border ${
                        isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                      }`}>
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
