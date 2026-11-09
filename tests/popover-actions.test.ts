import { describe, it, expect, beforeEach } from "vitest";
import { useCircuitStore } from "../src/store/useCircuitStore";
import { CircuitNode, CircuitWire } from "../src/engine/types";

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
});
