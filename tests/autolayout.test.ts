import { describe, it, expect } from "vitest";
import { AutoLayoutEngine } from "../src/engine/layout/AutoLayoutEngine";
import { CircuitNode, CircuitWire } from "../src/engine/types";
import { SimulationEngine } from "../src/engine/SimulationEngine";

describe("AutoLayoutEngine", () => {
  it("should organize a simple circuit into industrial ladder diagram (live left, neutral right, horizontal rungs)", () => {
    const nodes: CircuitNode[] = [
      {
        id: "source-1",
        componentId: "sourceL1",
        name: "L1 Source",
        category: "sources",
        tag: "L1",
        comment: null,
        position: { x: 93, y: 412 },
        rotation: 0,
        frameIndex: 0,
      },
      {
        id: "fuse-1",
        componentId: "fuse1p",
        name: "Fuse",
        category: "protections",
        tag: "-F1",
        comment: null,
        position: { x: 504, y: 111 },
        rotation: 0,
        frameIndex: 0,
      },
      {
        id: "sw-1",
        componentId: "switchNO",
        name: "Switch",
        category: "switches",
        tag: "-S1",
        comment: null,
        position: { x: 12, y: 99 },
        rotation: 0,
        frameIndex: 0,
      },
      {
        id: "coil-1",
        componentId: "coil",
        name: "Coil",
        category: "coils",
        tag: "-KM1",
        comment: null,
        position: { x: 800, y: 300 },
        rotation: 0,
        frameIndex: 0,
      },
      {
        id: "source-n",
        componentId: "sourceN",
        name: "Neutral",
        category: "sources",
        tag: "N",
        comment: null,
        position: { x: 33, y: 650 },
        rotation: 0,
        frameIndex: 0,
      },
    ];

    const wires: CircuitWire[] = [
      { id: "w1", fromNodeId: "source-1", fromPortId: 0, toNodeId: "fuse-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w2", fromNodeId: "fuse-1", fromPortId: 1, toNodeId: "sw-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w3", fromNodeId: "sw-1", fromPortId: 1, toNodeId: "coil-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w4", fromNodeId: "coil-1", fromPortId: 1, toNodeId: "source-n", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
    ];

    const result = AutoLayoutEngine.layout(nodes, wires);

    // 1. All positions must be snapped to 30px grid
    for (const n of result.nodes) {
      expect(n.position.x % 30).toBe(0);
      expect(n.position.y % 30).toBe(0);
    }

    const srcNode = result.nodes.find((n) => n.id === "source-1");
    const protNode = result.nodes.find((n) => n.id === "fuse-1");
    const ctrlNode = result.nodes.find((n) => n.id === "sw-1");
    const loadNode = result.nodes.find((n) => n.id === "coil-1");
    const nNode = result.nodes.find((n) => n.id === "source-n");

    // 2. Ladder Diagram Topology:
    // Live source is top left, Neutral source is top right
    expect(srcNode!.position.x).toBeLessThan(nNode!.position.x);
    expect(srcNode!.position.y).toBe(60);
    expect(nNode!.position.y).toBe(60);

    // Controls (switches, protections) are on the left side of the rung
    expect(ctrlNode!.position.x).toBeLessThan(loadNode!.position.x);
    expect(protNode!.position.x).toBeLessThan(loadNode!.position.x);

    // Actuators (Coil) is on the right side of the rung (near neutral rail)
    expect(loadNode!.position.x).toBeGreaterThan(600);

    // 3. Components in horizontal rungs are oriented horizontally (rotation 1 = 90 deg)
    expect(ctrlNode!.rotation).toBe(1);
    expect(loadNode!.rotation).toBe(1);

    // 4. Verify electrical simulation remains functional after auto-layout
    const simResult = SimulationEngine.step(result.nodes, result.wires);
    expect(simResult.shortCircuit).toBe(false);
  });
});
