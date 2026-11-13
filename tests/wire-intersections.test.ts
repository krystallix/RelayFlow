import { describe, it, expect } from "vitest";
import { WireIntersectionResolver } from "@/engine/router/WireIntersectionResolver";
import { CircuitWire, Point } from "@/engine/types";

describe("WireIntersectionResolver", () => {
  it("generates an arc jump on the upper layer wire when it crosses a lower wire", () => {
    // Wire 1 (lower layer, horizontal along y=100 from x=0 to x=200)
    const wire1: CircuitWire = {
      id: "wire-1",
      fromNodeId: "node-1",
      fromPortId: 0,
      toNodeId: "node-2",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };
    const points1: Point[] = [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
    ];

    // Wire 2 (upper layer, vertical along x=100 from y=0 to y=200)
    const wire2: CircuitWire = {
      id: "wire-2",
      fromNodeId: "node-3",
      fromPortId: 0,
      toNodeId: "node-4",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };
    const points2: Point[] = [
      { x: 100, y: 0 },
      { x: 100, y: 200 },
    ];

    const wires = [wire1, wire2];
    const pointsMap = new Map<string | number, Point[]>([
      ["wire-1", points1],
      ["wire-2", points2],
    ]);

    const crossings = WireIntersectionResolver.resolveAllCrossings(wires, pointsMap);

    // Wire 1 (bottom layer) has NO crossings / stays flat
    expect(crossings.has("wire-1")).toBe(false);

    // Wire 2 (top layer) has crossing at { x: 100, y: 100 }
    expect(crossings.has("wire-2")).toBe(true);
    const wire2Crossings = crossings.get("wire-2")!;
    expect(wire2Crossings).toHaveLength(1);
    expect(wire2Crossings[0]).toEqual({ x: 100, y: 100 });

    // Injected arc path contains SVG arc "A 6 6"
    const svgPath = WireIntersectionResolver.injectArcJumps(points2, wire2Crossings);
    expect(svgPath).toContain("A 6 6");
    expect(svgPath).toContain("100 94"); // 100 - 6
    expect(svgPath).toContain("100 106"); // 100 + 6
  });

  it("strictly excludes tap wires from having jump arcs", () => {
    // Wire 1 (host wire)
    const wire1: CircuitWire = {
      id: "wire-host",
      fromNodeId: "node-1",
      fromPortId: 0,
      toNodeId: "node-2",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };
    const points1: Point[] = [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
    ];

    // Wire 2 (tap branch wire connecting directly to Wire 1 at middle)
    const wire2: CircuitWire = {
      id: "wire-tap",
      fromNodeId: "node-3",
      fromPortId: 0,
      toNodeId: "",
      toWireId: "wire-host",
      toPortId: -1,
      tapPoint: { x: 100, y: 100 },
      margins: { start: 0, center: 0, end: 0 },
    };
    const points2: Point[] = [
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];

    const wires = [wire1, wire2];
    const pointsMap = new Map<string | number, Point[]>([
      ["wire-host", points1],
      ["wire-tap", points2],
    ]);

    const crossings = WireIntersectionResolver.resolveAllCrossings(wires, pointsMap);

    // Neither wire should have any crossing arc
    expect(crossings.has("wire-host")).toBe(false);
    expect(crossings.has("wire-tap")).toBe(false);
  });

  it("excludes intersections that occur near an existing tap junction dot", () => {
    // Wire 1 (host wire)
    const wire1: CircuitWire = {
      id: "wire-1",
      fromNodeId: "node-1",
      fromPortId: 0,
      toNodeId: "node-2",
      toPortId: 0,
      tapPoint: { x: 100, y: 100 }, // Tap dot at (100, 100)
      margins: { start: 0, center: 0, end: 0 },
    };
    const points1: Point[] = [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
    ];

    // Wire 2 (independent wire passing right across that same tap dot)
    const wire2: CircuitWire = {
      id: "wire-2",
      fromNodeId: "node-3",
      fromPortId: 0,
      toNodeId: "node-4",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };
    const points2: Point[] = [
      { x: 100, y: 0 },
      { x: 100, y: 200 },
    ];

    const wires = [wire1, wire2];
    const pointsMap = new Map<string | number, Point[]>([
      ["wire-1", points1],
      ["wire-2", points2],
    ]);

    const crossings = WireIntersectionResolver.resolveAllCrossings(wires, pointsMap);

    // No jump arc on junction dot area
    expect(crossings.has("wire-2")).toBe(false);
  });

  it("reverses who jumps when layer order changes", () => {
    const wireA: CircuitWire = {
      id: "wire-A",
      fromNodeId: "node-1",
      fromPortId: 0,
      toNodeId: "node-2",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };
    const pointsA: Point[] = [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
    ];

    const wireB: CircuitWire = {
      id: "wire-B",
      fromNodeId: "node-3",
      fromPortId: 0,
      toNodeId: "node-4",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };
    const pointsB: Point[] = [
      { x: 100, y: 0 },
      { x: 100, y: 200 },
    ];

    const pointsMap = new Map<string | number, Point[]>([
      ["wire-A", pointsA],
      ["wire-B", pointsB],
    ]);

    // Order 1: [A, B] -> B is on top, B jumps over A
    const res1 = WireIntersectionResolver.resolveAllCrossings([wireA, wireB], pointsMap);
    expect(res1.has("wire-A")).toBe(false);
    expect(res1.has("wire-B")).toBe(true);

    // Order 2: [B, A] -> A is on top (Bring to Front), A jumps over B
    const res2 = WireIntersectionResolver.resolveAllCrossings([wireB, wireA], pointsMap);
    expect(res2.has("wire-B")).toBe(false);
    expect(res2.has("wire-A")).toBe(true);
  });
});
