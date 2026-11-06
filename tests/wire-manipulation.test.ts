import { describe, it, expect } from "vitest";
import { useCircuitStore } from "../src/store/useCircuitStore";
import { TEXT_CENTERS } from "../src/components/canvas/SymbolRenderer";
import { DEFAULT_SIMPLE_LAMP_PROJECT } from "../src/constants/default-circuit";
import { SimulationEngine } from "../src/engine/SimulationEngine";

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

    store.updateWireMargins(initialWire.id, { center: 45 }, true);

    const updatedWire = useCircuitStore.getState().wires.find((w) => w.id === initialWire.id);
    expect(updatedWire?.margins?.center).toBe(45);
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
});
