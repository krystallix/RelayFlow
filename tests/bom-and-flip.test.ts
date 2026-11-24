import { describe, it, expect } from "vitest";
import { SimulationEngine } from "../src/engine/SimulationEngine";
import {
  getDetailedBomGroups,
  getCircuitComponentSummary,
} from "../src/utils/circuitSummary";
import { CircuitNode } from "../src/engine/types";

function makeNode(partial: Partial<CircuitNode> & { id: string; componentId: string; category: string; name: string }): CircuitNode {
  return {
    tag: null,
    comment: null,
    position: { x: 0, y: 0 },
    rotation: 0,
    frameIndex: 0,
    ...partial,
  };
}

describe("SimulationEngine.getTransformedPort with flipX and flipY", () => {
  it("flips horizontal (flipX) correctly at rotation 0", () => {
    const res = SimulationEngine.getTransformedPort({ x: 100, y: 200 }, 30, -20, 1, 0, true, false);
    expect(res).toEqual({ x: 70, y: 180, direction: 3 });
  });

  it("flips vertical (flipY) correctly at rotation 0", () => {
    const res = SimulationEngine.getTransformedPort({ x: 100, y: 200 }, 30, -20, 0, 0, false, true);
    expect(res).toEqual({ x: 130, y: 220, direction: 2 });
  });

  it("applies rotation first then screen-space flipX", () => {
    // dx=0, dy=-60, dir=0 (Top) -> rotate 90deg CW => (60, 0), dir=1 (Right) -> flipX => (-60, 0), dir=3 (Left)
    const res = SimulationEngine.getTransformedPort({ x: 100, y: 200 }, 0, -60, 0, 1, true, false);
    expect(res).toEqual({ x: 40, y: 200, direction: 3 });
  });

  it("applies rotation first then screen-space flipY", () => {
    // dx=60, dy=0, dir=1 (Right) -> rotate 90deg CW => (0, 60), dir=2 (Bottom) -> flipY => (0, -60), dir=0 (Top)
    const res = SimulationEngine.getTransformedPort({ x: 100, y: 200 }, 60, 0, 1, 1, false, true);
    expect(res).toEqual({ x: 100, y: 140, direction: 0 });
  });
});

describe("BOM Calculation & Detailed Relay / Contactor Breakdown", () => {
  it("counts power contactor + coil + aux contacts with same tag as 1 Contactor (not Relay)", () => {
    const nodes: CircuitNode[] = [
      makeNode({ id: "1", componentId: "coil", category: "coils", name: "Coil", tag: "KM1" }),
      makeNode({ id: "2", componentId: "contactor3p", category: "contactors", name: "Contactor 3P", tag: "KM1" }),
      makeNode({ id: "3", componentId: "contactNO", category: "auxiliaries", name: "Contact NO", tag: "KM1" }),
      makeNode({ id: "4", componentId: "contactNC", category: "auxiliaries", name: "Contact NC", tag: "KM1" }),
    ];

    const groups = getDetailedBomGroups(nodes);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe("Contactor");
    expect(groups[0].total).toBe(1);
    expect(groups[0].variants[0].label).toBe("Contactor 3P + 2 Aux");
    expect(groups[0].variants[0].description).toBe("3P Main · 1 NO 1 NC");
    expect(groups[0].variants[0].warning).toBeUndefined();
  });

  it("does NOT misclassify auxiliary delay contacts 'for Contactors' as Power Contactors", () => {
    const nodes: CircuitNode[] = [
      makeNode({ id: "1", componentId: "coilDelayOn", category: "coils", name: "On-Delay Relay Coil", tag: "KT1" }),
      makeNode({
        id: "2",
        componentId: "contactNODelayOn",
        category: "auxiliaries",
        name: "On-Delay Contact NO for Contactors",
        tag: "KT1",
      }),
    ];

    const summary = getCircuitComponentSummary(nodes);
    expect(summary).toEqual([["Timer", 1]]);
  });

  it("groups relay coil + 2 aux contacts (1 NO, 1 NC) as 'Relay 2 Contact' with '1 NO 1 NC' description", () => {
    const nodes: CircuitNode[] = [
      makeNode({ id: "1", componentId: "coil", category: "coils", name: "Coil", tag: "K1" }),
      makeNode({ id: "2", componentId: "contactNO", category: "auxiliaries", name: "Contact NO", tag: "K1" }),
      makeNode({ id: "3", componentId: "contactNC", category: "auxiliaries", name: "Contact NC", tag: "K1" }),
      // Second identical relay K2
      makeNode({ id: "4", componentId: "coil", category: "coils", name: "Coil", tag: "K2" }),
      makeNode({ id: "5", componentId: "contactNONC", category: "auxiliaries", name: "Contact NCNO", tag: "K2" }),
    ];

    const groups = getDetailedBomGroups(nodes);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe("Relay");
    expect(groups[0].total).toBe(2);
    expect(groups[0].variants).toHaveLength(1);
    expect(groups[0].variants[0].label).toBe("Relay 2 Contact");
    expect(groups[0].variants[0].description).toBe("1 NO 1 NC");
    expect(groups[0].variants[0].quantity).toBe(2);
    expect(groups[0].variants[0].tags).toEqual(["K1", "K2"]);
  });

  it("flags power contactor without coil with Missing Coil warning and does not inflate Relay count for untagged aux", () => {
    const nodes: CircuitNode[] = [
      makeNode({ id: "1", componentId: "contactor3p", category: "contactors", name: "Contactor 3P", tag: "KM2" }),
      makeNode({ id: "2", componentId: "contactNO", category: "auxiliaries", name: "Contact NO", tag: null }),
    ];

    const groups = getDetailedBomGroups(nodes);
    const contactorGroup = groups.find((g) => g.type === "Contactor");
    const relayGroup = groups.find((g) => g.type === "Relay");
    const untaggedGroup = groups.find((g) => g.type === "Auxiliary Contact (Untagged)");

    expect(contactorGroup?.total).toBe(1);
    expect(contactorGroup?.variants[0].warning).toBe("Missing Coil");
    expect(relayGroup).toBeUndefined();
    expect(untaggedGroup?.total).toBe(1);
  });
});
