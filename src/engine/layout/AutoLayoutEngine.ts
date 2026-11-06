import { CircuitNode, CircuitWire, Point, Rotation } from "../types";
import catalogData from "../../constants/components-catalog.json";

const catalog = catalogData as Record<string, any>;

export interface AutoLayoutOptions {
  gridSize?: number;
  rungHeight?: number;
  startX?: number;
  startY?: number;
  railWidth?: number;
}

export type ElementRole =
  | "live_source"    // L1, L2, L3, +24V, etc.
  | "neutral_source" // N, -24V, PE, GND
  | "protection"     // Emergency stop, breaker, fuse, overload
  | "control"        // Push buttons, selector switch, contact NO/NC
  | "actuator"       // Coils, lamps, motors, buzzers
  | "other";

/**
 * Industrial Standard Ladder Diagram Auto-Layout Engine
 * Matches control schematic diagrams (IEC 60617 / NEMA ladder):
 *
 *  [L1 L2 L3] (Live Rails - Top Left)                    [N] (Neutral Rail - Top Right)
 *      │                                                   │
 *      │──────────────────────[ M1~ (Motor) ]──────────────│  (Rung 0)
 *      │                                                   │
 *      ├─[EMG]──[PB]──────────[ -KM1.1 (Coil) ]────────────┤  (Rung 1)
 *      │          ├─[-KM1.2]──┤                            │
 *      │          ├─[-KM1.3]──┤                            │
 *      │          └─[-KM1.4]──┘                            │
 *      │                                                   │
 *      ├───────[ PB ]─────────[ -KM3.1 (Coil) ]────────────┤  (Rung 2)
 *      │                                                   │
 *      ▼ (Live Power Bus)                  (Neutral Bus)   ▼
 */
export class AutoLayoutEngine {
  static getRole(node: CircuitNode): ElementRole {
    const cid = node.componentId.toLowerCase();
    const cat = node.category?.toLowerCase() || "";
    const comp = catalog[node.componentId];

    if (
      cid === "sourcen" ||
      cid === "sourcenegative" ||
      cid === "sourcegnd" ||
      cid === "sourcepe"
    ) {
      return "neutral_source";
    }

    if (
      cat === "sources" ||
      cid.startsWith("source") ||
      cid === "battery"
    ) {
      return "live_source";
    }

    if (
      cid.startsWith("emergency") ||
      cid.startsWith("fuse") ||
      cid.startsWith("breaker") ||
      cid.startsWith("overload") ||
      cat === "protections"
    ) {
      return "protection";
    }

    if (
      cat === "coils" ||
      cat === "loads" ||
      cat === "motors" ||
      comp?.type === "coil" ||
      cid.startsWith("coil") ||
      cid.startsWith("motor") ||
      cid.startsWith("lamp") ||
      cid.includes("buzzer") ||
      cid.includes("horn") ||
      cid.includes("solenoid")
    ) {
      return "actuator";
    }

    return "control";
  }

  static layout(
    nodesInput: CircuitNode[],
    wiresInput: CircuitWire[],
    options: AutoLayoutOptions = {}
  ): { nodes: CircuitNode[]; wires: CircuitWire[] } {
    if (nodesInput.length === 0) return { nodes: [], wires: wiresInput };

    const GRID = options.gridSize || 30;
    const snap = (v: number) => Math.round(v / GRID) * GRID;

    // Standard coordinate boundaries for ladder layout
    const START_X = options.startX !== undefined ? options.startX : 150;
    const START_Y = options.startY !== undefined ? options.startY : 60;
    const TOTAL_WIDTH = options.railWidth || 840; // distance between Left and Right rails
    const RUNG_HEIGHT = options.rungHeight || 90; // vertical step between rungs

    const LEFT_RAIL_X = snap(START_X + 90);
    const RIGHT_RAIL_X = snap(START_X + TOTAL_WIDTH);

    // Clone inputs
    const nodes: CircuitNode[] = nodesInput.map((n) => ({
      ...n,
      position: { ...n.position },
    }));
    const nodeMap = new Map<string | number, CircuitNode>(
      nodes.map((n) => [n.id, n])
    );

    // Build wire adjacency graph
    const adj = new Map<string | number, Set<string | number>>();
    for (const n of nodes) {
      adj.set(n.id, new Set());
    }
    for (const w of wiresInput) {
      adj.get(w.fromNodeId)?.add(w.toNodeId);
      adj.get(w.toNodeId)?.add(w.fromNodeId);
    }

    // Categorize nodes by role
    const liveSources: CircuitNode[] = [];
    const neutralSources: CircuitNode[] = [];
    const protections: CircuitNode[] = [];
    const controls: CircuitNode[] = [];
    const actuators: CircuitNode[] = [];

    for (const n of nodes) {
      const role = AutoLayoutEngine.getRole(n);
      switch (role) {
        case "live_source":
          liveSources.push(n);
          break;
        case "neutral_source":
          neutralSources.push(n);
          break;
        case "protection":
          protections.push(n);
          break;
        case "actuator":
          actuators.push(n);
          break;
        case "control":
        default:
          controls.push(n);
          break;
      }
    }

    const assignedNodeIds = new Set<string | number>();

    // 1. Position Power Sources at Top
    // Live sources (L1, L2, L3, +24V) on the Top Left
    liveSources.forEach((src, idx) => {
      src.position = {
        x: snap(START_X + idx * 30),
        y: snap(START_Y),
      };
      // Keep standard source orientation or rotation 0/2
      if (src.componentId === "sourceL1L2L3" || src.componentId === "sourceL1L2L3N") {
        src.rotation = 2; // downward connection pins
      }
      assignedNodeIds.add(src.id);
    });

    // Neutral sources (N, -24V, PE) on the Top Right
    neutralSources.forEach((src, idx) => {
      src.position = {
        x: snap(RIGHT_RAIL_X + idx * 30),
        y: snap(START_Y),
      };
      assignedNodeIds.add(src.id);
    });

    // If source is a multi-phase combined source (e.g. sourceL1L2L3N), place it at top left
    const combinedSource = liveSources.find((s) => s.componentId === "sourceL1L2L3N");
    if (combinedSource && neutralSources.length === 0) {
      // The N pin is already port 3 on this source
    }

    let currentY = snap(START_Y + 120);

    // 2. Identify and place Rungs
    // In ladder logic, each actuator (Coil, Motor, Lamp) defines an output on the right.
    // Upstream controls/buttons/contacts connect from the left rail to the actuator.

    // Position major actuators (Motors, Power loads) on top rungs
    const motors = actuators.filter((a) => a.componentId.toLowerCase().startsWith("motor"));
    const coilsAndLamps = actuators.filter((a) => !a.componentId.toLowerCase().startsWith("motor"));

    // Function to rotate a 2-port in-line component horizontally (rotation 1 = 90 deg clockwise)
    const orientHorizontal = (node: CircuitNode) => {
      const comp = catalog[node.componentId];
      // Most 2-terminal buttons, switches, contacts, coils, and lamps have dx:0, dy:-60 / +60
      // Rotating 90 deg (rotation 1) makes terminals point horizontally (Left & Right)
      if (comp?.nodes && comp.nodes.length === 2) {
        node.rotation = 1 as Rotation;
      }
    };

    // Place Motors on upper horizontal rungs
    motors.forEach((motor) => {
      motor.position = {
        x: snap(RIGHT_RAIL_X - 120),
        y: currentY,
      };
      assignedNodeIds.add(motor.id);

      // Check if there are protections connected in series (like Motor breaker or contactor)
      const nbrs = adj.get(motor.id) || new Set();
      let ctrlOffset = 0;
      for (const nbrId of nbrs) {
        const nbr = nodeMap.get(nbrId);
        if (nbr && !assignedNodeIds.has(nbr.id) && (nbr.category === "protections" || nbr.category === "switches")) {
          nbr.position = {
            x: snap(LEFT_RAIL_X + 150 + ctrlOffset * 150),
            y: currentY,
          };
          orientHorizontal(nbr);
          assignedNodeIds.add(nbr.id);
          ctrlOffset++;
        }
      }

      currentY += snap(RUNG_HEIGHT + 30);
    });

    // Group remaining coils/lamps and their controlling contacts/buttons
    interface LadderRung {
      actuators: CircuitNode[];
      mainControls: CircuitNode[];
      branchControls: CircuitNode[][];
    }

    const rungs: LadderRung[] = [];

    // Group actuators by shared input or tag
    coilsAndLamps.forEach((actuator) => {
      if (assignedNodeIds.has(actuator.id)) return;

      const nbrs = Array.from(adj.get(actuator.id) || []);
      const upstream: CircuitNode[] = [];

      for (const nbrId of nbrs) {
        const nbr = nodeMap.get(nbrId);
        if (
          nbr &&
          !assignedNodeIds.has(nbr.id) &&
          (AutoLayoutEngine.getRole(nbr) === "control" || AutoLayoutEngine.getRole(nbr) === "protection")
        ) {
          upstream.push(nbr);
        }
      }

      // Check if multiple coils/lamps share the same parallel rung (like -KM1.1, -KM1.2, -KM1.3...)
      const tagPrefix = actuator.tag ? actuator.tag.split(".")[0] : actuator.id;
      const existingRung = rungs.find((r) =>
        r.actuators.some((a) => a.tag && a.tag.split(".")[0] === tagPrefix)
      );

      if (existingRung && rungs.length > 0) {
        existingRung.actuators.push(actuator);
      } else {
        rungs.push({
          actuators: [actuator],
          mainControls: upstream,
          branchControls: [],
        });
      }
      assignedNodeIds.add(actuator.id);
    });

    // Global main master controls (e.g. Emergency stop or Main power switch)
    const masterControls = protections.filter((p) => !assignedNodeIds.has(p.id));
    if (masterControls.length > 0) {
      masterControls.forEach((mc, idx) => {
        mc.position = {
          x: snap(LEFT_RAIL_X + 60 + idx * 120),
          y: currentY,
        };
        orientHorizontal(mc);
        assignedNodeIds.add(mc.id);
      });
      // Line bus drops down after master control
    }

    // Place each ladder rung from Top to Bottom
    rungs.forEach((rung) => {
      const rungStartY = currentY;

      // 1. Controls on the Left side of the rung
      let ctrlX = snap(LEFT_RAIL_X + (masterControls.length > 0 ? 120 : 60));
      rung.mainControls.forEach((ctrl) => {
        if (!assignedNodeIds.has(ctrl.id)) {
          ctrl.position = { x: ctrlX, y: rungStartY };
          orientHorizontal(ctrl);
          assignedNodeIds.add(ctrl.id);
          ctrlX += snap(120);
        }
      });

      // 2. Actuators (Coils / Lamps) on the Right side of the rung
      // If multiple coils or lamps in parallel (e.g. -KM1.1, -KM1.2, -KM1.3 as in user's diagram),
      // stack them neatly vertically aligned at the same X
      const actuatorX = snap(RIGHT_RAIL_X - 120);

      rung.actuators.forEach((act, actIdx) => {
        const actY = snap(rungStartY + actIdx * RUNG_HEIGHT);
        act.position = { x: actuatorX, y: actY };
        orientHorizontal(act);
        assignedNodeIds.add(act.id);
      });

      const rungTotalHeight = Math.max(1, rung.actuators.length) * RUNG_HEIGHT;
      currentY += snap(rungTotalHeight + 30);
    });

    // 3. Place any remaining controls or nodes not part of a traced rung
    const unassignedControls = controls.filter((c) => !assignedNodeIds.has(c.id));
    if (unassignedControls.length > 0) {
      unassignedControls.forEach((c) => {
        c.position = {
          x: snap(LEFT_RAIL_X + 60),
          y: currentY,
        };
        orientHorizontal(c);
        assignedNodeIds.add(c.id);
        currentY += snap(RUNG_HEIGHT);
      });
    }

    const remainingNodes = nodes.filter((n) => !assignedNodeIds.has(n.id));
    remainingNodes.forEach((rem, idx) => {
      rem.position = {
        x: snap(LEFT_RAIL_X + 60 + (idx % 3) * 150),
        y: snap(currentY + Math.floor(idx / 3) * RUNG_HEIGHT),
      };
      orientHorizontal(rem);
    });

    // Reset wire margins so orthogonal router routes cleanly between newly aligned pins
    const wires = wiresInput.map((w) => ({
      ...w,
      margins: { start: 0, center: 0, end: 0 },
    }));

    return { nodes, wires };
  }
}
