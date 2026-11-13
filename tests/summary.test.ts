import { describe, it, expect } from "vitest";
import { getCircuitComponentSummary } from "@/utils/circuitSummary";
import { CircuitNode } from "@/engine/types";

function createMockNode(partial: Partial<CircuitNode>): CircuitNode {
  return {
    id: String(Math.random()),
    componentId: "coil",
    name: "Coil",
    category: "coils",
    tag: null,
    comment: null,
    position: { x: 0, y: 0 },
    rotation: 0,
    frameIndex: 0,
    ...partial,
  };
}

describe("getCircuitComponentSummary", () => {
  it("groups coupled contactor coil, contacts, and power poles with same tag into 1 Contactor", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ componentId: "contactor3p", name: "Contactor 3P", category: "contactors", tag: "-KM1" }),
      createMockNode({ componentId: "coil", name: "Coil", category: "coils", tag: "-KM1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-KM1" }),
      createMockNode({ componentId: "contactNC", name: "Contact NC", category: "auxiliaries", tag: "-KM1" }),
    ];

    const summary = getCircuitComponentSummary(nodes);
    expect(summary).toEqual([["Contactor", 1]]);
  });

  it("groups coupled thermal overload element and auxiliary contacts into 1 Thermal Overload", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ componentId: "overload3p", name: "Overload Relay 3P", category: "protections", tag: "-F1" }),
      createMockNode({ componentId: "contactNC", name: "Contact NC", category: "auxiliaries", tag: "-F1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-F1" }),
    ];

    const summary = getCircuitComponentSummary(nodes);
    expect(summary).toEqual([["Thermal Overload", 1]]);
  });

  it("groups coupled timer coil and delay contacts into 1 Timer", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ componentId: "coilDelayOn", name: "On-Delay Relay Coil", category: "coils", tag: "-KT1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-KT1" }),
    ];

    const summary = getCircuitComponentSummary(nodes);
    expect(summary).toEqual([["Timer", 1]]);
  });

  it("excludes virtual routing points (junctionDot, text, arrows)", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ componentId: "lamp", name: "Light", category: "loads", tag: "-H1" }),
      createMockNode({ componentId: "junctionDot", name: "Connection Point", category: "others", tag: null }),
      createMockNode({ componentId: "junction3p", name: "Connection 3P", category: "others", tag: null }),
      createMockNode({ componentId: "text", name: "Text", category: "others", tag: null }),
      createMockNode({ componentId: "arrowDestination", name: "Destination Arrow", category: "others", tag: null }),
    ];

    const summary = getCircuitComponentSummary(nodes);
    expect(summary).toEqual([["Lamp", 1]]);
  });

  it("accurately summarizes a standard DOL starter circuit with multiple components", () => {
    const nodes: CircuitNode[] = [
      // KM1 Contactor & Auxiliary
      createMockNode({ componentId: "contactor3p", name: "Contactor 3P", category: "contactors", tag: "-KM1" }),
      createMockNode({ componentId: "coil", name: "Coil", category: "coils", tag: "-KM1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-KM1" }),
      // F1 Thermal Overload & Auxiliary
      createMockNode({ componentId: "overload3p", name: "Overload Relay 3P", category: "protections", tag: "-F1" }),
      createMockNode({ componentId: "contactNC", name: "Contact NC", category: "auxiliaries", tag: "-F1" }),
      // Timer KT1
      createMockNode({ componentId: "coilDelayOn", name: "On-Delay Relay Coil", category: "coils", tag: "-KT1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-KT1" }),
      // Control Relay K1
      createMockNode({ componentId: "coil", name: "Coil", category: "coils", tag: "-K1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-K1" }),
      // Protections
      createMockNode({ componentId: "breaker3p", name: "Circuit Breaker 3P", category: "protections", tag: "-Q1" }),
      // Motors
      createMockNode({ componentId: "motor3ph", name: "Three-Phase Motor", category: "motors", tag: "-M1" }),
      createMockNode({ componentId: "motorTwoSpeeds", name: "Three-Phase Motor Two speeds", category: "motors", tag: "-M2" }),
      // Buttons
      createMockNode({ componentId: "buttonNO", name: "Push Button NO", category: "switches", tag: "-S1" }),
      createMockNode({ componentId: "buttonNC", name: "Push Button NC", category: "switches", tag: "-S2" }),
      // Lamps
      createMockNode({ componentId: "lamp", name: "Light", category: "loads", tag: "-H1" }),
      createMockNode({ componentId: "lamp", name: "Light", category: "loads", tag: "-H2" }),
    ];

    const summary = getCircuitComponentSummary(nodes);
    const summaryMap = Object.fromEntries(summary);

    expect(summaryMap).toEqual({
      "Contactor": 1,
      "Thermal Overload": 1,
      "Timer": 1,
      "Relay": 1,
      "MCB": 1,
      "Motor 3 Phase": 1,
      "Motor 2 Phase": 1,
      "Push Button": 2,
      "Lamp": 2,
    });
  });
});
