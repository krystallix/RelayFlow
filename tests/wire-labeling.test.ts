import { describe, it, expect } from "vitest";
import { WireNetResolver } from "../src/engine/router/WireNetResolver";
import { CircuitNode, CircuitWire } from "../src/engine/types";

describe("WireNetResolver — Industrial Equipotential Wire Numbering", () => {
  it("should assign distinct numbers to wires separated by components (Switch NC)", () => {
    // 3 components in series: Power -> Switch NC -> Lamp -> Ground
    // Wire 1: Power(port 0) -> Switch(port 0)
    // Wire 2: Switch(port 1) -> Lamp(port 0)
    // Wire 3: Lamp(port 1) -> Ground(port 0)

    const wires: CircuitWire[] = [
      {
        id: "w1",
        fromNodeId: "power",
        fromPortId: 0,
        toNodeId: "switch-nc",
        toPortId: 0,
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: "w2",
        fromNodeId: "switch-nc",
        fromPortId: 1,
        toNodeId: "lamp",
        toPortId: 0,
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: "w3",
        fromNodeId: "lamp",
        fromPortId: 1,
        toNodeId: "ground",
        toPortId: 0,
        margins: { start: 0, center: 0, end: 0 },
      },
    ];

    const nodes: CircuitNode[] = [
      { id: "power", name: "Power", category: "sources", componentId: "sourcePlus", position: { x: 200, y: 50 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
      { id: "switch-nc", name: "Switch NC", category: "switches", componentId: "switchNC", position: { x: 200, y: 150 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
      { id: "lamp", name: "Lamp", category: "loads", componentId: "lamp", position: { x: 200, y: 250 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
      { id: "ground", name: "Ground", category: "sources", componentId: "sourceNegative", position: { x: 200, y: 350 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
    ];

    const nets = WireNetResolver.resolveWireNets(wires, nodes);

    expect(nets.get("w1")?.label).toBe("1");
    expect(nets.get("w2")?.label).toBe("2");
    expect(nets.get("w3")?.label).toBe("3");
  });

  it("should assign the SAME number to wires branched directly (wire-to-wire tap)", () => {
    // Main wire: switch -> lamp1
    // Tap wire: branches from main wire to lamp2
    const wires: CircuitWire[] = [
      {
        id: "w-main",
        fromNodeId: "switch",
        fromPortId: 1,
        toNodeId: "lamp1",
        toPortId: 0,
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: "w-branch",
        fromNodeId: "lamp2",
        fromPortId: 0,
        toNodeId: "switch",
        toPortId: 1,
        toWireId: "w-main",
        tapPoint: { x: 250, y: 200 },
        margins: { start: 0, center: 0, end: 0 },
      },
    ];

    const nets = WireNetResolver.resolveWireNets(wires);

    expect(nets.get("w-main")?.label).toBeDefined();
    expect(nets.get("w-branch")?.label).toBeDefined();
    // Both wires must have the EXACT SAME label
    expect(nets.get("w-main")?.label).toBe(nets.get("w-branch")?.label);
  });

  it("should support Mazhab 2 Gap Recycling when a wire is deleted", () => {
    // Given wires with labels 1, 2, 4 (wire 3 was previously deleted):
    // A new wire added must reuse gap number 3!
    const wires: CircuitWire[] = [
      {
        id: "w1",
        fromNodeId: "n1",
        fromPortId: 0,
        toNodeId: "n2",
        toPortId: 0,
        label: "1",
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: "w2",
        fromNodeId: "n3",
        fromPortId: 0,
        toNodeId: "n4",
        toPortId: 0,
        label: "2",
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: "w4",
        fromNodeId: "n7",
        fromPortId: 0,
        toNodeId: "n8",
        toPortId: 0,
        label: "4",
        margins: { start: 0, center: 0, end: 0 },
      },
      // New wire without label
      {
        id: "w-new",
        fromNodeId: "n5",
        fromPortId: 0,
        toNodeId: "n6",
        toPortId: 0,
        margins: { start: 0, center: 0, end: 0 },
      },
    ];

    const nets = WireNetResolver.resolveWireNets(wires);

    expect(nets.get("w1")?.label).toBe("1");
    expect(nets.get("w2")?.label).toBe("2");
    expect(nets.get("w4")?.label).toBe("4");
    // Recycles the gap: must be 3!
    expect(nets.get("w-new")?.label).toBe("3");
  });

  it("should renumber all wires sequentially from 1 when renumberAll is called", () => {
    // Wires with gaps and un-normalized labels
    const wires: CircuitWire[] = [
      {
        id: "w1",
        fromNodeId: "n1",
        fromPortId: 0,
        toNodeId: "n2",
        toPortId: 0,
        label: "10",
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: "w2",
        fromNodeId: "n3",
        fromPortId: 0,
        toNodeId: "n4",
        toPortId: 0,
        label: "25",
        margins: { start: 0, center: 0, end: 0 },
      },
    ];

    const nodes: CircuitNode[] = [
      { id: "n1", name: "Lamp 1", category: "loads", componentId: "lamp", position: { x: 100, y: 100 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
      { id: "n2", name: "Lamp 2", category: "loads", componentId: "lamp", position: { x: 100, y: 200 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
      { id: "n3", name: "Lamp 3", category: "loads", componentId: "lamp", position: { x: 100, y: 300 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
      { id: "n4", name: "Lamp 4", category: "loads", componentId: "lamp", position: { x: 100, y: 400 }, rotation: 0, frameIndex: 0, tag: null, comment: null },
    ];

    const renumbered = WireNetResolver.renumberAll(wires, nodes);

    expect(renumbered[0].label).toBe("1");
    expect(renumbered[1].label).toBe("2");
  });

  it("should place exactly 1 label at midpoint if the wire is short (< 80px)", () => {
    // Short vertical wire: 240 to 276 (length 36px < 80px)
    const shortPoints = [
      { x: 210, y: 240 },
      { x: 210, y: 276 },
    ];
    const positions = WireNetResolver.getOptimalLabelPositions(shortPoints);
    expect(positions.length).toBe(1);
    expect(positions[0].x).toBe(210);
    // Midpoint: (240 + 276) / 2 = 258
    expect(positions[0].y).toBe(258);
    expect(positions[0].orientation).toBe("vertical");
  });

  it("should place TWO labels near both terminals if the wire is long (>= 80px)", () => {
    // Long vertical wire: 100 to 220 (length 120px >= 80px)
    const longPoints = [
      { x: 210, y: 100 },
      { x: 210, y: 220 },
    ];
    const positions = WireNetResolver.getOptimalLabelPositions(longPoints);
    expect(positions.length).toBe(2);
    // Start terminal near: 100 + 18 = 118
    expect(positions[0].x).toBe(210);
    expect(positions[0].y).toBeCloseTo(118, 1);
    expect(positions[0].orientation).toBe("vertical");
    // End terminal near: 220 - 18 = 202
    expect(positions[1].x).toBe(210);
    expect(positions[1].y).toBeCloseTo(202, 1);
    expect(positions[1].orientation).toBe("vertical");
  });
});
