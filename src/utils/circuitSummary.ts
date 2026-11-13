import { CircuitNode } from "@/engine/types";

export interface SummaryItem {
  type: string;
  total: number;
}

export interface DetailedHardwareItem {
  id: string; // group tag or node id
  tag: string;
  type: string;
  category: string;
  comment?: string | null;
  nodes: CircuitNode[];
  // Telemetry details
  isEnergized?: boolean;
  isClosed?: boolean;
  timerElapsed?: number;
  timerPreset?: number;
  timerType?: string;
  motorDirection?: "cw" | "ccw" | "off";
  subElements: Array<{
    nodeId: string | number;
    name: string;
    role: "coil" | "main-contact" | "aux-no" | "aux-nc" | "overload" | "element";
    state: string;
    isEnergized?: boolean;
    isClosed?: boolean;
  }>;
}

/**
 * Checks if a component ID is a virtual CAD symbol (junctions, text, arrows).
 */
export function isVirtualSymbol(cid: string): boolean {
  const c = (cid || "").toLowerCase();
  return c.startsWith("junction") || c.startsWith("arrow") || c === "text";
}

/**
 * Classifies a single independent component by its category/componentId.
 */
export function classifyDeviceType(cid: string, name: string, cat: string): string {
  const c = cid.toLowerCase();
  const n = (name || "").toLowerCase();

  if (c.includes("overload")) return "Thermal Overload";
  if (c.includes("delay") || c.includes("flasher") || n.includes("timer")) return "Timer";
  if (cat === "contactors" || c.includes("contactor")) return "Contactor";
  if (cat === "coils" || cat === "auxiliaries") return "Relay";
  if (c.includes("phasefailure")) return "Phase Failure Relay";

  if (cat === "protections" || c.includes("breaker") || c.includes("fuse") || c.includes("isolator")) {
    if (c.includes("fuse")) return "Fuse";
    if (c.includes("isolator")) return "Isolator";
    return "MCB";
  }

  if (cat === "motors" || c.includes("motor")) {
    if (c.includes("twospeeds") || n.includes("two speeds") || n.includes("2 phase") || n.includes("2-phase")) return "Motor 2 Phase";
    if (c.includes("3ph") || c.includes("dhalander") || c.includes("stardelta") || n.includes("three-phase") || n.includes("3-phase")) return "Motor 3 Phase";
    if (c.includes("1ph") || n.includes("single-phase") || n.includes("1-phase")) return "Motor 1 Phase";
    if (c.includes("dc")) return "Motor DC";
    return "Motor";
  }

  if (cat === "switches" || c.includes("button") || c.includes("switch")) {
    if (c.includes("button") || c.includes("emergency")) return "Push Button";
    return "Switch";
  }

  if (cat === "loads" || c.includes("lamp") || c.includes("light") || c.includes("buzzer") || c.includes("siren") || c.includes("ring")) {
    if (c.includes("lamp") || c.includes("light") || n.includes("light")) return "Lamp";
    return "Buzzer";
  }

  if (cat === "sources" || c.includes("source") || c.includes("battery") || c.includes("power") || c.includes("generator")) {
    if (c.includes("generator")) return "Generator";
    if (c.includes("battery")) return "Battery";
    if (c.includes("powersupply")) return "Power Supply";
    return "Power Source";
  }

  if (c === "diode") return "Diode";
  return name || "Other";
}

/**
 * Calculates a concise summary of physical components present in the circuit.
 * Coupled contacts, coils, contactors, and overloads sharing the same tag are
 * grouped into a single physical component (Contactor, Relay, Thermal Overload, or Timer).
 * Virtual symbols (junctions, text annotations, destination arrows) are excluded.
 */
export function getCircuitComponentSummary(nodes: CircuitNode[]): [string, number][] {
  const coupledGroups = new Map<string, CircuitNode[]>();
  const independentNodes: CircuitNode[] = [];

  for (const n of nodes) {
    const cid = (n.componentId || "").toLowerCase();
    const cat = n.category || "";
    const name = (n.name || "").toLowerCase();

    if (isVirtualSymbol(cid)) continue;

    const isOverload = cid.includes("overload") || name.includes("overload");
    const isContactor = cat === "contactors" || cid.includes("contactor") || name.includes("contactor");
    const isCoilOrContact = cat === "coils" || cat === "auxiliaries" || isContactor || isOverload;

    const tag = n.tag ? n.tag.trim().toUpperCase() : "";

    if (isCoilOrContact && tag) {
      if (!coupledGroups.has(tag)) coupledGroups.set(tag, []);
      coupledGroups.get(tag)!.push(n);
    } else {
      independentNodes.push(n);
    }
  }

  const counts = new Map<string, number>();
  const inc = (type: string) => counts.set(type, (counts.get(type) || 0) + 1);

  // Group coupled elements (contacts & coils) sharing the same tag into 1 physical component
  for (const [, group] of coupledGroups.entries()) {
    const hasOverload = group.some(
      (n) => (n.componentId || "").toLowerCase().includes("overload") || (n.name || "").toLowerCase().includes("overload")
    );
    const hasTimer = group.some((n) => {
      const c = (n.componentId || "").toLowerCase();
      const nm = (n.name || "").toLowerCase();
      return c.includes("delay") || c.includes("flasher") || nm.includes("timer");
    });
    const hasContactor = group.some(
      (n) => n.category === "contactors" || (n.componentId || "").toLowerCase().includes("contactor") || (n.name || "").toLowerCase().includes("contactor")
    );

    if (hasOverload) {
      inc("Thermal Overload");
    } else if (hasTimer) {
      inc("Timer");
    } else if (hasContactor) {
      inc("Contactor");
    } else {
      inc("Relay");
    }
  }

  for (const n of independentNodes) {
    const type = classifyDeviceType(n.componentId || "", n.name || "", n.category || "");
    inc(type);
  }

  return Array.from(counts.entries());
}

/**
 * Returns detailed hardware telemetry and sub-elements breakdown for the Hardware Sheet Drawer.
 */
export function getDetailedHardwareList(nodes: CircuitNode[]): DetailedHardwareItem[] {
  const coupledGroups = new Map<string, CircuitNode[]>();
  const independentNodes: CircuitNode[] = [];

  for (const n of nodes) {
    const cid = (n.componentId || "").toLowerCase();
    const cat = n.category || "";
    const name = (n.name || "").toLowerCase();

    if (isVirtualSymbol(cid)) continue;

    const isOverload = cid.includes("overload") || name.includes("overload");
    const isContactor = cat === "contactors" || cid.includes("contactor") || name.includes("contactor");
    const isCoilOrContact = cat === "coils" || cat === "auxiliaries" || isContactor || isOverload;

    const tag = n.tag ? n.tag.trim().toUpperCase() : "";

    if (isCoilOrContact && tag) {
      if (!coupledGroups.has(tag)) coupledGroups.set(tag, []);
      coupledGroups.get(tag)!.push(n);
    } else {
      independentNodes.push(n);
    }
  }

  const items: DetailedHardwareItem[] = [];

  // 1. Process Coupled Groups
  for (const [tag, group] of coupledGroups.entries()) {
    const hasOverload = group.some(
      (n) => (n.componentId || "").toLowerCase().includes("overload") || (n.name || "").toLowerCase().includes("overload")
    );
    const timerNode = group.find((n) => {
      const c = (n.componentId || "").toLowerCase();
      const nm = (n.name || "").toLowerCase();
      return c.includes("delay") || c.includes("flasher") || nm.includes("timer");
    });
    const hasContactor = group.some(
      (n) => n.category === "contactors" || (n.componentId || "").toLowerCase().includes("contactor") || (n.name || "").toLowerCase().includes("contactor")
    );

    let type = "Relay";
    let category = "coils";
    if (hasOverload) {
      type = "Thermal Overload";
      category = "protections";
    } else if (timerNode) {
      type = "Timer";
      category = "coils";
    } else if (hasContactor) {
      type = "Contactor";
      category = "contactors";
    }

    const coilNode = group.find((n) => n.category === "coils" || n.componentId.toLowerCase().includes("coil"));
    const isEnergized = group.some((n) => n.isEnergized);
    const comment = group.find((n) => n.comment?.trim())?.comment || null;

    const subElements = group.map((n) => {
      const cid = n.componentId.toLowerCase();
      let role: DetailedHardwareItem["subElements"][0]["role"] = "element";
      if (cid.includes("coil")) role = "coil";
      else if (n.category === "contactors" || cid.includes("contactor")) role = "main-contact";
      else if (cid.includes("overload")) role = "overload";
      else if (cid.includes("nc")) role = "aux-nc";
      else if (cid.includes("no")) role = "aux-no";

      let state = "Normal";
      if (role === "coil") {
        state = n.isEnergized ? "Energized" : "De-energized";
      } else if (role === "main-contact" || role === "aux-no" || role === "aux-nc") {
        state = n.isClosed ? "Closed" : "Open";
      } else if (role === "overload") {
        state = n.isClosed ? "Tripped" : "Normal";
      }

      return {
        nodeId: n.id,
        name: n.name,
        role,
        state,
        isEnergized: n.isEnergized,
        isClosed: n.isClosed,
      };
    });

    items.push({
      id: tag,
      tag,
      type,
      category,
      comment,
      nodes: group,
      isEnergized,
      timerElapsed: timerNode?.timerElapsed,
      timerPreset: timerNode?.valueTimeOn || timerNode?.valueTimeOff || 3,
      timerType: timerNode?.timerType,
      subElements,
    });
  }

  // 2. Process Independent Nodes
  for (const n of independentNodes) {
    const type = classifyDeviceType(n.componentId || "", n.name || "", n.category || "");
    const tag = n.tag ? n.tag.trim() : "";
    const cid = n.componentId.toLowerCase();

    let state = "Normal";
    if (n.category === "motors") {
      state = n.motorDirection ? n.motorDirection.toUpperCase() : n.isEnergized ? "ON" : "OFF";
    } else if (n.category === "loads") {
      state = n.isEnergized ? "ON" : "OFF";
    } else if (n.category === "protections" || n.category === "switches") {
      state = n.isClosed ? "CLOSED" : "OPEN";
    } else if (n.category === "coils") {
      state = n.isEnergized ? "Energized" : "De-energized";
    }

    items.push({
      id: String(n.id),
      tag: tag || "-",
      type,
      category: n.category,
      comment: n.comment || null,
      nodes: [n],
      isEnergized: n.isEnergized,
      isClosed: n.isClosed,
      motorDirection: n.motorDirection,
      timerElapsed: n.timerElapsed,
      timerPreset: n.valueTimeOn || n.valueTimeOff,
      timerType: n.timerType,
      subElements: [
        {
          nodeId: n.id,
          name: n.name,
          role: "element",
          state,
          isEnergized: n.isEnergized,
          isClosed: n.isClosed,
        },
      ],
    });
  }

  return items;
}
