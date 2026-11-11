import { Point, WireMargins, CircuitNode, CircuitWire } from "../types";
import { SimulationEngine } from "../SimulationEngine";
import catalogData from "@/constants/components-catalog.json";

const catalog = catalogData as Record<string, any>;

export interface Box {
  id?: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoutedWire {
  svgPath: string;
  points: Point[];
}

const orthogonalRouteCache = new Map<string, RoutedWire>();
const bezierRouteCache = new Map<string, RoutedWire>();
const MAX_ROUTE_CACHE = 5000;

export class ManhattanRouter {
  static clearRouteCache(): void {
    orthogonalRouteCache.clear();
    bezierRouteCache.clear();
  }
  /**
   * Simplifies an array of points by:
   * 1. Removing consecutive identical points.
   * 2. Removing intermediate collinear points along the same axis (monotone or redundant).
   * 3. Eliminating backtracking spikes along the same line.
   */
  static simplifyPoints(points: Point[]): Point[] {
    if (points.length <= 2) return points;

    // Pass 1: Remove consecutive duplicates
    const dedup: Point[] = [];
    for (const p of points) {
      if (dedup.length === 0) {
        dedup.push(p);
      } else {
        const prev = dedup[dedup.length - 1];
        if (Math.abs(prev.x - p.x) > 0.01 || Math.abs(prev.y - p.y) > 0.01) {
          dedup.push(p);
        }
      }
    }

    if (dedup.length <= 2) return dedup;

    // Pass 2: Repeatedly remove intermediate collinear points and reversals/backtracks
    let changed = true;
    let current = dedup;
    let iterations = 0;

    while (changed && current.length > 2 && iterations < 20) {
      changed = false;
      iterations++;
      const next: Point[] = [current[0]];

      for (let i = 1; i < current.length - 1; i++) {
        const prev = next[next.length - 1];
        const curr = current[i];
        const nxt = current[i + 1];

        const sameX = Math.abs(prev.x - curr.x) < 0.01 && Math.abs(curr.x - nxt.x) < 0.01;
        const sameY = Math.abs(prev.y - curr.y) < 0.01 && Math.abs(curr.y - nxt.y) < 0.01;

        if (sameX || sameY) {
          changed = true;
          continue; // eliminate redundant intermediate collinear point
        }

        next.push(curr);
      }

      next.push(current[current.length - 1]);

      // Clean any duplicates created by collapsing
      const cleaned: Point[] = [];
      for (const p of next) {
        if (cleaned.length === 0) {
          cleaned.push(p);
        } else {
          const last = cleaned[cleaned.length - 1];
          if (Math.abs(last.x - p.x) > 0.01 || Math.abs(last.y - p.y) > 0.01) {
            cleaned.push(p);
          }
        }
      }

      if (cleaned.length !== current.length) {
        changed = true;
      }
      current = cleaned;
    }

    return current;
  }

  /**
   * Generates an SVG path string for 90-degree orthogonal wiring
   * with automatic obstacle clearance and smooth line routing.
   */
  static routeOrthogonal(
    p1: Point,
    dir1: number, // 0=Top, 1=Right, 2=Bottom, 3=Left
    p2: Point,
    dir2: number,
    margins: WireMargins = { start: 0, center: 0, end: 0 },
    obstacles: Box[] = [],
    ignoreIds?: (string | number)[]
  ): RoutedWire {
    const ignoreKey = ignoreIds ? `${ignoreIds[0] || ""}_${ignoreIds[1] || ""}` : "";
    const cacheKey = `${p1.x},${p1.y},${dir1}_${p2.x},${p2.y},${dir2}_${margins?.start || 0},${margins?.center || 0},${margins?.end || 0}_${obstacles.length}_${ignoreKey}`;
    const cached = orthogonalRouteCache.get(cacheKey);
    if (cached) return cached;

    const STUB_LENGTH = 30; // standard 30px CAD grid step

    // Helper: test if vertical segment x crosses any obstacle box
    const verticalSegmentCollides = (x: number, yMin: number, yMax: number): Box | null => {
      for (const box of obstacles) {
        if (box.id !== undefined && ignoreIds && (box.id === ignoreIds[0] || box.id === ignoreIds[1])) {
          continue;
        }
        if (x >= box.x && x <= box.x + box.width && !(yMax < box.y || yMin > box.y + box.height)) {
          return box;
        }
      }
      return null;
    };

    // Helper: test if horizontal segment y crosses any obstacle box
    const horizontalSegmentCollides = (y: number, xMin: number, xMax: number): Box | null => {
      for (const box of obstacles) {
        if (box.id !== undefined && ignoreIds && (box.id === ignoreIds[0] || box.id === ignoreIds[1])) {
          continue;
        }
        if (y >= box.y && y <= box.y + box.height && !(xMax < box.x || xMin > box.x + box.width)) {
          return box;
        }
      }
      return null;
    };

    const hasCenterMargin = Boolean(margins.center && margins.center !== 0);

    // 1. Direct straight connection detection for aligned opposing ports:
    // Vertical opposing: dir1=2 (Bottom) and dir2=0 (Top) with p2.y >= p1.y, or dir1=0 (Top) and dir2=2 (Bottom) with p1.y >= p2.y
    const isVerticalOpposing =
      (dir1 === 2 && dir2 === 0 && p2.y >= p1.y) ||
      (dir1 === 0 && dir2 === 2 && p1.y >= p2.y);

    if (isVerticalOpposing && Math.abs(p1.x - p2.x) < 2 && !hasCenterMargin) {
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      if (!verticalSegmentCollides(p1.x, minY, maxY)) {
        const points = [p1, p2];
        return {
          svgPath: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
          points,
        };
      }
    }

    // Horizontal opposing: dir1=1 (Right) and dir2=3 (Left) with p2.x >= p1.x, or dir1=3 (Left) and dir2=1 (Right) with p1.x >= p2.x
    const isHorizontalOpposing =
      (dir1 === 1 && dir2 === 3 && p2.x >= p1.x) ||
      (dir1 === 3 && dir2 === 1 && p1.x >= p2.x);

    if (isHorizontalOpposing && Math.abs(p1.y - p2.y) < 2 && !hasCenterMargin) {
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      if (!horizontalSegmentCollides(p1.y, minX, maxX)) {
        const points = [p1, p2];
        return {
          svgPath: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
          points,
        };
      }
    }

    // 2. Small gap handling for opposing ports (prevents stub overshoot/crossing):
    if (isVerticalOpposing) {
      const topPt = dir1 === 2 ? p1 : p2;
      const botPt = dir1 === 2 ? p2 : p1;
      const gapY = botPt.y - topPt.y;

      if (gapY < 2 * STUB_LENGTH) {
        // Gap is tight: horizontal jog placed midway between ports without overshooting
        const midY = topPt.y + gapY / 2 + (margins.center || 0);
        const rawPoints: Point[] = [
          p1,
          { x: p1.x, y: midY },
          { x: p2.x, y: midY },
          p2,
        ];
        const points = ManhattanRouter.simplifyPoints(rawPoints);
        let svgPath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          svgPath += ` L ${points[i].x} ${points[i].y}`;
        }
        return { svgPath, points };
      }
    }

    if (isHorizontalOpposing) {
      const leftPt = dir1 === 1 ? p1 : p2;
      const rightPt = dir1 === 1 ? p2 : p1;
      const gapX = rightPt.x - leftPt.x;

      if (gapX < 2 * STUB_LENGTH) {
        // Gap is tight: vertical jog placed midway between ports without overshooting
        const midX = leftPt.x + gapX / 2 + (margins.center || 0);
        const rawPoints: Point[] = [
          p1,
          { x: midX, y: p1.y },
          { x: midX, y: p2.y },
          p2,
        ];
        const points = ManhattanRouter.simplifyPoints(rawPoints);
        let svgPath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          svgPath += ` L ${points[i].x} ${points[i].y}`;
        }
        return { svgPath, points };
      }
    }

    // 3. General orthogonal routing with stubs and obstacle nudging:
    const points: Point[] = [];
    points.push(p1);

    // Initial direction vectors
    const getDelta = (dir: number, dist: number): Point => {
      switch (dir) {
        case 0: return { x: 0, y: -dist }; // Top
        case 1: return { x: dist, y: 0 };  // Right
        case 2: return { x: 0, y: dist };  // Bottom
        case 3: return { x: -dist, y: 0 }; // Left
        default: return { x: 0, y: dist };
      }
    };

    const d1 = getDelta(dir1, Math.max(30, Math.round((STUB_LENGTH + (margins.start || 0)) / 30) * 30));
    const startStub: Point = {
      x: Math.round((p1.x + d1.x) / 30) * 30,
      y: Math.round((p1.y + d1.y) / 30) * 30,
    };
    points.push(startStub);

    const d2 = getDelta(dir2, Math.max(30, Math.round((STUB_LENGTH + (margins.end || 0)) / 30) * 30));
    const endStub: Point = {
      x: Math.round((p2.x + d2.x) / 30) * 30,
      y: Math.round((p2.y + d2.y) / 30) * 30,
    };

    // Predominantly vertical routing (standard in electrical control / ladder schematics)
    if (dir1 === 0 || dir1 === 2) {
      let midY = Math.round(((startStub.y + endStub.y) / 2 + (margins.center || 0)) / 30) * 30;

      const xMin = Math.min(startStub.x, endStub.x);
      const xMax = Math.max(startStub.x, endStub.x);
      const obstacle = horizontalSegmentCollides(midY, xMin, xMax);

      if (obstacle && (!margins.center || margins.center === 0)) {
        // Automatically nudge the horizontal connecting channel above or below the obstructing component
        const clearance = 30;
        const nudgeAbove = Math.round((obstacle.y - clearance) / 30) * 30;
        const nudgeBelow = Math.round((obstacle.y + obstacle.height + clearance) / 30) * 30;
        midY = Math.abs(midY - nudgeAbove) < Math.abs(midY - nudgeBelow) ? nudgeAbove : nudgeBelow;
      }

      points.push({ x: startStub.x, y: midY });
      points.push({ x: endStub.x, y: midY });
    } else {
      // Horizontal routing
      let midX = Math.round(((startStub.x + endStub.x) / 2 + (margins.center || 0)) / 30) * 30;

      const yMin = Math.min(startStub.y, endStub.y);
      const yMax = Math.max(startStub.y, endStub.y);
      const obstacle = verticalSegmentCollides(midX, yMin, yMax);

      if (obstacle && (!margins.center || margins.center === 0)) {
        const clearance = 30;
        const nudgeLeft = Math.round((obstacle.x - clearance) / 30) * 30;
        const nudgeRight = Math.round((obstacle.x + obstacle.width + clearance) / 30) * 30;
        midX = Math.abs(midX - nudgeLeft) < Math.abs(midX - nudgeRight) ? nudgeLeft : nudgeRight;
      }

      points.push({ x: midX, y: startStub.y });
      points.push({ x: midX, y: endStub.y });
    }

    points.push(endStub);
    points.push(p2);

    const simplified = ManhattanRouter.simplifyPoints(points);

    // Build SVG path
    let svgPath = `M ${simplified[0].x} ${simplified[0].y}`;
    for (let i = 1; i < simplified.length; i++) {
      svgPath += ` L ${simplified[i].x} ${simplified[i].y}`;
    }

    const result: RoutedWire = { svgPath, points: simplified };
    if (orthogonalRouteCache.size >= MAX_ROUTE_CACHE) {
      orthogonalRouteCache.clear();
    }
    orthogonalRouteCache.set(cacheKey, result);
    return result;
  }

  /**
   * Generates a sleek curved Cubic Bezier path (FlowFlux visual style)
   */
  static routeBezier(
    p1: Point,
    dir1: number,
    p2: Point,
    dir2: number
  ): RoutedWire {
    const cacheKey = `${p1.x},${p1.y},${dir1}_${p2.x},${p2.y},${dir2}`;
    const cached = bezierRouteCache.get(cacheKey);
    if (cached) return cached;

    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const dist = Math.max(40, Math.sqrt(dx * dx + dy * dy) * 0.4);

    let cp1: Point = { x: p1.x, y: p1.y };
    let cp2: Point = { x: p2.x, y: p2.y };

    // Calculate control points based on port directions
    if (dir1 === 0) cp1.y -= dist;
    else if (dir1 === 1) cp1.x += dist;
    else if (dir1 === 2) cp1.y += dist;
    else if (dir1 === 3) cp1.x -= dist;

    if (dir2 === 0) cp2.y -= dist;
    else if (dir2 === 1) cp2.x += dist;
    else if (dir2 === 2) cp2.y += dist;
    else if (dir2 === 3) cp2.x -= dist;

    const svgPath = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;

    const result: RoutedWire = {
      svgPath,
      points: [p1, cp1, cp2, p2],
    };
    if (bezierRouteCache.size >= MAX_ROUTE_CACHE) {
      bezierRouteCache.clear();
    }
    bezierRouteCache.set(cacheKey, result);
    return result;
  }

  /**
   * Projects a given point onto orthogonal polyline segments, snapping to the 30px CAD grid.
   */
  static getNearestPointOnSegments(
    mouse: Point,
    points: Point[]
  ): { point: Point; dist: number; orientation: "horizontal" | "vertical" } {
    let bestDist = Infinity;
    let bestPoint = points[0] || mouse;
    let bestOrientation: "horizontal" | "vertical" = "horizontal";

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];

      let projX = mouse.x;
      let projY = mouse.y;
      const isVert = Math.abs(a.x - b.x) < 0.1;

      if (isVert) {
        projX = a.x;
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        projY = Math.max(minY, Math.min(maxY, mouse.y));
      } else {
        projY = a.y;
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        projX = Math.max(minX, Math.min(maxX, mouse.x));
      }

      const d = Math.hypot(mouse.x - projX, mouse.y - projY);
      if (d < bestDist) {
        bestDist = d;
        bestPoint = { x: Math.round(projX / 30) * 30, y: Math.round(projY / 30) * 30 };
        bestOrientation = isVert ? "vertical" : "horizontal";
      }
    }

    return { point: bestPoint, dist: bestDist, orientation: bestOrientation };
  }

  /**
   * Dynamically resolves the endpoints and approach directions of a wire.
   * If the wire is tapped into another wire (wire.toWireId), its p2 and approach direction
   * are dynamically projected onto the target wire's live routed segments, so when
   * any component connected to the target wire moves, the tap wire automatically stretches
   * and stays permanently connected.
   */
  static resolveWireEndpoints(
    wire: CircuitWire,
    nodeMap: Map<string | number, CircuitNode>,
    wireMap: Map<string | number, CircuitWire>,
    visitedWires = new Set<string | number>()
  ): {
    p1: Point;
    dir1: number;
    p2: Point;
    dir2: number;
    isTapWire: boolean;
  } | null {
    if (visitedWires.has(wire.id)) return null;
    visitedWires.add(wire.id);

    const fromNode = nodeMap.get(wire.fromNodeId);
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
    const dir1 = pFromTransformed.direction;

    // Check if tap wire
    if (wire.toWireId) {
      const targetWire = wireMap.get(wire.toWireId);
      if (targetWire) {
        // Resolve target wire endpoints and route it
        const targetEndpoints = ManhattanRouter.resolveWireEndpoints(
          targetWire,
          nodeMap,
          wireMap,
          new Set(visitedWires)
        );

        if (targetEndpoints) {
          const effectiveTargetMargins = targetEndpoints.isTapWire
            ? { ...targetWire.margins, end: -30 }
            : targetWire.margins;

          const routedTarget = ManhattanRouter.routeOrthogonal(
            targetEndpoints.p1,
            targetEndpoints.dir1,
            targetEndpoints.p2,
            targetEndpoints.dir2,
            effectiveTargetMargins
          );

          if (routedTarget.points && routedTarget.points.length >= 2) {
            const tapRef = wire.tapPoint || p1;
            const nearest = ManhattanRouter.getNearestPointOnSegments(tapRef, routedTarget.points);
            const p2 = nearest.point;

            // Perpendicular approach into target segment
            let dir2 = 0;
            if (nearest.orientation === "horizontal") {
              dir2 = p1.y <= p2.y ? 0 : 2; // top or bottom
            } else {
              dir2 = p1.x <= p2.x ? 3 : 1; // left or right
            }

            return { p1, dir1, p2, dir2, isTapWire: true };
          }
        }
      }

      // Fallback if targetWire not fully found but tapPoint exists
      if (wire.tapPoint) {
        const p2 = wire.tapPoint;
        let dir2 = 0;
        if (Math.abs(p1.y - p2.y) >= Math.abs(p1.x - p2.x)) {
          dir2 = p1.y <= p2.y ? 0 : 2;
        } else {
          dir2 = p1.x <= p2.x ? 3 : 1;
        }
        return { p1, dir1, p2, dir2, isTapWire: true };
      }
    }

    // Normal direct wire fromNode -> toNode
    const toNode = nodeMap.get(wire.toNodeId);
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
    const p2: Point = { x: pToTransformed.x, y: pToTransformed.y };
    const dir2 = pToTransformed.direction;

    return { p1, dir1, p2, dir2, isTapWire: false };
  }
}
