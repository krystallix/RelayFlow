import { Point, WireMargins } from "../types";

export interface RoutedWire {
  svgPath: string;
  points: Point[];
}

export class ManhattanRouter {
  /**
   * Generates an SVG path string for 90-degree orthogonal wiring
   */
  static routeOrthogonal(
    p1: Point,
    dir1: number, // 0=Top, 1=Right, 2=Bottom, 3=Left
    p2: Point,
    dir2: number,
    margins: WireMargins = { start: 0, center: 0, end: 0 }
  ): RoutedWire {
    const STUB_LENGTH = 15; // default stub extending outwards from pin

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

    const d1 = getDelta(dir1, STUB_LENGTH + (margins.start || 0));
    const startStub: Point = { x: p1.x + d1.x, y: p1.y + d1.y };
    points.push(startStub);

    const d2 = getDelta(dir2, STUB_LENGTH + (margins.end || 0));
    const endStub: Point = { x: p2.x + d2.x, y: p2.y + d2.y };

    // Intermediate routing with margins.center
    // If predominantly vertical routing (common in electrical ladder diagrams)
    if (dir1 === 0 || dir1 === 2) {
      const midY = (startStub.y + endStub.y) / 2 + (margins.center || 0);

      points.push({ x: startStub.x, y: midY });
      points.push({ x: endStub.x, y: midY });
    } else {
      // Horizontal routing
      const midX = (startStub.x + endStub.x) / 2 + (margins.center || 0);

      points.push({ x: midX, y: startStub.y });
      points.push({ x: midX, y: endStub.y });
    }

    points.push(endStub);
    points.push(p2);

    // Build SVG path
    let svgPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      svgPath += ` L ${points[i].x} ${points[i].y}`;
    }

    return { svgPath, points };
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

    return {
      svgPath,
      points: [p1, cp1, cp2, p2],
    };
  }
}
