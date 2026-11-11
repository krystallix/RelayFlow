import { describe, it, expect } from "vitest";
import { useCircuitStore } from "../src/store/useCircuitStore";
import { TEXT_CENTERS } from "../src/components/canvas/SymbolRenderer";
import { DEFAULT_SIMPLE_LAMP_PROJECT } from "../src/constants/default-circuit";
import { SimulationEngine } from "../src/engine/SimulationEngine";
import { ManhattanRouter } from "../src/engine/router/ManhattanRouter";

describe("Wire Splice and Drag Features", () => {
  it("connectWireToWire should connect wire into middle of existing wire WITHOUT splitting the main wire", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    // Initial state: 4 nodes, 3 wires
    const initialNodesCount = useCircuitStore.getState().nodes.length;
    const initialWireCount = useCircuitStore.getState().wires.length;
    const targetWire = useCircuitStore.getState().wires[1]; // wire between switch-1 and lamp-1

    // Add a second lamp
    store.addNode("lamp", { x: 500, y: 300 });
    const lamp2 = useCircuitStore.getState().nodes.find(
      (n) => n.id !== "lamp-1" && n.componentId === "lamp"
    );
    expect(lamp2).toBeDefined();

    // Start drafting wire from lamp2 (port 0)
    store.startWireDraft(lamp2!.id, 0, { x: 500, y: 300 });
    expect(useCircuitStore.getState().wireDraft).toBeDefined();

    // Connect wire to targetWire at (300, 300)
    store.connectWireToWire(targetWire.id, { x: 300, y: 300 });

    const afterState = useCircuitStore.getState();

    // 1. Wire draft is completed and cleared
    expect(afterState.wireDraft).toBeNull();

    // 2. Main targetWire is NOT split! Still exactly exists!
    const targetStillExists = afterState.wires.find((w) => w.id === targetWire.id);
    expect(targetStillExists).toBeDefined();

    // 3. NO fake junctionDot node was inserted!
    const junction = afterState.nodes.find((n) => n.componentId === "junctionDot");
    expect(junction).toBeUndefined();
    expect(afterState.nodes.length).toBe(initialNodesCount + 1); // only lamp2 added

    // 4. Exactly one new branch wire added
    expect(afterState.wires.length).toBe(initialWireCount + 1);

    const branchWire = afterState.wires.find((w) => w.toWireId === targetWire.id);
    expect(branchWire).toBeDefined();
    expect(branchWire?.fromNodeId).toBe(lamp2!.id);
    expect(branchWire?.tapPoint).toEqual({ x: 300, y: 300 });
  });

  it("parallel lamp connected via wire-to-wire should simulate without short circuit", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    // Add Lamp 2
    store.addNode("lamp", { x: 500, y: 300 });
    const lamp2 = useCircuitStore.getState().nodes.find(
      (n) => n.id !== "lamp-1" && n.componentId === "lamp"
    );

    const wireToLamp1 = useCircuitStore.getState().wires.find(
      (w) => w.toNodeId === "lamp-1" && w.toPortId === 0
    )!;
    const wireFromLamp1 = useCircuitStore.getState().wires.find(
      (w) => w.fromNodeId === "lamp-1" && w.fromPortId === 1
    )!;

    // Connect Lamp 2 port 0 -> wireToLamp1
    store.startWireDraft(lamp2!.id, 0, { x: 500, y: 240 });
    store.connectWireToWire(wireToLamp1.id, { x: 300, y: 240 });

    // Connect Lamp 2 port 1 -> wireFromLamp1
    store.startWireDraft(lamp2!.id, 1, { x: 500, y: 360 });
    store.connectWireToWire(wireFromLamp1.id, { x: 300, y: 360 });

    const state = useCircuitStore.getState();
    // Close switch-1 (frameIndex: 1)
    const nodesClosed = state.nodes.map((n) =>
      n.id === "switch-1" ? { ...n, frameIndex: 1, isClosed: true } : n
    );

    const simRes = SimulationEngine.step(nodesClosed, state.wires);
    expect(simRes.shortCircuit).toBe(false);
    expect(simRes.nodes.find((n) => n.id === "lamp-1")?.isEnergized).toBe(true);
    expect(simRes.nodes.find((n) => n.id === lamp2!.id)?.isEnergized).toBe(true);
  });

  it("deleting branch wire should leave main wire completely intact", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    const targetWire = useCircuitStore.getState().wires[1];
    store.startWireDraft("lamp-1", 1, { x: 300, y: 240 });
    store.connectWireToWire(targetWire.id, { x: 300, y: 240 });

    const branchWire = useCircuitStore.getState().wires.find((w) => w.toWireId === targetWire.id)!;
    expect(branchWire).toBeDefined();

    // Select and delete branch wire only
    store.selectWire(branchWire.id, false);
    store.deleteSelection();

    const afterState = useCircuitStore.getState();
    expect(afterState.wires.find((w) => w.id === branchWire.id)).toBeUndefined();
    expect(afterState.wires.find((w) => w.id === targetWire.id)).toBeDefined();
  });

  it("deleting legacy junctionDot should heal split wire back into one", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    const initialWire = useCircuitStore.getState().wires[0];
    store.splitWireAtJunction(initialWire.id, { x: 300, y: 200 }, false);

    const stateAfterSplit = useCircuitStore.getState();
    const junction = stateAfterSplit.nodes.find((n) => n.componentId === "junctionDot")!;
    expect(junction).toBeDefined();

    // Select and delete the junction dot
    store.selectNode(junction.id, false);
    store.deleteSelection();

    const stateAfterDelete = useCircuitStore.getState();
    expect(stateAfterDelete.nodes.find((n) => n.id === junction.id)).toBeUndefined();

    // The two split wires are replaced by one healed wire from initial endpoints
    const healed = stateAfterDelete.wires.find(
      (w) => w.fromNodeId === initialWire.fromNodeId && w.toNodeId === initialWire.toNodeId
    );
    expect(healed).toBeDefined();
  });

  it("updateWireMargins should update margins live and with commit", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);
    const initialWire = useCircuitStore.getState().wires[0];

    store.updateWireMargins(initialWire.id, { start: 0, center: 45, end: 0 }, true);

    const updatedWire = useCircuitStore.getState().wires.find((w) => w.id === initialWire.id);
    expect(updatedWire?.margins?.center).toBe(45);
  });

  it("should calculate corner handles for orthogonal routed wires", () => {
    // Orthogonal route with corner points
    const p1 = { x: 100, y: 100 };
    const p2 = { x: 300, y: 300 };
    const routed = ManhattanRouter.routeOrthogonal(p1, 2, p2, 0); // Bottom to Top
    expect(routed.points.length).toBeGreaterThanOrEqual(3);

    // Any intermediate point is a corner
    const corners = routed.points.slice(1, -1);
    expect(corners.length).toBeGreaterThanOrEqual(1);
    for (const c of corners) {
      expect(typeof c.x).toBe("number");
      expect(typeof c.y).toBe("number");
    }
  });

  it("TEXT_CENTERS should define exact centers for text paths in sources and motors", () => {
    expect(TEXT_CENTERS.sourceL1L2L3N).toBeDefined();
    expect(TEXT_CENTERS.sourceL1L2L3N.textPath1.cx).toBe(210);
    expect(TEXT_CENTERS.sourceL1L2L3N.textPath2.cx).toBe(150);
    expect(TEXT_CENTERS.sourceL1L2L3N.textPath3.cx).toBe(90);
    expect(TEXT_CENTERS.sourceL1L2L3N.textPath4.cx).toBe(30);

    expect(TEXT_CENTERS.sourceN.textPath1.cx).toBe(30);
    expect(TEXT_CENTERS.motor3ph.textPath1.cx).toBe(90);
    expect(TEXT_CENTERS.motor3ph.textPath1.cy).toBe(90);
  });

  it("moving a node connected to a target wire should automatically stretch and track the branch wire", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    // Initial: switch-1 at {x: 210, y: 180}, lamp-1 at {x: 210, y: 300}
    // targetWire connects switch-1 to lamp-1 along x = 210
    const targetWire = store.wires[1];

    // Add a coil node
    store.addNode("coil", { x: 450, y: 240 });
    const coil = useCircuitStore.getState().nodes.find((n) => n.componentId === "coil")!;

    // Tap wire from coil port 0 into targetWire at x = 210, y = 240
    store.startWireDraft(coil.id, 0, { x: 450, y: 240 });
    store.connectWireToWire(targetWire.id, { x: 210, y: 240 });

    const branchWireBefore = useCircuitStore.getState().wires.find((w) => w.toWireId === targetWire.id)!;
    expect(branchWireBefore.tapPoint).toEqual({ x: 210, y: 240 });

    // Now move lamp-1 and switch-1 (shift the target wire from x = 210 to x = 300)
    store.updateNodesPositions([
      { id: "switch-1", position: { x: 300, y: 180 } },
      { id: "lamp-1", position: { x: 300, y: 300 } },
    ], true);

    const stateAfter = useCircuitStore.getState();
    const branchWireAfter = stateAfter.wires.find((w) => w.toWireId === targetWire.id)!;

    // Dynamic resolution confirms the branch wire stretches and follows the target wire to x = 300
    const nodeMap = new Map(stateAfter.nodes.map((n) => [n.id, n]));
    const wireMap = new Map(stateAfter.wires.map((w) => [w.id, w]));
    const resolved = ManhattanRouter.resolveWireEndpoints(branchWireAfter, nodeMap, wireMap);
    expect(resolved).toBeDefined();
    expect(resolved?.isTapWire).toBe(true);
    expect(resolved?.p2.x).toBe(300);
  });

  it("test drag coil up and back down automatically stretches and retracts bidirectionally", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    // Add coil at (300, 300)
    store.addNode("coil", { x: 300, y: 300 });
    const coil = useCircuitStore.getState().nodes.find((n) => n.componentId === "coil")!;

    // Add wire from coil pin 1 (A2) to source-negative (N)
    const storeState = useCircuitStore.getState();
    const sourceNeg = storeState.nodes.find((n) => n.componentId === "sourceNegative")!;

    // Start wire draft from coil A2 to sourceNegative
    store.startWireDraft(coil.id, 1, { x: 300, y: 360 });
    store.completeWireDraft(sourceNeg.id, 0);

    const coilWire = useCircuitStore.getState().wires.find((w) => w.fromNodeId === coil.id)!;

    // Add lamp at (500, 300)
    store.addNode("lamp", { x: 500, y: 300 });
    const lamp = useCircuitStore.getState().nodes.find((n) => n.id !== "lamp-1" && n.componentId === "lamp")!;

    // Connect Lamp pin 1 (X2) into middle of coilWire at y = 390
    store.startWireDraft(lamp.id, 1, { x: 500, y: 360 });
    store.connectWireToWire(coilWire.id, { x: 300, y: 390 });

    const branchWire = useCircuitStore.getState().wires.find((w) => w.toWireId === coilWire.id)!;
    expect(branchWire.tapPoint).toEqual({ x: 300, y: 390 });

    // 1. Move coil UP by 120px: position y: 300 -> 180
    store.updateNodesPositions([{ id: coil.id, position: { x: 300, y: 180 } }], true);

    const stateUp = useCircuitStore.getState();
    const nodeMapUp = new Map(stateUp.nodes.map((n) => [n.id, n]));
    const wireMapUp = new Map(stateUp.wires.map((w) => [w.id, w]));
    const resAfterUp = ManhattanRouter.resolveWireEndpoints(branchWire, nodeMapUp, wireMapUp);
    // Automatically stretched up to y = 360
    expect(resAfterUp?.p2).toEqual({ x: 300, y: 360 });

    // 2. Move coil BACK DOWN to 300
    store.updateNodesPositions([{ id: coil.id, position: { x: 300, y: 300 } }], true);

    const stateDown = useCircuitStore.getState();
    const nodeMapDown = new Map(stateDown.nodes.map((n) => [n.id, n]));
    const wireMapDown = new Map(stateDown.wires.map((w) => [w.id, w]));
    const resAfterDown = ManhattanRouter.resolveWireEndpoints(branchWire, nodeMapDown, wireMapDown);
    // Automatically retracted back down to original y = 390!
    expect(resAfterDown?.p2).toEqual({ x: 300, y: 390 });
  });

  it("simulation should keep lamp and return wire hot when tapped into an idle coil wire", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    // Set switch-1 to closed so L1 reaches wire 1
    const nodes = store.nodes.map((n) =>
      n.id === "switch-1" ? { ...n, isClosed: true, frameIndex: 1 } : n
    );

    // Add idle coil node
    const coilNode = {
      id: "coil-test",
      componentId: "coil",
      name: "Relay Coil",
      category: "coils",
      tag: "-KM1",
      comment: null,
      position: { x: 450, y: 300 },
      rotation: 0 as const,
      frameIndex: 0,
    };

    // Wire from coil pin 1 (A2) to source-negative (return N)
    const coilReturnWire = {
      id: "wire-coil-n",
      fromNodeId: "coil-test",
      fromPortId: 1, // A2
      toNodeId: "source-negative",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };

    // Branch wire from lamp-1 pin 1 (X2) into coilReturnWire
    const branchWire = {
      id: "wire-lamp-tap",
      fromNodeId: "lamp-1",
      fromPortId: 1, // X2
      toNodeId: "coil-test",
      toPortId: 1,
      toWireId: "wire-coil-n",
      tapPoint: { x: 300, y: 390 },
      margins: { start: 0, center: 0, end: 0 },
    };

    // Remove old direct wire from lamp-1 to source-negative, and use tap wire instead
    const activeWires = store.wires
      .filter((w) => !(w.fromNodeId === "lamp-1" && w.toNodeId === "source-negative"))
      .concat([coilReturnWire, branchWire]);

    const allNodes = [...nodes, coilNode];

    const simRes = SimulationEngine.step(allNodes, activeWires);

    expect(simRes.shortCircuit).toBe(false);

    // Lamp should be energized (ON)
    const lamp = simRes.nodes.find((n) => n.id === "lamp-1")!;
    expect(lamp.isEnergized).toBe(true);

    // Branch wire must be hot (-24V return current)
    const branch = simRes.wires.find((w) => w.id === "wire-lamp-tap")!;
    expect(branch.isHot).toBe(true);

    // Coil return wire must ALSO be hot because it carries the return current to source-negative!
    const coilWire = simRes.wires.find((w) => w.id === "wire-coil-n")!;
    expect(coilWire.isHot).toBe(true);
  });

  it("updateWireTapPoint should move tap point and constrain strictly along the connected host wire", () => {
    const store = useCircuitStore.getState();
    store.loadProject(DEFAULT_SIMPLE_LAMP_PROJECT);

    // Initial target wire is from switch-1 {x: 210, y: 180} to lamp-1 {x: 210, y: 300}
    const targetWire = store.wires[1];

    // Add another lamp and tap into targetWire
    store.addNode("lamp", { x: 450, y: 240 });
    const lamp2 = useCircuitStore.getState().nodes.find((n) => n.id !== "lamp-1" && n.componentId === "lamp")!;

    store.startWireDraft(lamp2.id, 0, { x: 450, y: 180 });
    store.connectWireToWire(targetWire.id, { x: 210, y: 240 });

    const branchWire = useCircuitStore.getState().wires.find((w) => w.toWireId === targetWire.id)!;
    expect(branchWire.tapPoint).toEqual({ x: 210, y: 240 });

    // Host wire polyline segments: along vertical line x = 210 between y = 180 and y = 300
    const hostSegments = [
      { x: 210, y: 180 },
      { x: 210, y: 300 },
    ];

    // Case 1: User drags connection point within the wire (e.g. to y = 210)
    const dragPos1 = { x: 210, y: 210 };
    const nearest1 = ManhattanRouter.getNearestPointOnSegments(dragPos1, hostSegments);
    expect(nearest1.point).toEqual({ x: 210, y: 210 });

    store.updateWireTapPoint(branchWire.id, nearest1.point, false);
    expect(useCircuitStore.getState().wires.find((w) => w.id === branchWire.id)?.tapPoint).toEqual({ x: 210, y: 210 });

    // Case 2: User tries to drag connection point FAR OUTSIDE (e.g. x = 999, y = 500)
    // It MUST be strictly constrained to x = 210 and clamped to max Y = 300!
    const dragPosOutside = { x: 999, y: 500 };
    const nearestConstrained = ManhattanRouter.getNearestPointOnSegments(dragPosOutside, hostSegments);
    expect(nearestConstrained.point).toEqual({ x: 210, y: 300 });

    // Case 3: User tries to drag connection point far ABOVE (e.g. x = -100, y = -50)
    // It MUST be strictly clamped to min Y = 180 and x = 210!
    const dragPosAbove = { x: -100, y: -50 };
    const nearestAbove = ManhattanRouter.getNearestPointOnSegments(dragPosAbove, hostSegments);
    expect(nearestAbove.point).toEqual({ x: 210, y: 180 });

    // Commit final update
    store.updateWireTapPoint(branchWire.id, nearestConstrained.point, true);
    expect(useCircuitStore.getState().wires.find((w) => w.id === branchWire.id)?.tapPoint).toEqual({ x: 210, y: 300 });

    // Verify undo restores previous position
    store.undo();
    expect(useCircuitStore.getState().wires.find((w) => w.id === branchWire.id)?.tapPoint).toEqual({ x: 210, y: 210 });
  });
});
