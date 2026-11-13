import { Point, CircuitWire } from "../types";

export class WireIntersectionResolver {
  /**
   * Resolves all intersection jump points for wires in the schematic.
   *
   * Layer Rule:
   * A wire at a higher index in the `wires` array is considered to be on an upper layer.
   * Only the upper wire generates an arc jump over the lower wire.
   * The lower wire stays flat.
   *
   * Strict Exceptions (NO arc jump):
   * 1. Wires that branch from each other (`wireA.toWireId === wireB.id` or vice versa).
   * 2. Points on or near (<= 15px) any junction/tap dot (`wire.tapPoint`).
   * 3. Points close to wire endpoints / component terminals (<= 12px).
   *
   * @param wires Array of wires in layer order (index 0 is bottom layer, last index is top layer).
   * @param wirePointsMap Map of wireId to its routed corner points.
   * @returns Map of wireId to array of crossing points where this wire should jump.
   */
  static resolveAllCrossings(
    wires: CircuitWire[],
    wirePointsMap: Map<string | number, Point[]>
  ): Map<string | number, Point[]> {
    const crossingsMap = new Map<string | number, Point[]>();
    if (wires.length < 2) return crossingsMap;

    // Collect all tap points in the circuit to exclude any jump arc near a junction dot
    const allTapPoints: Point[] = [];
    for (const w of wires) {
      if (w.tapPoint) {
        allTapPoints.push(w.tapPoint);
      }
    }

    // Precompute AABB bounding box for each wire to fast-reject non-overlapping wire pairs
    const wireBoxes = new Map<string | number, { minX: number; maxX: number; minY: number; maxY: number }>();
    for (const [id, pts] of wirePointsMap.entries()) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      wireBoxes.set(id, { minX, maxX, minY, maxY });
    }

    // Compare each wire against all wires below it in the layer order
    for (let i = 1; i < wires.length; i++) {
      const upperWire = wires[i];
      const upperPoints = wirePointsMap.get(upperWire.id);
      if (!upperPoints || upperPoints.length < 2) continue;

      const upperBox = wireBoxes.get(upperWire.id);
      if (!upperBox) continue;

      const upperCrossings: Point[] = [];

      for (let j = 0; j < i; j++) {
        const lowerWire = wires[j];

        // Exception 1: Direct tap connection between these two wires
        if (upperWire.toWireId === lowerWire.id || lowerWire.toWireId === upperWire.id) {
          continue;
        }

        const lowerBox = wireBoxes.get(lowerWire.id);
        if (!lowerBox) continue;

        // Fast AABB rejection: if bounding boxes don't intersect, wires cannot cross
        if (
          upperBox.maxX < lowerBox.minX ||
          upperBox.minX > lowerBox.maxX ||
          upperBox.maxY < lowerBox.minY ||
          upperBox.minY > lowerBox.maxY
        ) {
          continue;
        }

        const lowerPoints = wirePointsMap.get(lowerWire.id);
        if (!lowerPoints || lowerPoints.length < 2) continue;

        // Find intersections between upperWire and lowerWire
        const found = this.findSegmentIntersections(
          upperPoints,
          lowerPoints,
          allTapPoints
        );

        for (const pt of found) {
          // Avoid duplicate crossings that are within 6px of each other
          const isDuplicate = upperCrossings.some(
            (existing) => Math.hypot(existing.x - pt.x, existing.y - pt.y) < 6
          );
          if (!isDuplicate) {
            upperCrossings.push(pt);
          }
        }
      }

      if (upperCrossings.length > 0) {
        crossingsMap.set(upperWire.id, upperCrossings);
      }
    }

    return crossingsMap;
  }

  /**
   * Finds intersections where segments of wire A cross segments of wire B orthogonally.
   */
  static findSegmentIntersections(
    pointsA: Point[],
    pointsB: Point[],
    excludedTapPoints: Point[] = []
  ): Point[] {
    const results: Point[] = [];
    const EPS = 8; // Margin from segment endpoints to avoid corners/terminals

    for (let a = 0; a < pointsA.length - 1; a++) {
      const a1 = pointsA[a];
      const a2 = pointsA[a + 1];
      const isAHoriz = Math.abs(a1.y - a2.y) <= 1;
      const isAVert = Math.abs(a1.x - a2.x) <= 1;

      for (let b = 0; b < pointsB.length - 1; b++) {
        const b1 = pointsB[b];
        const b2 = pointsB[b + 1];
        const isBHoriz = Math.abs(b1.y - b2.y) <= 1;
        const isBVert = Math.abs(b1.x - b2.x) <= 1;

        let ix = 0;
        let iy = 0;
        let valid = false;

        // Case 1: A is horizontal and B is vertical
        if (isAHoriz && isBVert) {
          ix = b1.x;
          iy = a1.y;

          const aMinX = Math.min(a1.x, a2.x);
          const aMaxX = Math.max(a1.x, a2.x);
          const bMinY = Math.min(b1.y, b2.y);
          const bMaxY = Math.max(b1.y, b2.y);

          if (
            ix > aMinX + EPS &&
            ix < aMaxX - EPS &&
            iy > bMinY + EPS &&
            iy < bMaxY - EPS
          ) {
            valid = true;
          }
        }
        // Case 2: A is vertical and B is horizontal
        else if (isAVert && isBHoriz) {
          ix = a1.x;
          iy = b1.y;

          const aMinY = Math.min(a1.y, a2.y);
          const aMaxY = Math.max(a1.y, a2.y);
          const bMinX = Math.min(b1.x, b2.x);
          const bMaxX = Math.max(b1.x, b2.x);

          if (
            iy > aMinY + EPS &&
            iy < aMaxY - EPS &&
            ix > bMinX + EPS &&
            ix < bMaxX - EPS
          ) {
            valid = true;
          }
        }

        if (valid) {
          const pt = { x: ix, y: iy };

          // Exception 2: Exclude if crossing is near ANY tap junction dot in schematic
          const nearTapDot = excludedTapPoints.some(
            (tp) => Math.hypot(tp.x - pt.x, tp.y - pt.y) <= 15
          );
          if (nearTapDot) continue;

          // Exception 3: Exclude if crossing is too close to wire terminals
          const nearAStart = Math.hypot(pointsA[0].x - pt.x, pointsA[0].y - pt.y) <= 12;
          const nearAEnd =
            Math.hypot(
              pointsA[pointsA.length - 1].x - pt.x,
              pointsA[pointsA.length - 1].y - pt.y
            ) <= 12;
          const nearBStart = Math.hypot(pointsB[0].x - pt.x, pointsB[0].y - pt.y) <= 12;
          const nearBEnd =
            Math.hypot(
              pointsB[pointsB.length - 1].x - pt.x,
              pointsB[pointsB.length - 1].y - pt.y
            ) <= 12;

          if (nearAStart || nearAEnd || nearBStart || nearBEnd) continue;

          results.push(pt);
        }
      }
    }

    return results;
  }

  /**
   * Generates an SVG path incorporating semi-circular bridge arcs over crossing points.
   * Radius R = 6px gives a clean, professional electrical schematic appearance.
   *
   * @param points Orthogonal wire corner points [p0, p1, p2, ...]
   * @param crossings List of intersection points where this wire should jump
   * @returns SVG path string with bridge arcs
   */
  static injectArcJumps(points: Point[], crossings: Point[]): string {
    if (points.length < 2) return "";
    if (!crossings || crossings.length === 0) {
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    }

    const R = 6;
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const pStart = points[i];
      const pEnd = points[i + 1];

      const isHoriz = Math.abs(pStart.y - pEnd.y) <= 1;
      const isVert = Math.abs(pStart.x - pEnd.x) <= 1;

      if (isHoriz) {
        const segY = pStart.y;
        const xMin = Math.min(pStart.x, pEnd.x);
        const xMax = Math.max(pStart.x, pEnd.x);

        // Find all crossings on this horizontal segment
        const segCrossings = crossings.filter(
          (c) => Math.abs(c.y - segY) <= 1 && c.x > xMin + R + 2 && c.x < xMax - R - 2
        );

        if (pStart.x < pEnd.x) {
          // Left to Right: sort ascending by x
          segCrossings.sort((a, b) => a.x - b.x);

          let currentX = pStart.x;
          for (const c of segCrossings) {
            if (c.x - R <= currentX) continue;
            d += ` L ${c.x - R} ${segY}`;
            // Clockwise arc arching upward in SVG coords
            d += ` A ${R} ${R} 0 0 1 ${c.x + R} ${segY}`;
            currentX = c.x + R;
          }
        } else {
          // Right to Left: sort descending by x
          segCrossings.sort((a, b) => b.x - a.x);

          let currentX = pStart.x;
          for (const c of segCrossings) {
            if (c.x + R >= currentX) continue;
            d += ` L ${c.x + R} ${segY}`;
            // Counter-clockwise arc arching upward in SVG coords
            d += ` A ${R} ${R} 0 0 0 ${c.x - R} ${segY}`;
            currentX = c.x - R;
          }
        }

        d += ` L ${pEnd.x} ${pEnd.y}`;
      } else if (isVert) {
        const segX = pStart.x;
        const yMin = Math.min(pStart.y, pEnd.y);
        const yMax = Math.max(pStart.y, pEnd.y);

        // Find all crossings on this vertical segment
        const segCrossings = crossings.filter(
          (c) => Math.abs(c.x - segX) <= 1 && c.y > yMin + R + 2 && c.y < yMax - R - 2
        );

        if (pStart.y < pEnd.y) {
          // Top to Bottom: sort ascending by y
          segCrossings.sort((a, b) => a.y - b.y);

          let currentY = pStart.y;
          for (const c of segCrossings) {
            if (c.y - R <= currentY) continue;
            d += ` L ${segX} ${c.y - R}`;
            // Clockwise arc arching to the right (+x)
            d += ` A ${R} ${R} 0 0 1 ${segX} ${c.y + R}`;
            currentY = c.y + R;
          }
        } else {
          // Bottom to Top: sort descending by y
          segCrossings.sort((a, b) => b.y - a.y);

          let currentY = pStart.y;
          for (const c of segCrossings) {
            if (c.y + R >= currentY) continue;
            d += ` L ${segX} ${c.y + R}`;
            // Counter-clockwise arc arching to the right (+x)
            d += ` A ${R} ${R} 0 0 0 ${segX} ${c.y - R}`;
            currentY = c.y - R;
          }
        }

        d += ` L ${pEnd.x} ${pEnd.y}`;
      } else {
        // Non-orthogonal fallback
        d += ` L ${pEnd.x} ${pEnd.y}`;
      }
    }

    return d;
  }
}
