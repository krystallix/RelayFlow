import { CircuitNode } from "@/engine/types";

export interface SummaryItem {
  type: string;
  total: number;
}

export interface BomVariantItem {
  key: string;
  label: string;
  description: string;
  quantity: number;
  tags: string[];
  warning?: string;
}

export interface BomCategoryGroup {
  type: string;
  total: number;
  variants: BomVariantItem[];
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
  contactSummary?: string;
  subElements: Array<{
    nodeId: string | number;
    name: string;
    role: "coil" | "main-contact" | "aux-no" | "aux-nc" | "aux-nonc" | "aux-co" | "overload" | "element";
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
 * Strictly checks if a node is a Power Contactor main contact block (e.g. contactor1p..4p, contactorNC1p..4p).
 * Auxiliary contacts (category === "auxiliaries") such as "On-Delay Contact NO for Contactors" are NOT power contactors.
 */
export function isPowerContactorNode(n: CircuitNode): boolean {
  const cid = (n.componentId || "").toLowerCase();
  return n.category === "contactors" || cid.startsWith("contactor");
}

export function isOverloadNode(n: CircuitNode): boolean {
  const cid = (n.componentId || "").toLowerCase();
  const name = (n.name || "").toLowerCase();
  return cid.includes("overload") || name.includes("overload");
}

export function isTimerCoilNode(n: CircuitNode): boolean {
  const cid = (n.componentId || "").toLowerCase();
  return (
    cid === "coildelayon" ||
    cid === "coildelayoff" ||
    cid === "coildelayonoff" ||
    cid === "coilflasher"
  );
}

export function isRelayCoilNode(n: CircuitNode): boolean {
  const cid = (n.componentId || "").toLowerCase();
  return (
    (n.category === "coils" || cid.startsWith("coil")) &&
    !isTimerCoilNode(n) &&
    !cid.includes("solenoid")
  );
}

export function isAuxiliaryContactNode(n: CircuitNode): boolean {
  const cid = (n.componentId || "").toLowerCase();
  return (
    n.category === "auxiliaries" ||
    (cid.startsWith("contact") && !cid.startsWith("contactor"))
  );
}

export function extractContactorPoles(n: CircuitNode): string {
  const cid = (n.componentId || "").toLowerCase();
  const match = cid.match(/(\d)p$/);
  return match ? `${match[1]}P` : "3P";
}

export function getTimerSubtypeLabel(n: CircuitNode): string {
  const cid = (n.componentId || "").toLowerCase();
  if (cid === "coildelayon") return "On-Delay Timer";
  if (cid === "coildelayoff") return "Off-Delay Timer";
  if (cid === "coildelayonoff") return "On-Off-Delay Timer";
  if (cid === "coilflasher") return "Flasher Timer";
  return "Timer";
}

export interface AuxContactCounts {
  no: number;
  nc: number;
  co: number;
  totalContacts: number;
}

/**
 * Counts auxiliary contacts (NO, NC, NO+NC, Changeover) in a coupled component group.
 */
export function countAuxiliaryContacts(group: CircuitNode[]): AuxContactCounts {
  let no = 0;
  let nc = 0;
  let co = 0;
  let totalContacts = 0;

  for (const n of group) {
    if (!isAuxiliaryContactNode(n)) continue;
    const cid = (n.componentId || "").toLowerCase();
    if (cid.startsWith("contactnonc")) {
      no += 1;
      nc += 1;
      totalContacts += 2;
    } else if (cid.startsWith("contactcon")) {
      co += 1;
      totalContacts += 1;
    } else if (cid.startsWith("contactnc")) {
      nc += 1;
      totalContacts += 1;
    } else if (cid.startsWith("contactno")) {
      no += 1;
      totalContacts += 1;
    }
  }

  return { no, nc, co, totalContacts };
}

export function formatAuxContactDescription(counts: AuxContactCounts): string {
  const parts: string[] = [];
  if (counts.no > 0) parts.push(`${counts.no} NO`);
  if (counts.nc > 0) parts.push(`${counts.nc} NC`);
  if (counts.co > 0) parts.push(`${counts.co} CO (NO/NC)`);
  return parts.join(" ");
}

/**
 * Classifies a single independent (untagged or non-coupled) component by its category/componentId.
 */
export function classifyDeviceType(cid: string, name: string, cat: string): string {
  const c = cid.toLowerCase();
  const n = (name || "").toLowerCase();

  if (c.includes("overload")) return "Thermal Overload";
  if (c === "coildelayon" || c === "coildelayoff" || c === "coildelayonoff" || c === "coilflasher") return "Timer";
  if (c.includes("solenoid")) return "Solenoid";
  if (cat === "contactors" || c.startsWith("contactor")) return "Contactor";
  if (cat === "coils" || c.startsWith("coil")) return "Relay";
  if (cat === "auxiliaries" || (c.startsWith("contact") && !c.startsWith("contactor"))) {
    return "Auxiliary Contact (Untagged)";
  }
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

function partitionNodesForBom(nodes: CircuitNode[]) {
  const coupledGroups = new Map<string, CircuitNode[]>();
  const independentNodes: CircuitNode[] = [];

  for (const n of nodes) {
    const cid = (n.componentId || "").toLowerCase();
    if (isVirtualSymbol(cid)) continue;

    const isCouplable =
      isPowerContactorNode(n) ||
      isOverloadNode(n) ||
      isTimerCoilNode(n) ||
      isRelayCoilNode(n) ||
      isAuxiliaryContactNode(n);

    const tag = n.tag ? n.tag.trim().toUpperCase() : "";

    if (isCouplable && tag) {
      if (!coupledGroups.has(tag)) coupledGroups.set(tag, []);
      coupledGroups.get(tag)!.push(n);
    } else {
      independentNodes.push(n);
    }
  }

  return { coupledGroups, independentNodes };
}

/**
 * Generates structured BOM categories with expandable sub-variants for Relays, Contactors, and Timers.
 * - Power Contactor: requires a power contactor block (category === "contactors") coupled with its coil (same tag).
 * - Relay: relay coil + auxiliary contacts sharing the same tag, grouped by contact count & NO/NC configuration.
 * - Timer: timer coil + timed/aux contacts sharing the same tag.
 */
export function getDetailedBomGroups(nodes: CircuitNode[]): BomCategoryGroup[] {
  const { coupledGroups, independentNodes } = partitionNodesForBom(nodes);
  const categoryMap = new Map<string, { total: number; variantMap: Map<string, BomVariantItem> }>();

  const addEntry = (
    type: string,
    variant?: { key: string; label: string; description: string; tag?: string; warning?: string }
  ) => {
    if (!categoryMap.has(type)) {
      categoryMap.set(type, { total: 0, variantMap: new Map() });
    }
    const entry = categoryMap.get(type)!;
    entry.total += 1;

    if (variant) {
      const existing = entry.variantMap.get(variant.key);
      if (existing) {
        existing.quantity += 1;
        if (variant.tag && !existing.tags.includes(variant.tag)) {
          existing.tags.push(variant.tag);
        }
      } else {
        entry.variantMap.set(variant.key, {
          key: variant.key,
          label: variant.label,
          description: variant.description,
          quantity: 1,
          tags: variant.tag ? [variant.tag] : [],
          warning: variant.warning,
        });
      }
    }
  };

  for (const [tag, group] of coupledGroups.entries()) {
    const hasOverload = group.some(isOverloadNode);
    const timerNode = group.find(isTimerCoilNode);
    const powerContactorNodes = group.filter(isPowerContactorNode);
    const hasPowerContactor = powerContactorNodes.length > 0;
    const hasCoil = group.some((n) => isRelayCoilNode(n) || isTimerCoilNode(n));
    const auxCounts = countAuxiliaryContacts(group);
    const auxDesc = formatAuxContactDescription(auxCounts);

    if (hasOverload) {
      const desc = auxDesc ? `Overload · ${auxDesc}` : "Thermal Overload";
      addEntry("Thermal Overload", {
        key: `overload|${desc}`,
        label: auxCounts.totalContacts > 0 ? `Thermal Overload + ${auxCounts.totalContacts} Contact` : "Thermal Overload",
        description: auxDesc || "Main Protection",
        tag,
      });
    } else if (timerNode) {
      const subtype = getTimerSubtypeLabel(timerNode);
      const label =
        auxCounts.totalContacts > 0
          ? `${subtype} ${auxCounts.totalContacts} Contact`
          : `${subtype} (Coil Only)`;
      const desc = auxDesc || "No auxiliary contacts";
      addEntry("Timer", {
        key: `timer|${subtype}|${auxCounts.no}|${auxCounts.nc}|${auxCounts.co}`,
        label,
        description: desc,
        tag,
      });
    } else if (hasPowerContactor) {
      const poles = extractContactorPoles(powerContactorNodes[0]);
      const label =
        auxCounts.totalContacts > 0
          ? `Contactor ${poles} + ${auxCounts.totalContacts} Aux`
          : `Contactor ${poles}`;
      const descParts = [`${poles} Main`];
      if (auxDesc) descParts.push(auxDesc);
      const warning = !hasCoil ? "Missing Coil" : undefined;
      addEntry("Contactor", {
        key: `contactor|${poles}|${auxCounts.no}|${auxCounts.nc}|${auxCounts.co}|${hasCoil ? "1" : "0"}`,
        label,
        description: descParts.join(" · "),
        tag,
        warning,
      });
    } else {
      // Relay (coil + auxiliary contacts sharing the same tag)
      const label =
        auxCounts.totalContacts > 0
          ? `Relay ${auxCounts.totalContacts} Contact`
          : "Relay (Coil Only)";
      const desc = auxDesc || "Coil only (0 Aux)";
      const warning = !hasCoil ? "Missing Coil" : undefined;
      addEntry("Relay", {
        key: `relay|${auxCounts.no}|${auxCounts.nc}|${auxCounts.co}|${hasCoil ? "1" : "0"}`,
        label,
        description: desc,
        tag,
        warning,
      });
    }
  }

  for (const n of independentNodes) {
    const type = classifyDeviceType(n.componentId || "", n.name || "", n.category || "");
    if (type === "Contactor") {
      const poles = extractContactorPoles(n);
      addEntry("Contactor", {
        key: `contactor|${poles}|0|0|0|0`,
        label: `Contactor ${poles}`,
        description: `${poles} Main`,
        tag: n.tag?.trim() || undefined,
        warning: "Missing Coil",
      });
    } else if (type === "Relay") {
      addEntry("Relay", {
        key: "relay|0|0|0|1",
        label: "Relay (Coil Only)",
        description: "Coil only (0 Aux)",
        tag: n.tag?.trim() || undefined,
      });
    } else if (type === "Timer") {
      const subtype = getTimerSubtypeLabel(n);
      addEntry("Timer", {
        key: `timer|${subtype}|0|0|0`,
        label: `${subtype} (Coil Only)`,
        description: "No auxiliary contacts",
        tag: n.tag?.trim() || undefined,
      });
    } else {
      addEntry(type);
    }
  }

  return Array.from(categoryMap.entries()).map(([type, data]) => ({
    type,
    total: data.total,
    variants: Array.from(data.variantMap.values()).sort((a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label)),
  }));
}

/**
 * Calculates a concise summary of physical components present in the circuit.
 * Derived directly from getDetailedBomGroups to guarantee 100% consistency.
 */
export function getCircuitComponentSummary(nodes: CircuitNode[]): [string, number][] {
  return getDetailedBomGroups(nodes).map((g) => [g.type, g.total]);
}

/**
 * Returns detailed hardware telemetry and sub-elements breakdown for the Hardware Sheet Drawer.
 */
export function getDetailedHardwareList(nodes: CircuitNode[]): DetailedHardwareItem[] {
  const { coupledGroups, independentNodes } = partitionNodesForBom(nodes);
  const items: DetailedHardwareItem[] = [];

  // 1. Process Coupled Groups
  for (const [tag, group] of coupledGroups.entries()) {
    const hasOverload = group.some(isOverloadNode);
    const timerNode = group.find(isTimerCoilNode);
    const powerContactorNodes = group.filter(isPowerContactorNode);
    const hasPowerContactor = powerContactorNodes.length > 0;
    const hasCoil = group.some((n) => isRelayCoilNode(n) || isTimerCoilNode(n));
    const auxCounts = countAuxiliaryContacts(group);
    const auxDesc = formatAuxContactDescription(auxCounts);

    let type = "Relay";
    let category = "coils";
    let contactSummary = auxDesc || undefined;

    if (hasOverload) {
      type = "Thermal Overload";
      category = "protections";
    } else if (timerNode) {
      type = "Timer";
      category = "coils";
    } else if (hasPowerContactor) {
      const poles = extractContactorPoles(powerContactorNodes[0]);
      type = "Contactor";
      category = "contactors";
      contactSummary = [`${poles} Main`, auxDesc, !hasCoil ? "Missing Coil" : ""].filter(Boolean).join(" · ");
    } else {
      type = "Relay";
      category = "coils";
      contactSummary = [auxDesc || "Coil Only", !hasCoil ? "Missing Coil" : ""].filter(Boolean).join(" · ");
    }

    const isEnergized = group.some((n) => n.isEnergized);
    const comment = group.find((n) => n.comment?.trim())?.comment || null;

    const subElements = group.map((n) => {
      const cid = (n.componentId || "").toLowerCase();
      let role: DetailedHardwareItem["subElements"][0]["role"] = "element";
      if (isRelayCoilNode(n) || isTimerCoilNode(n)) role = "coil";
      else if (isPowerContactorNode(n)) role = "main-contact";
      else if (isOverloadNode(n)) role = "overload";
      else if (cid.startsWith("contactnonc")) role = "aux-nonc";
      else if (cid.startsWith("contactcon")) role = "aux-co";
      else if (cid.startsWith("contactnc")) role = "aux-nc";
      else if (cid.startsWith("contactno")) role = "aux-no";

      let state = "Normal";
      if (role === "coil") {
        state = n.isEnergized ? "Energized" : "De-energized";
      } else if (
        role === "main-contact" ||
        role === "aux-no" ||
        role === "aux-nc" ||
        role === "aux-nonc" ||
        role === "aux-co"
      ) {
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
      contactSummary,
      subElements,
    });
  }

  // 2. Process Independent Nodes
  for (const n of independentNodes) {
    const type = classifyDeviceType(n.componentId || "", n.name || "", n.category || "");
    const tag = n.tag ? n.tag.trim() : "";

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
