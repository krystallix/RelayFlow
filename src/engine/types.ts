export type Rotation = 0 | 1 | 2 | 3; // 0=0°, 1=90°, 2=180°, 3=270°

export interface Point {
  x: number;
  y: number;
}

export interface WireMargins {
  start: number;
  center: number;
  end: number;
}

export interface CircuitPort {
  id: number;
  tag: string; // e.g. "A1", "A2", "13", "14", "1", "2", "L1", "N"
  direction: number; // 0=Top, 1=Right, 2=Bottom, 3=Left
  type: string; // "load", "contact", "source", etc.
  dx: number;
  dy: number;
  potential?: string | null; // e.g. "L1", "L2", "L3", "N", "+24V", "-24V", null
}

export interface CircuitNode {
  id: string | number;
  componentId: string; // references components-catalog (e.g. "breaker3p", "coil", "contactNO")
  name: string;
  category: string;
  tag: string | null; // e.g. "-KM1", "-S1", "-F1"
  comment: string | null;
  position: Point;
  rotation: Rotation;
  frameIndex: number; // active visual frame (0=OFF, 1=ON, etc.)
  isClosed?: boolean; // for contacts and switches
  isEnergized?: boolean; // for coils, lamps, motors
  isPressed?: boolean; // temporary pressed state for spring/hold buttons
  timerType?: "delayOn" | "delayOff" | "latch" | "flasher";
  valueTimeOn?: number; // seconds
  valueTimeOff?: number; // seconds
  colorType?: number;
  tagVisibility?: boolean;
  timerElapsed?: number; // current elapsed time in seconds during simulation
  motorDirection?: "cw" | "ccw" | "off"; // active motor rotation direction
}

export interface CircuitWire {
  id: string | number;
  fromNodeId: string | number;
  fromPortId: number;
  toNodeId: string | number;
  toPortId: number;
  margins: WireMargins;
  potential?: string | null;
  isHot?: boolean;
  toWireId?: string | number;
  tapPoint?: Point;
  label?: string | null;
}

export interface RelayFlowProject {
  format: "relayflow";
  version: "1.0.0";
  metadata: {
    title: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
    description?: string;
  };
  settings: {
    gridSize: number;
    wireRouting: "orthogonal" | "bezier";
    theme: "dark" | "light";
  };
  nodes: CircuitNode[];
  wires: CircuitWire[];
}

// Simurelay legacy data types
export interface SmrlHeader {
  simurelay: string;
  "3.0.0.30"?: string;
  created_at: string;
}

export interface SmrlElement {
  type: "ElectricalElement";
  id: number;
  svgData: string; // componentId
  position: { x: number; y: number } | null;
  rotation: number;
  text: string | null;
  tag: string | null;
  comment: string | null;
  value: string | null;
  tagVisibility: boolean;
  valueTimeOn?: number;
  valueTimeOff?: number;
  colorType?: number;
  terminalTags?: string[];
  frameIndex: number;
}

export interface SmrlConnector {
  type: "Connector";
  id: number;
  idElementNode1: number;
  idNode1: number;
  idElementNode2: number;
  idNode2: number;
  margins: {
    start: number;
    center: number;
    end: number;
  };
}

export interface SmrlFile {
  header: SmrlHeader;
  data: Array<SmrlElement | SmrlConnector>;
}
