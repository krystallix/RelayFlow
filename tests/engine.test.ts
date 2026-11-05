import { describe, it, expect } from "vitest";
import { SimulationEngine } from "../src/engine/SimulationEngine";
import { ManhattanRouter } from "../src/engine/router/ManhattanRouter";
import { CircuitNode, CircuitWire } from "../src/engine/types";

describe("SimulationEngine Logic", () => {
  it("should energize coil and automatically close matching NO contact", () => {
    // 1. DC Power Sources (+24V, -24V)
    const nodePlus: CircuitNode = {
      id: 1,
      componentId: "sourcePlus",
      name: "Source +24V",
      category: "sources",
      tag: null,
      comment: "+24V",
      position: { x: 0, y: 0 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeMinus: CircuitNode = {
      id: 2,
      componentId: "sourceNegative",
      name: "Source -24V",
      category: "sources",
      tag: null,
      comment: "-24V",
      position: { x: 100, y: 0 },
      rotation: 0,
      frameIndex: 0,
    };

    // 2. Coil KM1 (Port 0: A1, Port 1: A2)
    const nodeCoil: CircuitNode = {
      id: 3,
      componentId: "coil",
      name: "Coil",
      category: "coils",
      tag: "-KM1",
      comment: null,
      position: { x: 50, y: 100 },
      rotation: 0,
      frameIndex: 0,
      isEnergized: false,
    };

    // 3. Auxiliary NO contact with same tag -KM1 (Port 0: 13, Port 1: 14)
    const nodeContactNO: CircuitNode = {
      id: 4,
      componentId: "contactNO",
      name: "Contact NO",
      category: "contacts",
      tag: "-KM1",
      comment: null,
      position: { x: 150, y: 100 },
      rotation: 0,
      frameIndex: 0, // 0 = open
    };

    // 4. Wires connecting +24V -> Coil A1, and -24V -> Coil A2
    const wires: CircuitWire[] = [
      {
        id: 101,
        fromNodeId: 1,
        fromPortId: 0,
        toNodeId: 3,
        toPortId: 0,
        margins: { start: 0, center: 0, end: 0 },
      },
      {
        id: 102,
        fromNodeId: 2,
        fromPortId: 0,
        toNodeId: 3,
        toPortId: 1,
        margins: { start: 0, center: 0, end: 0 },
      },
    ];

    const result = SimulationEngine.step([nodePlus, nodeMinus, nodeCoil, nodeContactNO], wires);

    expect(result.shortCircuit).toBe(false);

    // Verify coil is energized
    const coilResult = result.nodes.find((n) => n.id === 3);
    expect(coilResult?.isEnergized).toBe(true);
    expect(coilResult?.frameIndex).toBe(1);

    // Verify matching contact NO automatically closed!
    const contactResult = result.nodes.find((n) => n.id === 4);
    expect(contactResult?.frameIndex).toBe(1);
  });

  it("should detect short circuit when +24V meets -24V directly", () => {
    const nodePlus: CircuitNode = {
      id: 1,
      componentId: "sourcePlus",
      name: "Source +24V",
      category: "sources",
      tag: null,
      comment: "+24V",
      position: { x: 0, y: 0 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeMinus: CircuitNode = {
      id: 2,
      componentId: "sourceNegative",
      name: "Source -24V",
      category: "sources",
      tag: null,
      comment: "-24V",
      position: { x: 100, y: 0 },
      rotation: 0,
      frameIndex: 0,
    };

    // Direct wire from +24V to -24V without load!
    const wireDirect: CircuitWire = {
      id: 201,
      fromNodeId: 1,
      fromPortId: 0,
      toNodeId: 2,
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };

    const result = SimulationEngine.step([nodePlus, nodeMinus], [wireDirect]);

    expect(result.shortCircuit).toBe(true);
    expect(result.shortCircuitMessage).toContain("Short circuit detected");
  });

  it("should immediately cut off wire glow and potential downstream when switch opens", () => {
    const nodePlus: CircuitNode = {
      id: "source-plus",
      componentId: "sourcePlus",
      name: "Power Positive",
      category: "sources",
      tag: "+24V",
      comment: "+24V",
      position: { x: 210, y: 60 },
      rotation: 2,
      frameIndex: 0,
    };

    const nodeSwitch: CircuitNode = {
      id: "switch-1",
      componentId: "switchNO",
      name: "Switch NO",
      category: "switches",
      tag: "-S1",
      comment: "Power Switch",
      position: { x: 210, y: 180 },
      rotation: 0,
      frameIndex: 1, // CLOSED
      isClosed: true,
    };

    const nodeLamp: CircuitNode = {
      id: "lamp-1",
      componentId: "lamp",
      name: "Light",
      category: "loads",
      tag: "-H1",
      comment: "Lamp",
      position: { x: 210, y: 300 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeMinus: CircuitNode = {
      id: "source-minus",
      componentId: "sourceNegative",
      name: "Power Negative",
      category: "sources",
      tag: "-24V",
      comment: "-24V",
      position: { x: 210, y: 420 },
      rotation: 0,
      frameIndex: 0,
    };

    const wires: CircuitWire[] = [
      { id: "w1", fromNodeId: "source-plus", fromPortId: 0, toNodeId: "switch-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w2", fromNodeId: "switch-1", fromPortId: 1, toNodeId: "lamp-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w3", fromNodeId: "lamp-1", fromPortId: 1, toNodeId: "source-minus", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
    ];

    // 1. When switch is closed: w1, w2, w3 are hot and lamp is energized
    const closedResult = SimulationEngine.step([nodePlus, nodeSwitch, nodeLamp, nodeMinus], wires);
    expect(closedResult.wires.find((w) => w.id === "w1")?.isHot).toBe(true);
    expect(closedResult.wires.find((w) => w.id === "w2")?.isHot).toBe(true);
    expect(closedResult.wires.find((w) => w.id === "w3")?.isHot).toBe(true);
    expect(closedResult.nodes.find((n) => n.id === "lamp-1")?.isEnergized).toBe(true);

    // 2. When switch OPENS: downstream wires w2 & w3 MUST cut off glow (isHot: false)
    const openedSwitch = { ...nodeSwitch, frameIndex: 0, isClosed: false };
    const openedResult = SimulationEngine.step([nodePlus, openedSwitch, nodeLamp, nodeMinus], closedResult.wires);

    expect(openedResult.wires.find((w) => w.id === "w1")?.isHot).toBe(true);
    expect(openedResult.wires.find((w) => w.id === "w2")?.isHot).toBe(false);
    expect(openedResult.wires.find((w) => w.id === "w2")?.potential).toBeNull();
    expect(openedResult.wires.find((w) => w.id === "w3")?.isHot).toBe(false);
    expect(openedResult.nodes.find((n) => n.id === "lamp-1")?.isEnergized).toBe(false);
  });

  it("should calculate valid orthogonal routing with ManhattanRouter", () => {
    const p1 = { x: 60, y: 120 };
    const p2 = { x: 120, y: 240 };
    const route = ManhattanRouter.routeOrthogonal(p1, 2, p2, 0, { start: 0, center: -30, end: 0 });

    expect(route.svgPath).toBeDefined();
    expect(route.svgPath.startsWith("M 60 120")).toBe(true);
    expect(route.points.length).toBeGreaterThanOrEqual(4);
  });

  it("should conduct electricity across all ports of a wire junction", () => {
    // Power +24V -> Junction port 0, then from Junction port 1 -> Lamp1, and Junction port 2 -> Lamp2
    const nodePlus: CircuitNode = {
      id: "src+",
      componentId: "sourcePlus",
      name: "Source +24V",
      category: "sources",
      tag: null,
      comment: "+24V",
      position: { x: 100, y: 50 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeJunction: CircuitNode = {
      id: "junc1",
      componentId: "junction3p",
      name: "Connection 3P",
      category: "others",
      tag: null,
      comment: null,
      position: { x: 100, y: 150 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeLamp1: CircuitNode = {
      id: "lamp1",
      componentId: "lamp",
      name: "Lamp 1",
      category: "loads",
      tag: "-H1",
      comment: null,
      position: { x: 50, y: 250 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeLamp2: CircuitNode = {
      id: "lamp2",
      componentId: "lamp",
      name: "Lamp 2",
      category: "loads",
      tag: "-H2",
      comment: null,
      position: { x: 150, y: 250 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeMinus: CircuitNode = {
      id: "src-",
      componentId: "sourceNegative",
      name: "Source -24V",
      category: "sources",
      tag: null,
      comment: "-24V",
      position: { x: 100, y: 350 },
      rotation: 0,
      frameIndex: 0,
    };

    const wires: CircuitWire[] = [
      { id: "w-in", fromNodeId: "src+", fromPortId: 0, toNodeId: "junc1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w-out1", fromNodeId: "junc1", fromPortId: 1, toNodeId: "lamp1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w-out2", fromNodeId: "junc1", fromPortId: 2, toNodeId: "lamp2", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w-ret1", fromNodeId: "lamp1", fromPortId: 1, toNodeId: "src-", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w-ret2", fromNodeId: "lamp2", fromPortId: 1, toNodeId: "src-", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
    ];

    const result = SimulationEngine.step([nodePlus, nodeJunction, nodeLamp1, nodeLamp2, nodeMinus], wires);

    expect(result.shortCircuit).toBe(false);
    expect(result.nodes.find((n) => n.id === "lamp1")?.isEnergized).toBe(true);
    expect(result.nodes.find((n) => n.id === "lamp2")?.isEnergized).toBe(true);
  });

  it("should conduct through fuse at frame 0 and interrupt at frame 1 (blown)", () => {
    const nodePlus: CircuitNode = {
      id: "p+",
      componentId: "sourcePlus",
      name: "Source +24V",
      category: "sources",
      tag: null,
      comment: "+24V",
      position: { x: 100, y: 50 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeFuse: CircuitNode = {
      id: "f1",
      componentId: "fuse1p",
      name: "Fuse 1P",
      category: "protections",
      tag: "-F1",
      comment: null,
      position: { x: 100, y: 150 },
      rotation: 0,
      frameIndex: 0, // Intact
    };

    const nodeLamp: CircuitNode = {
      id: "l1",
      componentId: "lamp",
      name: "Lamp",
      category: "loads",
      tag: "-H1",
      comment: null,
      position: { x: 100, y: 250 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeMinus: CircuitNode = {
      id: "p-",
      componentId: "sourceNegative",
      name: "Source -24V",
      category: "sources",
      tag: null,
      comment: "-24V",
      position: { x: 100, y: 350 },
      rotation: 0,
      frameIndex: 0,
    };

    const wires: CircuitWire[] = [
      { id: "w1", fromNodeId: "p+", fromPortId: 0, toNodeId: "f1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w2", fromNodeId: "f1", fromPortId: 1, toNodeId: "l1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w3", fromNodeId: "l1", fromPortId: 1, toNodeId: "p-", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
    ];

    // Frame 0: Fuse is intact, lamp is energized
    const intactResult = SimulationEngine.step([nodePlus, nodeFuse, nodeLamp, nodeMinus], wires);
    expect(intactResult.nodes.find((n) => n.id === "l1")?.isEnergized).toBe(true);

    // Frame 1: Fuse is blown, lamp must turn off
    const blownFuse = { ...nodeFuse, frameIndex: 1 };
    const blownResult = SimulationEngine.step([nodePlus, blownFuse, nodeLamp, nodeMinus], wires);
    expect(blownResult.nodes.find((n) => n.id === "l1")?.isEnergized).toBe(false);
  });
});
