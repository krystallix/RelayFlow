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

  it("should correctly handle coupled contactNONC: NC opens and NO closes when coil energizes", () => {
    const project: { nodes: CircuitNode[]; wires: CircuitWire[] } = {
      nodes: [
        {
          id: "coil-1",
          componentId: "coil",
          name: "Coil",
          category: "coils",
          tag: "-KM1",
          comment: null,
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
          isEnergized: false,
        },
        {
          id: "source-p",
          componentId: "sourcePlus",
          name: "Source +24V",
          category: "sources",
          tag: null,
          comment: "+24V",
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
        },
        {
          id: "source-n",
          componentId: "sourceNegative",
          name: "Source -24V",
          category: "sources",
          tag: null,
          comment: "-24V",
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
        },
        {
          id: "sw-1",
          componentId: "switchNO",
          name: "Switch NO",
          category: "switches",
          tag: "-S1",
          comment: null,
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
        },
        {
          id: "contact-1",
          componentId: "contactNONC",
          name: "Contact NCNO",
          category: "auxiliaries",
          tag: "-KM1",
          comment: null,
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
        },
        {
          id: "lamp-nc",
          componentId: "lamp",
          name: "Lamp NC",
          category: "loads",
          tag: "-L_NC",
          comment: null,
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
        },
        {
          id: "lamp-no",
          componentId: "lamp",
          name: "Lamp NO",
          category: "loads",
          tag: "-L_NO",
          comment: null,
          position: { x: 0, y: 0 },
          rotation: 0,
          frameIndex: 0,
        },
      ],
      wires: [
        // Power to switch -> coil
        { id: "w1", fromNodeId: "source-p", fromPortId: 0, toNodeId: "sw-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w2", fromNodeId: "sw-1", fromPortId: 1, toNodeId: "coil-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w3", fromNodeId: "coil-1", fromPortId: 1, toNodeId: "source-n", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },

        // Power to contactNONC NC pair (0 -> 1) -> lamp-nc
        { id: "w4", fromNodeId: "source-p", fromPortId: 0, toNodeId: "contact-1", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w5", fromNodeId: "contact-1", fromPortId: 1, toNodeId: "lamp-nc", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w6", fromNodeId: "lamp-nc", fromPortId: 1, toNodeId: "source-n", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },

        // Power to contactNONC NO pair (2 -> 3) -> lamp-no
        { id: "w7", fromNodeId: "source-p", fromPortId: 0, toNodeId: "contact-1", toPortId: 2, margins: { start: 0, center: 0, end: 0 } },
        { id: "w8", fromNodeId: "contact-1", fromPortId: 3, toNodeId: "lamp-no", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w9", fromNodeId: "lamp-no", fromPortId: 1, toNodeId: "source-n", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      ],
    };

    // 1. Initial (Switch is OPEN, coil de-energized)
    const res1 = SimulationEngine.step(project.nodes, project.wires as CircuitWire[]);
    expect(res1.nodes.find((n) => n.id === "coil-1")?.isEnergized).toBe(false);
    expect(res1.nodes.find((n) => n.id === "contact-1")?.frameIndex).toBe(0);
    expect(res1.nodes.find((n) => n.id === "lamp-nc")?.isEnergized).toBe(true);
    expect(res1.nodes.find((n) => n.id === "lamp-no")?.isEnergized).toBe(false);

    // 2. Close switch (Coil energized -> NC opens, NO closes)
    const swClosed = res1.nodes.map((n) => (n.id === "sw-1" ? { ...n, frameIndex: 1, isClosed: true } : n));
    const res2 = SimulationEngine.step(swClosed, project.wires as CircuitWire[]);
    expect(res2.nodes.find((n) => n.id === "coil-1")?.isEnergized).toBe(true);
    expect(res2.nodes.find((n) => n.id === "contact-1")?.frameIndex).toBe(1);
    expect(res2.nodes.find((n) => n.id === "lamp-nc")?.isEnergized).toBe(false);
    expect(res2.nodes.find((n) => n.id === "lamp-no")?.isEnergized).toBe(true);

    // 3. Open switch again (Coil de-energizes -> NC closes back, NO opens back)
    const swOpened = res2.nodes.map((n) => (n.id === "sw-1" ? { ...n, frameIndex: 0, isClosed: false } : n));
    const res3 = SimulationEngine.step(swOpened, project.wires as CircuitWire[]);
    expect(res3.nodes.find((n) => n.id === "coil-1")?.isEnergized).toBe(false);
    expect(res3.nodes.find((n) => n.id === "contact-1")?.frameIndex).toBe(0);
    expect(res3.nodes.find((n) => n.id === "lamp-nc")?.isEnergized).toBe(true);
    expect(res3.nodes.find((n) => n.id === "lamp-no")?.isEnergized).toBe(false);
  });

  it("should couple auxiliary NO/NC contacts to Thermal Overload Relay (TOR) when tripped and reset", () => {
    const nodes: CircuitNode[] = [
      {
        id: "src+",
        componentId: "sourcePlus",
        name: "Source +24V",
        category: "sources",
        tag: null,
        comment: "+24V",
        position: { x: 0, y: 0 },
        rotation: 0,
        frameIndex: 0,
      },
      {
        id: "src-",
        componentId: "sourceNegative",
        name: "Source -24V",
        category: "sources",
        tag: null,
        comment: "-24V",
        position: { x: 0, y: 300 },
        rotation: 0,
        frameIndex: 0,
      },
      // TOR 3P with tag "-F1"
      {
        id: "tor-1",
        componentId: "overload3p",
        name: "Overload Relay 3P",
        category: "protections",
        tag: "-F1",
        comment: "Thermal Overload",
        position: { x: 100, y: 100 },
        rotation: 0,
        frameIndex: 0, // 0 = normal (untripped)
      },
      // Auxiliary NC contact (95-96) sharing tag "-F1"
      {
        id: "aux-nc",
        componentId: "contactNC",
        name: "Contact NC",
        category: "auxiliaries",
        tag: "-F1",
        comment: "95-96",
        position: { x: 200, y: 100 },
        rotation: 0,
        frameIndex: 0,
      },
      // Auxiliary NO contact (97-98) sharing tag "-F1"
      {
        id: "aux-no",
        componentId: "contactNO",
        name: "Contact NO",
        category: "auxiliaries",
        tag: "-F1",
        comment: "97-98",
        position: { x: 300, y: 100 },
        rotation: 0,
        frameIndex: 0,
      },
      // Run Lamp connected through NC contact
      {
        id: "lamp-run",
        componentId: "lamp",
        name: "Run Lamp",
        category: "loads",
        tag: "-H_RUN",
        comment: null,
        position: { x: 200, y: 200 },
        rotation: 0,
        frameIndex: 0,
      },
      // Trip/Fault Lamp connected through NO contact
      {
        id: "lamp-trip",
        componentId: "lamp",
        name: "Trip Fault Lamp",
        category: "loads",
        tag: "-H_TRIP",
        comment: null,
        position: { x: 300, y: 200 },
        rotation: 0,
        frameIndex: 0,
      },
    ];

    const wires: CircuitWire[] = [
      // Power -> aux-nc (port 0) -> lamp-run (port 0), lamp-run (port 1) -> src-
      { id: "w1", fromNodeId: "src+", fromPortId: 0, toNodeId: "aux-nc", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w2", fromNodeId: "aux-nc", fromPortId: 1, toNodeId: "lamp-run", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w3", fromNodeId: "lamp-run", fromPortId: 1, toNodeId: "src-", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },

      // Power -> aux-no (port 0) -> lamp-trip (port 0), lamp-trip (port 1) -> src-
      { id: "w4", fromNodeId: "src+", fromPortId: 0, toNodeId: "aux-no", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w5", fromNodeId: "aux-no", fromPortId: 1, toNodeId: "lamp-trip", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      { id: "w6", fromNodeId: "lamp-trip", fromPortId: 1, toNodeId: "src-", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
    ];

    // 1. Initial State: TOR is normal (untripped, frame 0)
    const resNormal = SimulationEngine.step(nodes, wires);
    expect(resNormal.shortCircuit).toBe(false);
    expect(resNormal.nodes.find((n) => n.id === "aux-nc")?.frameIndex).toBe(0);
    expect(resNormal.nodes.find((n) => n.id === "aux-no")?.frameIndex).toBe(0);
    expect(resNormal.nodes.find((n) => n.id === "lamp-run")?.isEnergized).toBe(true);
    expect(resNormal.nodes.find((n) => n.id === "lamp-trip")?.isEnergized).toBe(false);

    // 2. Trip TOR (frameIndex = 1)
    const nodesTripped = resNormal.nodes.map((n) => (n.id === "tor-1" ? { ...n, frameIndex: 1 } : n));
    const resTripped = SimulationEngine.step(nodesTripped, wires);
    expect(resTripped.nodes.find((n) => n.id === "aux-nc")?.frameIndex).toBe(1); // NC opened!
    expect(resTripped.nodes.find((n) => n.id === "aux-no")?.frameIndex).toBe(1); // NO closed!
    expect(resTripped.nodes.find((n) => n.id === "lamp-run")?.isEnergized).toBe(false); // Run circuit stopped
    expect(resTripped.nodes.find((n) => n.id === "lamp-trip")?.isEnergized).toBe(true); // Fault indicator lit

    // 3. Reset TOR (frameIndex = 0)
    const nodesReset = resTripped.nodes.map((n) => (n.id === "tor-1" ? { ...n, frameIndex: 0 } : n));
    const resReset = SimulationEngine.step(nodesReset, wires);
    expect(resReset.nodes.find((n) => n.id === "aux-nc")?.frameIndex).toBe(0); // NC closed back
    expect(resReset.nodes.find((n) => n.id === "aux-no")?.frameIndex).toBe(0); // NO opened back
    expect(resReset.nodes.find((n) => n.id === "lamp-run")?.isEnergized).toBe(true);
    expect(resReset.nodes.find((n) => n.id === "lamp-trip")?.isEnergized).toBe(false);
  });

  describe("Motor Energization & Direction Logic Across All Variants", () => {
    it("should energize motorStarDelta in Star configuration and star wires glow hot", () => {
      const src3p: CircuitNode = {
        id: "src3p",
        componentId: "sourceL1L2L3",
        name: "Source 3P",
        category: "sources",
        tag: null,
        comment: null,
        position: { x: 0, y: 0 },
        rotation: 0,
        frameIndex: 0,
      };

      const motor: CircuitNode = {
        id: "motor-sd",
        componentId: "motorStarDelta",
        name: "Motor Star/Delta",
        category: "motors",
        tag: "-M1",
        comment: null,
        position: { x: 100, y: 100 },
        rotation: 0,
        frameIndex: 0,
      };

      // Star contactor KM2 (frameIndex: 1 = closed)
      const contactorStar: CircuitNode = {
        id: "km-star",
        componentId: "contactor3p",
        name: "Contactor Star",
        category: "contactors",
        tag: "-KM2",
        comment: null,
        position: { x: 100, y: 300 },
        rotation: 0,
        frameIndex: 1, // closed
      };

      const wires: CircuitWire[] = [
        // Power to U1, V1, W1 (ports 0, 1, 2)
        { id: "w-u1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-sd", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-v1", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-sd", toPortId: 1, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-w1", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-sd", toPortId: 2, margins: { start: 0, center: 0, end: 0 } },

        // Motor W2 (3), U2 (4), V2 (5) connected to KM2 terminals 1 (0), 3 (2), 5 (4)
        { id: "w-w2", fromNodeId: "motor-sd", fromPortId: 3, toNodeId: "km-star", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-u2", fromNodeId: "motor-sd", fromPortId: 4, toNodeId: "km-star", toPortId: 2, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-v2", fromNodeId: "motor-sd", fromPortId: 5, toNodeId: "km-star", toPortId: 4, margins: { start: 0, center: 0, end: 0 } },

        // KM2 star bridge: jumper connecting terminals 2 (1), 4 (3), 6 (5) together
        { id: "w-bridge1", fromNodeId: "km-star", fromPortId: 1, toNodeId: "km-star", toPortId: 3, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-bridge2", fromNodeId: "km-star", fromPortId: 3, toNodeId: "km-star", toPortId: 5, margins: { start: 0, center: 0, end: 0 } },
      ];

      // 1. With KM-Star closed (frameIndex: 1): motor runs in Star!
      const resStar = SimulationEngine.step([src3p, motor, contactorStar], wires);
      const motorRes = resStar.nodes.find((n) => n.id === "motor-sd");
      expect(motorRes?.isEnergized).toBe(true);
      expect(motorRes?.frameIndex).toBe(1);
      expect(motorRes?.motorDirection).toBe("cw");

      // Verify star wires to KM2 and star jumper are hot
      expect(resStar.wires.find((w) => w.id === "w-w2")?.isHot).toBe(true);
      expect(resStar.wires.find((w) => w.id === "w-u2")?.isHot).toBe(true);
      expect(resStar.wires.find((w) => w.id === "w-v2")?.isHot).toBe(true);
      expect(resStar.wires.find((w) => w.id === "w-bridge1")?.isHot).toBe(true);

      // 2. When KM-Star opens (frameIndex: 0): star point broken, motor stops!
      const contactorOpen = { ...contactorStar, frameIndex: 0 };
      const resOpen = SimulationEngine.step([src3p, motor, contactorOpen], wires);
      const motorOpenRes = resOpen.nodes.find((n) => n.id === "motor-sd");
      expect(motorOpenRes?.isEnergized).toBe(false);
      expect(motorOpenRes?.motorDirection).toBe("off");
      expect(resOpen.wires.find((w) => w.id === "w-w2")?.isHot).toBe(false);
    });

    it("should energize motorStarDelta in Delta configuration and run cw or ccw based on phase sequence", () => {
      const src3p: CircuitNode = {
        id: "src3p",
        componentId: "sourceL1L2L3",
        name: "Source 3P",
        category: "sources",
        tag: null,
        comment: null,
        position: { x: 0, y: 0 },
        rotation: 0,
        frameIndex: 0,
      };

      const motor: CircuitNode = {
        id: "motor-sd",
        componentId: "motorStarDelta",
        name: "Motor Star/Delta",
        category: "motors",
        tag: "-M1",
        comment: null,
        position: { x: 100, y: 100 },
        rotation: 0,
        frameIndex: 0,
      };

      // Standard Delta connection:
      // U1 (0) = L1, V1 (1) = L2, W1 (2) = L3
      // W2 (3) = L1, U2 (4) = L2, V2 (5) = L3
      // Winding U1-U2 is between L1 and L2
      // Winding V1-V2 is between L2 and L3
      // Winding W1-W2 is between L3 and L1
      const wiresCW: CircuitWire[] = [
        { id: "w-u1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-sd", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-v1", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-sd", toPortId: 1, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-w1", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-sd", toPortId: 2, margins: { start: 0, center: 0, end: 0 } },

        { id: "w-w2", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-sd", toPortId: 3, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-u2", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-sd", toPortId: 4, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-v2", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-sd", toPortId: 5, margins: { start: 0, center: 0, end: 0 } },
      ];

      const resCW = SimulationEngine.step([src3p, motor], wiresCW);
      const motorCW = resCW.nodes.find((n) => n.id === "motor-sd");
      expect(motorCW?.isEnergized).toBe(true);
      expect(motorCW?.motorDirection).toBe("cw");

      // Swap L2 and L3 to test CCW rotation
      const wiresCCW: CircuitWire[] = [
        { id: "w-u1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-sd", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-v1", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-sd", toPortId: 1, margins: { start: 0, center: 0, end: 0 } }, // L3
        { id: "w-w1", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-sd", toPortId: 2, margins: { start: 0, center: 0, end: 0 } }, // L2

        { id: "w-w2", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-sd", toPortId: 3, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-u2", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-sd", toPortId: 4, margins: { start: 0, center: 0, end: 0 } },
        { id: "w-v2", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-sd", toPortId: 5, margins: { start: 0, center: 0, end: 0 } },
      ];

      const resCCW = SimulationEngine.step([src3p, motor], wiresCCW);
      const motorCCW = resCCW.nodes.find((n) => n.id === "motor-sd");
      expect(motorCCW?.isEnergized).toBe(true);
      expect(motorCCW?.motorDirection).toBe("ccw");
    });

    it("should energize motorTwoSpeeds on both Speed 1 and Speed 2", () => {
      const src3p: CircuitNode = {
        id: "src3p",
        componentId: "sourceL1L2L3",
        name: "Source 3P",
        category: "sources",
        tag: null,
        comment: null,
        position: { x: 0, y: 0 },
        rotation: 0,
        frameIndex: 0,
      };

      const motor: CircuitNode = {
        id: "motor-2spd",
        componentId: "motorTwoSpeeds",
        name: "Two Speed Motor",
        category: "motors",
        tag: "-M1",
        comment: null,
        position: { x: 100, y: 100 },
        rotation: 0,
        frameIndex: 0,
      };

      // Speed 1: power to U1 (0), V1 (1), W1 (2)
      const wiresSpd1: CircuitWire[] = [
        { id: "w1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-2spd", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w2", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-2spd", toPortId: 1, margins: { start: 0, center: 0, end: 0 } },
        { id: "w3", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-2spd", toPortId: 2, margins: { start: 0, center: 0, end: 0 } },
      ];
      const resSpd1 = SimulationEngine.step([src3p, motor], wiresSpd1);
      expect(resSpd1.nodes.find((n) => n.id === "motor-2spd")?.isEnergized).toBe(true);
      expect(resSpd1.nodes.find((n) => n.id === "motor-2spd")?.motorDirection).toBe("cw");

      // Speed 2: power to U2 (3), V2 (4), W2 (5)
      const wiresSpd2: CircuitWire[] = [
        { id: "w1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-2spd", toPortId: 3, margins: { start: 0, center: 0, end: 0 } },
        { id: "w2", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-2spd", toPortId: 4, margins: { start: 0, center: 0, end: 0 } },
        { id: "w3", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-2spd", toPortId: 5, margins: { start: 0, center: 0, end: 0 } },
      ];
      const resSpd2 = SimulationEngine.step([src3p, motor], wiresSpd2);
      expect(resSpd2.nodes.find((n) => n.id === "motor-2spd")?.isEnergized).toBe(true);
      expect(resSpd2.nodes.find((n) => n.id === "motor-2spd")?.motorDirection).toBe("cw");
    });

    it("should energize motorDhalander on Low Speed and High Speed", () => {
      const src3p: CircuitNode = {
        id: "src3p",
        componentId: "sourceL1L2L3",
        name: "Source 3P",
        category: "sources",
        tag: null,
        comment: null,
        position: { x: 0, y: 0 },
        rotation: 0,
        frameIndex: 0,
      };

      const motor: CircuitNode = {
        id: "motor-dh",
        componentId: "motorDhalander",
        name: "Dahlander Motor",
        category: "motors",
        tag: "-M1",
        comment: null,
        position: { x: 100, y: 100 },
        rotation: 0,
        frameIndex: 0,
      };

      // Low Speed: power on U1 (0), V1 (1), W1 (2)
      const wiresLow: CircuitWire[] = [
        { id: "w1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-dh", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w2", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-dh", toPortId: 1, margins: { start: 0, center: 0, end: 0 } },
        { id: "w3", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-dh", toPortId: 2, margins: { start: 0, center: 0, end: 0 } },
      ];
      const resLow = SimulationEngine.step([src3p, motor], wiresLow);
      expect(resLow.nodes.find((n) => n.id === "motor-dh")?.isEnergized).toBe(true);

      // High Speed: power on U2 (3), V2 (4), W2 (5)
      const wiresHigh: CircuitWire[] = [
        { id: "w1", fromNodeId: "src3p", fromPortId: 0, toNodeId: "motor-dh", toPortId: 3, margins: { start: 0, center: 0, end: 0 } },
        { id: "w2", fromNodeId: "src3p", fromPortId: 1, toNodeId: "motor-dh", toPortId: 4, margins: { start: 0, center: 0, end: 0 } },
        { id: "w3", fromNodeId: "src3p", fromPortId: 2, toNodeId: "motor-dh", toPortId: 5, margins: { start: 0, center: 0, end: 0 } },
      ];
      const resHigh = SimulationEngine.step([src3p, motor], wiresHigh);
      expect(resHigh.nodes.find((n) => n.id === "motor-dh")?.isEnergized).toBe(true);
    });

    it("should energize motor1ph and motorDC with correct directional response", () => {
      const src1p: CircuitNode = {
        id: "src1p",
        componentId: "sourceL1",
        name: "L1",
        category: "sources",
        tag: null,
        comment: null,
        position: { x: 0, y: 0 },
        rotation: 0,
        frameIndex: 0,
      };

      const srcN: CircuitNode = {
        id: "srcN",
        componentId: "sourceN",
        name: "N",
        category: "sources",
        tag: null,
        comment: null,
        position: { x: 0, y: 100 },
        rotation: 0,
        frameIndex: 0,
      };

      const motor1ph: CircuitNode = {
        id: "m-1ph",
        componentId: "motor1ph",
        name: "Single Phase Motor",
        category: "motors",
        tag: "-M1",
        comment: null,
        position: { x: 100, y: 50 },
        rotation: 0,
        frameIndex: 0,
      };

      const wires1ph: CircuitWire[] = [
        { id: "w1", fromNodeId: "src1p", fromPortId: 0, toNodeId: "m-1ph", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w2", fromNodeId: "m-1ph", fromPortId: 1, toNodeId: "srcN", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      ];

      const res1ph = SimulationEngine.step([src1p, srcN, motor1ph], wires1ph);
      expect(res1ph.nodes.find((n) => n.id === "m-1ph")?.isEnergized).toBe(true);
      expect(res1ph.nodes.find((n) => n.id === "m-1ph")?.motorDirection).toBe("cw");

      // Test DC Motor
      const srcPlus: CircuitNode = {
        id: "src+",
        componentId: "sourcePlus",
        name: "+24V",
        category: "sources",
        tag: null,
        comment: "+24V",
        position: { x: 0, y: 200 },
        rotation: 0,
        frameIndex: 0,
      };

      const srcMinus: CircuitNode = {
        id: "src-",
        componentId: "sourceNegative",
        name: "-24V",
        category: "sources",
        tag: null,
        comment: "-24V",
        position: { x: 0, y: 300 },
        rotation: 0,
        frameIndex: 0,
      };

      const motorDC: CircuitNode = {
        id: "m-dc",
        componentId: "motorDC",
        name: "DC Motor",
        category: "motors",
        tag: "-M2",
        comment: null,
        position: { x: 100, y: 250 },
        rotation: 0,
        frameIndex: 0,
      };

      // Normal DC: +24V to port 0 (X1), -24V to port 1 (X2) -> CW
      const wiresDC_CW: CircuitWire[] = [
        { id: "w3", fromNodeId: "src+", fromPortId: 0, toNodeId: "m-dc", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w4", fromNodeId: "m-dc", fromPortId: 1, toNodeId: "src-", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      ];
      const resDC_CW = SimulationEngine.step([srcPlus, srcMinus, motorDC], wiresDC_CW);
      expect(resDC_CW.nodes.find((n) => n.id === "m-dc")?.isEnergized).toBe(true);
      expect(resDC_CW.nodes.find((n) => n.id === "m-dc")?.motorDirection).toBe("cw");

      // Reversed DC: -24V to port 0, +24V to port 1 -> CCW
      const wiresDC_CCW: CircuitWire[] = [
        { id: "w5", fromNodeId: "src-", fromPortId: 0, toNodeId: "m-dc", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
        { id: "w6", fromNodeId: "m-dc", fromPortId: 1, toNodeId: "src+", toPortId: 0, margins: { start: 0, center: 0, end: 0 } },
      ];
      const resDC_CCW = SimulationEngine.step([srcPlus, srcMinus, motorDC], wiresDC_CCW);
      expect(resDC_CCW.nodes.find((n) => n.id === "m-dc")?.isEnergized).toBe(true);
      expect(resDC_CCW.nodes.find((n) => n.id === "m-dc")?.motorDirection).toBe("ccw");
    });
  });
});
