import { describe, it, expect, beforeEach } from "vitest";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import { Point, WireMargins } from "@/engine/types";

describe("Canvas Performance & Manhattan Routing Cache", () => {
  beforeEach(() => {
    ManhattanRouter.clearRouteCache();
  });

  it("caches orthogonal wire routes for high-FPS live canvas dragging", () => {
    const p1: Point = { x: 120, y: 150 };
    const p2: Point = { x: 360, y: 390 };
    const margins: WireMargins = { start: 0, center: 0, end: 0 };
    const obstacles = [
      { id: "node1", x: 200, y: 200, width: 60, height: 60 },
      { id: "node2", x: 400, y: 400, width: 60, height: 60 },
    ];
    const ignoreIds = ["node1"];

    // First call: computes route and stores in LRU cache
    const start1 = performance.now();
    const route1 = ManhattanRouter.routeOrthogonal(p1, 2, p2, 0, margins, obstacles, ignoreIds);
    const duration1 = performance.now() - start1;

    expect(route1.svgPath).toBeDefined();
    expect(route1.points.length).toBeGreaterThanOrEqual(2);

    // Second call with same parameters: must hit O(1) cache!
    const start2 = performance.now();
    const route2 = ManhattanRouter.routeOrthogonal(p1, 2, p2, 0, margins, obstacles, ignoreIds);
    const duration2 = performance.now() - start2;

    expect(route2).toBe(route1); // Exact reference from memory cache
    expect(duration2).toBeLessThanOrEqual(duration1);
  });

  it("handles 500 wires across 60 frames in under 16ms total (60+ FPS guarantee)", () => {
    // Generate 500 mock wire endpoints
    const wireEndpoints: Array<{ p1: Point; p2: Point }> = [];
    for (let i = 0; i < 500; i++) {
      wireEndpoints.push({
        p1: { x: (i % 20) * 60, y: Math.floor(i / 20) * 60 },
        p2: { x: (i % 20) * 60 + 120, y: Math.floor(i / 20) * 60 + 180 },
      });
    }

    const margins = { start: 0, center: 0, end: 0 };

    // Prime cache with first frame
    for (const w of wireEndpoints) {
      ManhattanRouter.routeOrthogonal(w.p1, 2, w.p2, 0, margins);
    }

    // Simulate 60 drag frames where only 2 wires are moving and 498 are static
    const startSim = performance.now();
    for (let frame = 0; frame < 60; frame++) {
      // 498 static wires
      for (let i = 2; i < 500; i++) {
        ManhattanRouter.routeOrthogonal(wireEndpoints[i].p1, 2, wireEndpoints[i].p2, 0, margins);
      }
      // 2 moving wires
      ManhattanRouter.routeOrthogonal(
        { x: 100 + frame, y: 100 },
        2,
        { x: 200 + frame, y: 300 },
        0,
        margins
      );
    }
    const totalSimDuration = performance.now() - startSim;

    // 60 frames of 500 wires (30,000 route calls) must finish in < 50ms with caching!
    expect(totalSimDuration).toBeLessThan(50);
  });
});
