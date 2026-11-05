import { RelayFlowProject } from "@/engine/types";

export const DEFAULT_SIMPLE_LAMP_PROJECT: RelayFlowProject = {
  format: "relayflow",
  version: "1.0.0",
  metadata: {
    title: "Simple Switch & Lamp Circuit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: "RelayFlow",
    description: "Simple switch controlling an indicator lamp",
  },
  settings: {
    gridSize: 30,
    wireRouting: "orthogonal",
    theme: "dark",
  },
  nodes: [
    {
      id: "source-plus",
      componentId: "sourcePlus",
      name: "Power Positive",
      category: "sources",
      tag: "+24V",
      comment: "+24V",
      position: { x: 210, y: 60 },
      rotation: 2, // Rotated 180° so the terminal points down
      frameIndex: 0,
    },
    {
      id: "switch-1",
      componentId: "switchNO",
      name: "Switch NO",
      category: "switches",
      tag: "-S1",
      comment: "Power Switch",
      position: { x: 210, y: 180 },
      rotation: 0,
      frameIndex: 0, // initially open
      isClosed: false,
    },
    {
      id: "lamp-1",
      componentId: "lamp",
      name: "Light",
      category: "loads",
      tag: "-H1",
      comment: "Lamp",
      position: { x: 210, y: 300 },
      rotation: 0,
      frameIndex: 0,
      isEnergized: false,
    },
    {
      id: "source-minus",
      componentId: "sourceNegative",
      name: "Power Negative",
      category: "sources",
      tag: "-24V",
      comment: "-24V",
      position: { x: 210, y: 420 },
      rotation: 0, // Terminal points up
      frameIndex: 0,
    },
  ],
  wires: [
    {
      id: "wire-1",
      fromNodeId: "source-plus",
      fromPortId: 0,
      toNodeId: "switch-1",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    },
    {
      id: "wire-2",
      fromNodeId: "switch-1",
      fromPortId: 1,
      toNodeId: "lamp-1",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    },
    {
      id: "wire-3",
      fromNodeId: "lamp-1",
      fromPortId: 1,
      toNodeId: "source-minus",
      toPortId: 0,
      margins: { start: 0, center: 0, end: 0 },
    },
  ],
};
