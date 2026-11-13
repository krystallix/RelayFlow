import { describe, it, expect, beforeEach } from "vitest";
import { useCircuitStore } from "../src/store/useCircuitStore";
import { CircuitNode, CircuitWire } from "../src/engine/types";
import { SimulationEngine } from "../src/engine/SimulationEngine";

describe("Popover Symbol Actions in CircuitStore", () => {
  beforeEach(() => {
    useCircuitStore.getState().resetCanvas();
  });

  it("should rotate node right (CW) and left (CCW) accurately", () => {
    const store = useCircuitStore.getState();
    const testNode: CircuitNode = {
      id: 101,
      componentId: "breaker3p",
      name: "Circuit Breaker 3P",
      category: "protections",
      tag: "-QF1",
      comment: null,
      position: { x: 120, y: 150 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [testNode],
      selectedNodeIds: new Set([101]),
    });

    // 1. Rotate right (CW: 0 -> 1 -> 2 -> 3 -> 0)
    useCircuitStore.getState().rotateSelectedNodes("cw");
    expect(useCircuitStore.getState().nodes[0].rotation).toBe(1);

    useCircuitStore.getState().rotateSelectedNodes("cw");
    expect(useCircuitStore.getState().nodes[0].rotation).toBe(2);

    // 2. Rotate left (CCW: 2 -> 1 -> 0 -> 3)
    useCircuitStore.getState().rotateSelectedNodes("ccw");
    expect(useCircuitStore.getState().nodes[0].rotation).toBe(1);

    useCircuitStore.getState().rotateSelectedNodes("ccw");
    expect(useCircuitStore.getState().nodes[0].rotation).toBe(0);

    useCircuitStore.getState().rotateSelectedNodes("ccw");
    expect(useCircuitStore.getState().nodes[0].rotation).toBe(3);
  });

  it("should copy selected symbol to clipboard and paste with offset and new ID", () => {
    const testNode: CircuitNode = {
      id: 201,
      componentId: "coil",
      name: "Contactor Coil",
      category: "coils",
      tag: "-KM1",
      comment: "Main Coil",
      position: { x: 210, y: 300 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [testNode],
      selectedNodeIds: new Set([201]),
      clipboard: null,
    });

    // 1. Copy selection
    useCircuitStore.getState().copySelection();
    const clipboard = useCircuitStore.getState().clipboard;
    expect(clipboard).toBeDefined();
    expect(clipboard?.nodes.length).toBe(1);
    expect(clipboard?.nodes[0].tag).toBe("-KM1");

    // 2. Paste selection
    useCircuitStore.getState().pasteSelection();
    const updatedNodes = useCircuitStore.getState().nodes;
    expect(updatedNodes.length).toBe(2);

    const pastedNode = updatedNodes.find((n) => n.id !== 201);
    expect(pastedNode).toBeDefined();
    // Smart tag increment: -KM1 becomes -KM2
    expect(pastedNode?.tag).toBe("-KM2");
    expect(pastedNode?.position.x).toBe(testNode.position.x + 30);
    expect(pastedNode?.position.y).toBe(testNode.position.y + 30);

    // Pasted node should now be the selected node
    const selectedIds = useCircuitStore.getState().selectedNodeIds;
    expect(selectedIds.has(pastedNode!.id)).toBe(true);
    expect(selectedIds.has(201)).toBe(false);
  });

  it("should delete selected symbol and clean up connected wires", () => {
    const nodeA: CircuitNode = {
      id: 301,
      componentId: "sourcePlus",
      name: "Source +24V",
      category: "sources",
      tag: null,
      comment: null,
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 0,
    };

    const nodeB: CircuitNode = {
      id: 302,
      componentId: "sourceNegative",
      name: "Source -24V",
      category: "sources",
      tag: null,
      comment: null,
      position: { x: 100, y: 200 },
      rotation: 0,
      frameIndex: 0,
    };

    const wire: CircuitWire = {
      id: 999,
      fromNodeId: 301,
      fromPortId: 0,
      toNodeId: 302,
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    };

    useCircuitStore.setState({
      nodes: [nodeA, nodeB],
      wires: [wire],
      selectedNodeIds: new Set([301]),
    });

    // Delete selected node 301
    useCircuitStore.getState().deleteSelection();

    const state = useCircuitStore.getState();
    expect(state.nodes.length).toBe(1);
    expect(state.nodes[0].id).toBe(302);
    // Wire connected to 301 must be deleted
    expect(state.wires.length).toBe(0);
    expect(state.selectedNodeIds.size).toBe(0);
  });

  it("should rotate multi-node selection around collective bounding box center", () => {
    // Two nodes placed horizontally: node 1 at (60, 90), node 2 at (120, 90)
    // Bounding box center: ((60+120)/2, (90+90)/2) = (90, 90)
    const node1: CircuitNode = {
      id: 501,
      componentId: "switchNO",
      name: "Switch 1",
      category: "switches",
      tag: "-S1",
      comment: null,
      position: { x: 60, y: 90 },
      rotation: 0,
      frameIndex: 0,
    };

    const node2: CircuitNode = {
      id: 502,
      componentId: "switchNO",
      name: "Switch 2",
      category: "switches",
      tag: "-S2",
      comment: null,
      position: { x: 120, y: 90 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [node1, node2],
      selectedNodeIds: new Set([501, 502]),
    });

    // Rotate CW 90°:
    // Relative to center (90, 90):
    // node 1: dx = -30, dy = 0 -> (dx', dy') = (-dy, dx) = (0, -30) -> position (90, 60)
    // node 2: dx = +30, dy = 0 -> (dx', dy') = (0, +30) -> position (90, 120)
    useCircuitStore.getState().rotateSelectedNodes("cw");

    const updated = useCircuitStore.getState().nodes;
    const n1 = updated.find((n) => n.id === 501);
    const n2 = updated.find((n) => n.id === 502);

    expect(n1?.position).toEqual({ x: 90, y: 60 });
    expect(n1?.rotation).toBe(1);

    expect(n2?.position).toEqual({ x: 90, y: 120 });
    expect(n2?.rotation).toBe(1);
  });

  it("should synchronize duplicated tags when coil and auxiliary contact are duplicated together", () => {
    const coilNode: CircuitNode = {
      id: 601,
      componentId: "coil",
      name: "Main Contactor",
      category: "coils",
      tag: "-KM1",
      comment: null,
      position: { x: 90, y: 90 },
      rotation: 0,
      frameIndex: 0,
    };

    const contactNode: CircuitNode = {
      id: 602,
      componentId: "contactNO",
      name: "Auxiliary Contact",
      category: "contacts",
      tag: "-KM1",
      comment: null,
      position: { x: 150, y: 90 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [coilNode, contactNode],
      selectedNodeIds: new Set([601, 602]),
    });

    useCircuitStore.getState().duplicateSelection();

    const updated = useCircuitStore.getState().nodes;
    expect(updated.length).toBe(4);

    const newCoil = updated.find((n) => n.id !== 601 && n.componentId === "coil");
    const newContact = updated.find((n) => n.id !== 602 && n.componentId === "contactNO");

    expect(newCoil).toBeDefined();
    expect(newContact).toBeDefined();

    // Both new nodes must share the same incremented tag -KM2!
    expect(newCoil?.tag).toBe("-KM2");
    expect(newContact?.tag).toBe("-KM2");
  });

  it("should update node tag and comment via updateNodeData", () => {
    const testNode: CircuitNode = {
      id: 701,
      componentId: "coil",
      name: "Contactor Coil",
      category: "coils",
      tag: "-KM1",
      comment: "Old Comment",
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [testNode],
    });

    useCircuitStore.getState().updateNodeData(701, {
      tag: "-KA1",
      comment: "Control Relay",
    });

    const updated = useCircuitStore.getState().nodes.find((n) => n.id === 701);
    expect(updated?.tag).toBe("-KA1");
    expect(updated?.comment).toBe("Control Relay");
  });

  it("should update timer delay settings (valueTimeOn / valueTimeOff) via updateNodeData", () => {
    const timerNode: CircuitNode = {
      id: 702,
      componentId: "coilDelayOn",
      name: "On-Delay Timer",
      category: "coils",
      tag: "-KT1",
      comment: "Pump Delay",
      position: { x: 150, y: 150 },
      rotation: 0,
      frameIndex: 0,
      valueTimeOn: 3,
    };

    useCircuitStore.setState({
      nodes: [timerNode],
    });

    useCircuitStore.getState().updateNodeData(702, {
      tag: "-KT2",
      comment: "Updated Delay",
      valueTimeOn: 5.5,
      valueTimeOff: 5.5,
    });

    const updated = useCircuitStore.getState().nodes.find((n) => n.id === 702);
    expect(updated?.tag).toBe("-KT2");
    expect(updated?.comment).toBe("Updated Delay");
    expect(updated?.valueTimeOn).toBe(5.5);
    expect(updated?.valueTimeOff).toBe(5.5);
  });

  it("should couple paired auxiliary NO and NC contacts when TOR is toggled via toggleComponentState", () => {
    const torNode: CircuitNode = {
      id: 801,
      componentId: "overload3p",
      name: "Overload Relay 3P",
      category: "protections",
      tag: "-F1",
      comment: null,
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 0,
    };

    const auxNCNode: CircuitNode = {
      id: 802,
      componentId: "contactNC",
      name: "Contact NC",
      category: "auxiliaries",
      tag: "-F1",
      comment: "95-96",
      position: { x: 200, y: 100 },
      rotation: 0,
      frameIndex: 0,
    };

    const auxNONode: CircuitNode = {
      id: 803,
      componentId: "contactNO",
      name: "Contact NO",
      category: "auxiliaries",
      tag: "-F1",
      comment: "97-98",
      position: { x: 300, y: 100 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [torNode, auxNCNode, auxNONode],
      wires: [],
    });

    // 1. Click / toggle TOR -> Tripped (frameIndex 1)
    useCircuitStore.getState().toggleComponentState(801);

    let nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 801)?.frameIndex).toBe(1);
    expect(nodes.find((n) => n.id === 802)?.frameIndex).toBe(1); // NC opened
    expect(nodes.find((n) => n.id === 803)?.frameIndex).toBe(1); // NO closed

    // 2. Click / toggle TOR again -> Reset (frameIndex 0)
    useCircuitStore.getState().toggleComponentState(801);

    nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 801)?.frameIndex).toBe(0);
    expect(nodes.find((n) => n.id === 802)?.frameIndex).toBe(0); // NC closed back
    expect(nodes.find((n) => n.id === 803)?.frameIndex).toBe(0); // NO opened back
  });

  it("should delete selected node when deleteSelection is called", () => {
    const testNode: CircuitNode = {
      id: 901,
      componentId: "coil",
      name: "Coil to delete",
      category: "coils",
      tag: "-KM1",
      comment: "Delete me",
      position: { x: 50, y: 50 },
      rotation: 0,
      frameIndex: 0,
    };

    useCircuitStore.setState({
      nodes: [testNode],
      selectedNodeIds: new Set([901]),
    });

    useCircuitStore.getState().deleteSelection();
    expect(useCircuitStore.getState().nodes.length).toBe(0);
  });

  it("should couple momentary panel pushbutton to circuit switch with the same tag", () => {
    const panelBtn: CircuitNode = {
      id: 1001,
      componentId: "panelButtonMomentary",
      name: "Panel Pushbutton",
      category: "panel",
      tag: "-SB1",
      comment: "Start HMI",
      position: { x: 50, y: 50 },
      rotation: 0,
      frameIndex: 0,
    };

    const circuitSwitchNO: CircuitNode = {
      id: 1002,
      componentId: "switchNO",
      name: "Normally Open Switch",
      category: "switches",
      tag: "-SB1",
      comment: "Rung 1 Start",
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 0,
      isClosed: false,
    };

    useCircuitStore.setState({
      nodes: [panelBtn, circuitSwitchNO],
      wires: [],
      isSimulating: false,
    });

    // Press down panel button
    useCircuitStore.getState().setComponentPressed(1001, true);
    let nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1001)?.isPressed).toBe(true);
    expect(nodes.find((n) => n.id === 1002)?.isClosed).toBe(true);
    expect(nodes.find((n) => n.id === 1002)?.frameIndex).toBe(1);

    // Release panel button
    useCircuitStore.getState().setComponentPressed(1001, false);
    nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1001)?.isPressed).toBe(false);
    expect(nodes.find((n) => n.id === 1002)?.isClosed).toBe(false);
    expect(nodes.find((n) => n.id === 1002)?.frameIndex).toBe(0);
  });

  it("should couple latching panel switch to circuit switch with the same tag", () => {
    const panelSwitch: CircuitNode = {
      id: 1101,
      componentId: "panelButtonLatching",
      name: "Panel Switch Latching",
      category: "panel",
      tag: "-SA1",
      comment: "Selector Switch",
      position: { x: 50, y: 50 },
      rotation: 0,
      frameIndex: 0,
    };

    const circuitSwitchNC: CircuitNode = {
      id: 1102,
      componentId: "switchNC",
      name: "Normally Closed Switch",
      category: "switches",
      tag: "-SA1",
      comment: "Emergency Bypass",
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 0,
      isClosed: true,
    };

    useCircuitStore.setState({
      nodes: [panelSwitch, circuitSwitchNC],
      wires: [],
      isSimulating: false,
    });

    // Toggle latching switch ON (frame 0 -> 1)
    useCircuitStore.getState().toggleComponentState(1101);
    let nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1101)?.frameIndex).toBe(1);
    expect(nodes.find((n) => n.id === 1102)?.isClosed).toBe(false); // NC opens when active

    // Toggle latching switch OFF (frame 1 -> 0)
    useCircuitStore.getState().toggleComponentState(1101);
    nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1101)?.frameIndex).toBe(0);
    expect(nodes.find((n) => n.id === 1102)?.isClosed).toBe(true); // NC closes back
  });

  it("should update panel lamp color and synchronize energized state with circuit lamp of same tag", () => {
    const circuitLamp: CircuitNode = {
      id: 1201,
      componentId: "lamp",
      name: "Circuit Lamp",
      category: "loads",
      tag: "-HL1",
      comment: "Pump Running Indicator",
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 1,
      isEnergized: true,
    };

    const panelLamp: CircuitNode = {
      id: 1202,
      componentId: "panelLamp",
      name: "Panel Lamp",
      category: "panel",
      tag: "-HL1",
      comment: null,
      position: { x: 200, y: 100 },
      rotation: 0,
      frameIndex: 0,
      isEnergized: false,
      lampColor: "red",
    };

    useCircuitStore.setState({
      nodes: [circuitLamp, panelLamp],
      wires: [],
    });

    // Change lamp color via updateNodeData
    useCircuitStore.getState().updateNodeData(1202, { lampColor: "yellow" });
    expect(useCircuitStore.getState().nodes.find((n) => n.id === 1202)?.lampColor).toBe("yellow");

    // Run simulation step to verify tag-based binding
    const simRes = SimulationEngine.step(useCircuitStore.getState().nodes, []);
    const simPanelLamp = simRes.nodes.find((n) => n.id === 1202);
    expect(simPanelLamp?.isEnergized).toBe(true);
    expect(simPanelLamp?.frameIndex).toBe(1);
  });

  it("should update panel button cap color via updateNodeData", () => {
    const panelBtn: CircuitNode = {
      id: 1301,
      componentId: "panelButtonMomentary",
      name: "Panel Pushbutton",
      category: "panel",
      tag: "-SB1",
      comment: null,
      position: { x: 50, y: 50 },
      rotation: 0,
      frameIndex: 0,
      buttonColor: "green",
    };

    useCircuitStore.setState({
      nodes: [panelBtn],
      wires: [],
    });

    useCircuitStore.getState().updateNodeData(1301, { buttonColor: "red" });
    expect(useCircuitStore.getState().nodes.find((n) => n.id === 1301)?.buttonColor).toBe("red");
  });

  it("should actuate paired NC circuit contact ONLY when panel button is pressed", () => {
    const circuitBtnNC: CircuitNode = {
      id: 1401,
      componentId: "buttonNC",
      name: "Push Button NC",
      category: "switches",
      tag: "-SB2",
      comment: "Stop",
      position: { x: 100, y: 100 },
      rotation: 0,
      frameIndex: 0,
      isClosed: true,
    };

    const panelBtnNC: CircuitNode = {
      id: 1402,
      componentId: "panelButtonMomentary",
      name: "Stop Pushbutton",
      category: "panel",
      tag: "-SB2",
      comment: "HMI Stop",
      position: { x: 200, y: 100 },
      rotation: 0,
      frameIndex: 0,
      buttonColor: "red",
    };

    useCircuitStore.setState({
      nodes: [circuitBtnNC, panelBtnNC],
      wires: [],
      isSimulating: true,
    });

    // 1. In idle state (not pressed), panel button is unpressed and circuit NC contact is closed
    let nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1402)?.isPressed).toBeFalsy();
    expect(nodes.find((n) => n.id === 1401)?.isClosed).toBe(true);

    // 2. Only when panel button is pressed, its state changes to pressed and NC contact opens
    useCircuitStore.getState().setComponentPressed(1402, true);
    nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1402)?.isPressed).toBe(true);
    expect(nodes.find((n) => n.id === 1401)?.isClosed).toBe(false);

    // 3. When released, panel button returns to unpressed and NC contact returns to closed
    useCircuitStore.getState().setComponentPressed(1402, false);
    nodes = useCircuitStore.getState().nodes;
    expect(nodes.find((n) => n.id === 1402)?.isPressed).toBe(false);
    expect(nodes.find((n) => n.id === 1401)?.isClosed).toBe(true);
  });
});
