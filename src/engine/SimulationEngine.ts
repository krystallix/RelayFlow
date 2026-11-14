import { CircuitNode, CircuitWire, Point, Rotation } from "./types";
import catalogData from "../constants/components-catalog.json";

const catalog = catalogData as Record<string, any>;

export interface SimulationResult {
  nodes: CircuitNode[];
  wires: CircuitWire[];
  shortCircuit: boolean;
  shortCircuitMessage?: string;
  shortCircuitNodes?: (string | number)[];
}

export class SimulationEngine {
  /**
   * Transforms port relative (dx, dy) and direction based on node rotation (0, 1, 2, 3)
   */
  static getTransformedPort(
    nodePos: Point,
    dx: number,
    dy: number,
    direction: number,
    rotation: Rotation
  ): { x: number; y: number; direction: number } {
    let tdx = dx;
    let tdy = dy;

    if (rotation === 1) {
      // 90 deg clockwise: (x, y) -> (-y, x)
      tdx = -dy;
      tdy = dx;
    } else if (rotation === 2) {
      // 180 deg: (x, y) -> (-x, -y)
      tdx = -dx;
      tdy = -dy;
    } else if (rotation === 3) {
      // 270 deg: (x, y) -> (y, -x)
      tdx = dy;
      tdy = -dx;
    }

    const transformedDir = (direction + rotation) % 4;
    return {
      x: nodePos.x + tdx,
      y: nodePos.y + tdy,
      direction: transformedDir,
    };
  }

  /**
   * Single-step deterministic electrical simulation evaluation
   */
  static step(nodesInput: CircuitNode[], wiresInput: CircuitWire[]): SimulationResult {
    // Clone nodes and reset wire potentials/isHot before evaluation
    const nodes: CircuitNode[] = nodesInput.map((n) => ({ ...n }));
    const wires: CircuitWire[] = wiresInput.map((w) => ({
      ...w,
      potential: null,
      isHot: false,
    }));

    let shortCircuit = false;
    let shortCircuitMessage = "";
    const shortNodes: (string | number)[] = [];

    // Helper: Evaluates 3-phase sequence direction (L1-L2-L3 -> cw, reversed -> ccw)
    const get3PhaseDirection = (pA?: string, pB?: string, pC?: string): "cw" | "ccw" => {
      if (!pA || !pB || !pC) return "cw";
      const seq = `${pA}-${pB}-${pC}`;
      if (seq === "L1-L2-L3" || seq === "L2-L3-L1" || seq === "L3-L1-L2") {
        return "cw";
      } else if (seq === "L1-L3-L2" || seq === "L3-L2-L1" || seq === "L2-L1-L3") {
        return "ccw";
      }
      return "cw";
    };

    // Helper: Checks if two potentials conflict directly (Short Circuit)
    const isConflict = (p1: string, p2: string): boolean => {
      if (p1 === p2) return false;
      const isDc1 = p1 === "+24V" || p1 === "-24V";
      const isDc2 = p2 === "+24V" || p2 === "-24V";
      if (isDc1 && isDc2 && p1 !== p2) return true;

      const acPhases = ["L1", "L2", "L3"];
      if (acPhases.includes(p1) && acPhases.includes(p2) && p1 !== p2) return true;
      if (acPhases.includes(p1) && p2 === "N") return true;
      if (p1 === "N" && acPhases.includes(p2)) return true;

      return false;
    };

    // 2. Iterative Convergence Loop (Coupled coil, contact states & equipotential propagation)
    let outerChanged = true;
    let outerIteration = 0;
    const maxOuterIterations = 15;
    let portPotentials = new Map<string, string>();
    let starNetworkPorts = new Set<string>();

    while (outerChanged && outerIteration < maxOuterIterations) {
      outerChanged = false;
      outerIteration++;

      // Reset potentials on each evaluation pass to prevent stale potential leakage
      portPotentials = new Map<string, string>();
      starNetworkPorts = new Set<string>();
      for (const wire of wires) {
        wire.potential = null;
        wire.isHot = false;
      }

      // Seed potentials from power sources
      for (const node of nodes) {
        const comp = catalog[node.componentId];
        if (!comp) continue;

        const compId = node.componentId;

        if (compId === "sourceL1L2L3" || compId === "sourceL1L2L3N") {
          portPotentials.set(`${node.id}:0`, "L1");
          portPotentials.set(`${node.id}:1`, "L2");
          portPotentials.set(`${node.id}:2`, "L3");
          if (compId === "sourceL1L2L3N") {
            portPotentials.set(`${node.id}:3`, "N");
          }
        } else if (compId === "sourceL1") {
          portPotentials.set(`${node.id}:0`, "L1");
        } else if (compId === "sourceL2") {
          portPotentials.set(`${node.id}:0`, "L2");
        } else if (compId === "sourceL3") {
          portPotentials.set(`${node.id}:0`, "L3");
        } else if (compId === "sourceN") {
          portPotentials.set(`${node.id}:0`, "N");
        } else if (compId === "sourcePlus" || compId === "arrowDestination" && node.comment?.includes("+24")) {
          portPotentials.set(`${node.id}:0`, "+24V");
        } else if (compId === "sourceNegative" || compId === "arrowDestination" && node.comment?.includes("-24")) {
          portPotentials.set(`${node.id}:0`, "-24V");
        } else if (compId === "sourceGnd" || compId === "sourcePE") {
          portPotentials.set(`${node.id}:0`, "PE");
        }
      }

      // Inner Equipotential Propagation
      let changed = true;
      let iteration = 0;
      const maxIterations = 30;

      while (changed && iteration < maxIterations) {
        changed = false;
        iteration++;

        // A. Propagate through wires
        const wireMap = new Map<string | number, CircuitWire>(wires.map((w) => [w.id, w]));
        for (const wire of wires) {
          const keyFrom = `${wire.fromNodeId}:${wire.fromPortId}`;
          const potFrom = portPotentials.get(keyFrom);

          // A.1. Wire-to-wire branch connection (tap wire)
          if (wire.toWireId) {
            const target = wireMap.get(wire.toWireId);
            if (target) {
              const potTarget = target.potential;

              if (potFrom && potTarget && isConflict(potFrom, potTarget)) {
                shortCircuit = true;
                shortCircuitMessage = `Short circuit detected between branch ${potFrom} and main ${potTarget}!`;
                shortNodes.push(wire.fromNodeId, target.fromNodeId, target.toNodeId);
                break;
              }

              if (potFrom && !potTarget) {
                target.potential = potFrom;
                target.isHot = true;
                wire.potential = potFrom;
                wire.isHot = true;
                portPotentials.set(`${target.fromNodeId}:${target.fromPortId}`, potFrom);
                portPotentials.set(`${target.toNodeId}:${target.toPortId}`, potFrom);
                changed = true;
              } else if (!potFrom && potTarget) {
                portPotentials.set(keyFrom, potTarget);
                wire.potential = potTarget;
                wire.isHot = true;
                changed = true;
              } else if (potFrom && potTarget && potFrom === potTarget) {
                wire.potential = potFrom;
                wire.isHot = true;
              }
            }
          }

          const keyTo = `${wire.toNodeId}:${wire.toPortId}`;
          const potTo = portPotentials.get(keyTo);

          if (potFrom && potTo && isConflict(potFrom, potTo)) {
            shortCircuit = true;
            shortCircuitMessage = `Short circuit detected between ${potFrom} and ${potTo}!`;
            shortNodes.push(wire.fromNodeId, wire.toNodeId);
            break;
          }

          if (potFrom && !potTo) {
            portPotentials.set(keyTo, potFrom);
            wire.potential = potFrom;
            wire.isHot = true;
            changed = true;
          } else if (!potFrom && potTo) {
            portPotentials.set(keyFrom, potTo);
            wire.potential = potTo;
            wire.isHot = true;
            changed = true;
          } else if (potFrom && potTo && potFrom === potTo) {
            wire.potential = potFrom;
            wire.isHot = true;
          }
        }

        if (shortCircuit) break;

        // B. Propagate internally through junctions, closed contacts, and switches
        for (const node of nodes) {
          const comp = catalog[node.componentId];
          if (!comp) continue;

          // B.1. Wire Junctions (all ports are equipotential nodes)
          const isJunction =
            comp.type === "junction" ||
            node.componentId.startsWith("junction") ||
            comp.tagType === "junctions";

          if (isJunction && comp.nodes && comp.nodes.length > 1) {
            let junctionPot: string | null = null;
            for (const port of comp.nodes) {
              const p = portPotentials.get(`${node.id}:${port.id}`);
              if (p) {
                if (junctionPot && isConflict(junctionPot, p)) {
                  shortCircuit = true;
                  shortCircuitMessage = `Short circuit detected at wire junction ${node.tag || node.name}!`;
                  shortNodes.push(node.id);
                  break;
                }
                junctionPot = p;
              }
            }

            if (shortCircuit) break;

            if (junctionPot) {
              for (const port of comp.nodes) {
                const key = `${node.id}:${port.id}`;
                if (!portPotentials.has(key)) {
                  portPotentials.set(key, junctionPot);
                  changed = true;
                }
              }
            }
            continue;
          }

          // Special handling for Power Supply: converts AC (L, N) to DC (+24V, -24V)
          if (node.componentId === "powerSupply" || node.componentId === "powerSupply2") {
            const potL = portPotentials.get(`${node.id}:0`);
            const potN = portPotentials.get(`${node.id}:2`);
            if (potL && potN) {
              if (!portPotentials.has(`${node.id}:1`)) {
                portPotentials.set(`${node.id}:1`, "+24V");
                changed = true;
              }
              if (!portPotentials.has(`${node.id}:3`)) {
                portPotentials.set(`${node.id}:3`, "-24V");
                changed = true;
              }
            }
            continue;
          }

          // B.2. Propagate across connected internal contacts based on component characteristics
          if (comp.contacts && comp.contacts.length > 0) {
            for (const c of comp.contacts) {
              let isContactConducting = false;

              if (c.enableFrames) {
                const ef = c.enableFrames.split(",").map((s: string) => s.trim());
                const currentFrame = node.frameIndex ?? 0;
                isContactConducting = ef[currentFrame] === "1";
              } else {
                const isNC = c.type === "nc";
                isContactConducting = isNC ? (node.frameIndex === 0) : (node.frameIndex === 1);
              }

              if (!isContactConducting) continue;

              const key1 = `${node.id}:${c.nodeId1}`;
              const key2 = `${node.id}:${c.nodeId2}`;
              const p1 = portPotentials.get(key1);
              const p2 = portPotentials.get(key2);

              if (p1 && p2 && isConflict(p1, p2)) {
                shortCircuit = true;
                shortCircuitMessage = `Short circuit detected inside component ${node.tag || node.name}!`;
                shortNodes.push(node.id);
                break;
              }

              if (p1 && !p2) {
                portPotentials.set(key2, p1);
                changed = true;
              } else if (!p1 && p2) {
                portPotentials.set(key1, p2);
                changed = true;
              }
            }
          }
        }

        if (shortCircuit) break;
      }

      if (shortCircuit) break;

      // C. Evaluate Coils & Couplings
      for (const node of nodes) {
        const comp = catalog[node.componentId];
        if (!comp || comp.type !== "coil") continue;

        // Coil terminals A1 (0) and A2 (1)
        const potA1 = portPotentials.get(`${node.id}:0`);
        const potA2 = portPotentials.get(`${node.id}:1`);

        // Coil is energized if there is a valid potential difference
        const energized = Boolean(potA1 && potA2 && potA1 !== potA2);

        if (node.isEnergized !== energized) {
          node.isEnergized = energized;
          node.frameIndex = energized ? 1 : 0;
          outerChanged = true;
        }

        // Check if this coil is a timer coil or standard contactor coil
        const isTimerCoil =
          node.componentId.includes("Delay") ||
          comp.tagType === "timerCoils" ||
          comp.timerType !== undefined;

        // An On-Delay timer contacts only activate when timer completes (frameIndex 1)
        // If it's a normal coil, contacts follow coil isEnergized immediately
        let contactsShouldActuate = energized;
        if (isTimerCoil) {
          const tType = comp.timerType || (node.componentId.includes("DelayOn") ? "delayOn" : "delayOff");
          if (tType === "delayOn") {
            const preset = node.valueTimeOn ?? 3;
            const elapsed = node.timerElapsed ?? 0;
            contactsShouldActuate = energized && elapsed >= preset;
          } else if (tType === "delayOff") {
            const preset = node.valueTimeOff ?? 3;
            const elapsed = node.timerElapsed ?? 0;
            contactsShouldActuate = energized || (elapsed > 0 && elapsed < preset);
          }
        }

        // Update all coupled contacts sharing the same tag
        if (node.tag) {
          for (const otherNode of nodes) {
            if (otherNode.tag === node.tag && otherNode.id !== node.id) {
              const otherComp = catalog[otherNode.componentId];
              if (!otherComp) continue;

              const newFrame = contactsShouldActuate ? 1 : 0;
              if (otherNode.frameIndex !== newFrame) {
                otherNode.frameIndex = newFrame;
                outerChanged = true;
              }
            }
          }
        }
      }

      // C.2. Evaluate Overload Relays (TOR): Couple auxiliary NO/NC contacts sharing the same tag
      const overloadTrippedTags = new Map<string, boolean>();
      for (const node of nodes) {
        const comp = catalog[node.componentId];
        const isOverload =
          node.componentId.toLowerCase().startsWith("overload") ||
          comp?.name?.toLowerCase().includes("overload");
        if (isOverload && node.tag) {
          const currentTripped = overloadTrippedTags.get(node.tag) || false;
          overloadTrippedTags.set(node.tag, currentTripped || node.frameIndex === 1);
        }
      }

      if (overloadTrippedTags.size > 0) {
        for (const [tag, isTripped] of overloadTrippedTags.entries()) {
          for (const otherNode of nodes) {
            if (otherNode.tag === tag) {
              const otherComp = catalog[otherNode.componentId];
              if (!otherComp) continue;

              const isContact =
                otherComp.type === "relayContact" ||
                otherComp.category === "auxiliaries" ||
                otherNode.componentId.toLowerCase().includes("contact");
              if (!isContact) continue;

              const newFrame = isTripped ? 1 : 0;
              if (otherNode.frameIndex !== newFrame) {
                otherNode.frameIndex = newFrame;
                outerChanged = true;
              }
            }
          }
        }
      }

      // Build port continuity graph for Star/Delta connectivity validation
      const portGraphAdj = new Map<string, Set<string>>();
      const addGraphEdge = (u: string, v: string) => {
        if (!u || !v || u === v) return;
        let setU = portGraphAdj.get(u);
        if (!setU) {
          setU = new Set();
          portGraphAdj.set(u, setU);
        }
        let setV = portGraphAdj.get(v);
        if (!setV) {
          setV = new Set();
          portGraphAdj.set(v, setV);
        }
        setU.add(v);
        setV.add(u);
      };

      const wireMap = new Map<string | number, CircuitWire>(wires.map((w) => [w.id, w]));
      for (const wire of wires) {
        const keyFrom = `${wire.fromNodeId}:${wire.fromPortId}`;
        if (wire.toWireId) {
          const target = wireMap.get(wire.toWireId);
          if (target) {
            addGraphEdge(keyFrom, `${target.fromNodeId}:${target.fromPortId}`);
            addGraphEdge(keyFrom, `${target.toNodeId}:${target.toPortId}`);
          }
        } else {
          const keyTo = `${wire.toNodeId}:${wire.toPortId}`;
          addGraphEdge(keyFrom, keyTo);
        }
      }

      for (const n of nodes) {
        const c = catalog[n.componentId];
        if (!c) continue;

        const isJunction =
          c.type === "junction" ||
          n.componentId.startsWith("junction") ||
          c.tagType === "junctions";

        if (isJunction && c.nodes && c.nodes.length > 1) {
          for (let i = 0; i < c.nodes.length; i++) {
            for (let j = i + 1; j < c.nodes.length; j++) {
              addGraphEdge(`${n.id}:${c.nodes[i].id}`, `${n.id}:${c.nodes[j].id}`);
            }
          }
        }

        if (c.contacts && c.contacts.length > 0) {
          for (const contact of c.contacts) {
            let isConducting = false;
            if (contact.enableFrames) {
              const ef = contact.enableFrames.split(",").map((s: string) => s.trim());
              const currentFrame = n.frameIndex ?? 0;
              isConducting = ef[currentFrame] === "1";
            } else {
              const isNC = contact.type === "nc";
              isConducting = isNC ? (n.frameIndex === 0) : (n.frameIndex === 1);
            }
            if (isConducting) {
              addGraphEdge(`${n.id}:${contact.nodeId1}`, `${n.id}:${contact.nodeId2}`);
            }
          }
        }
      }

      const arePortsConnected = (u: string, v: string): boolean => {
        if (u === v) return true;
        if (!portGraphAdj.has(u) || !portGraphAdj.has(v)) return false;
        const visited = new Set<string>();
        const queue = [u];
        visited.add(u);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          if (curr === v) return true;
          const neighbors = portGraphAdj.get(curr);
          if (neighbors) {
            for (const nxt of neighbors) {
              if (!visited.has(nxt)) {
                visited.add(nxt);
                queue.push(nxt);
              }
            }
          }
        }
        return false;
      };

      const getConnectedPorts = (start: string): Set<string> => {
        const component = new Set<string>();
        if (!portGraphAdj.has(start)) return component;
        const queue = [start];
        component.add(start);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          const neighbors = portGraphAdj.get(curr);
          if (neighbors) {
            for (const nxt of neighbors) {
              if (!component.has(nxt)) {
                component.add(nxt);
                queue.push(nxt);
              }
            }
          }
        }
        return component;
      };

      // D. Evaluate Actuators: Lamps, Motors, Horns, Buzzers, and Solenoids
      for (const node of nodes) {
        const comp = catalog[node.componentId];
        const cid = node.componentId.toLowerCase();

        if (cid === "lamp" || cid === "lampblink" || cid.includes("indicator")) {
          const p1 = portPotentials.get(`${node.id}:0`);
          const p2 = portPotentials.get(`${node.id}:1`);
          // If potentials are present, check voltage drop. If node has no ports connected, preserve existing state if already set.
          const hasPortInfo = portPotentials.has(`${node.id}:0`) || portPotentials.has(`${node.id}:1`);
          const lampOn = hasPortInfo ? Boolean(p1 && p2 && p1 !== p2) : Boolean(node.isEnergized);
          if (node.isEnergized !== lampOn || node.frameIndex !== (lampOn ? 1 : 0)) {
            node.isEnergized = lampOn;
            node.frameIndex = lampOn ? 1 : 0;
            outerChanged = true;
          }
        } else if (cid === "motorstardelta") {
          const p0 = portPotentials.get(`${node.id}:0`);
          const p1 = portPotentials.get(`${node.id}:1`);
          const p2 = portPotentials.get(`${node.id}:2`);
          const p3 = portPotentials.get(`${node.id}:3`);
          const p4 = portPotentials.get(`${node.id}:4`);
          const p5 = portPotentials.get(`${node.id}:5`);

          const hasTop3Ph = Boolean(p0 && p1 && p2 && p0 !== p1 && p1 !== p2 && p0 !== p2);
          const hasBottom3Ph = Boolean(p3 && p4 && p5 && p3 !== p4 && p4 !== p5 && p3 !== p5);

          const hasBottomWires = wires.some(
            (w) =>
              (w.fromNodeId === node.id && (Number(w.fromPortId) === 3 || Number(w.fromPortId) === 4 || Number(w.fromPortId) === 5)) ||
              (w.toNodeId === node.id && (Number(w.toPortId) === 3 || Number(w.toPortId) === 4 || Number(w.toPortId) === 5))
          );

          const hasTopWires = wires.some(
            (w) =>
              (w.fromNodeId === node.id && (Number(w.fromPortId) === 0 || Number(w.fromPortId) === 1 || Number(w.fromPortId) === 2)) ||
              (w.toNodeId === node.id && (Number(w.toPortId) === 0 || Number(w.toPortId) === 1 || Number(w.toPortId) === 2))
          );

          // Delta mode: windings have phase difference across terminals
          // Winding 1: U1 (0) to U2 (4)
          // Winding 2: V1 (1) to V2 (5)
          // Winding 3: W1 (2) to W2 (3)
          const deltaRunning = Boolean(
            hasTop3Ph &&
            p4 && p0 !== p4 &&
            p5 && p1 !== p5 &&
            p3 && p2 !== p3
          );

          // Star mode: bottom terminals W2 (3), U2 (4), V2 (5) are interconnected or tied to N/PE
          const starTied = Boolean(
            (arePortsConnected(`${node.id}:3`, `${node.id}:4`) &&
             arePortsConnected(`${node.id}:4`, `${node.id}:5`)) ||
            (p3 && p4 && p5 && p3 === p4 && p4 === p5)
          );
          const starRunning = Boolean(hasTop3Ph && starTied);

          // Fallback star: if user only wired 3-phase to top without bottom wires
          const defaultStarRunning = Boolean(hasTop3Ph && !hasBottomWires);

          // Reverse feed (3-phase fed into bottom terminals W2, U2, V2)
          const deltaRunningRev = Boolean(
            hasBottom3Ph &&
            p0 && p0 !== p4 &&
            p1 && p1 !== p5 &&
            p2 && p2 !== p3
          );
          const starTiedRev = Boolean(
            (arePortsConnected(`${node.id}:0`, `${node.id}:1`) &&
             arePortsConnected(`${node.id}:1`, `${node.id}:2`)) ||
            (p0 && p1 && p2 && p0 === p1 && p1 === p2)
          );
          const starRunningRev = Boolean(hasBottom3Ph && starTiedRev);
          const defaultStarRunningRev = Boolean(hasBottom3Ph && !hasTopWires);

          const motorRunning = Boolean(
            deltaRunning || starRunning || defaultStarRunning ||
            deltaRunningRev || starRunningRev || defaultStarRunningRev
          );

          if (node.isEnergized !== motorRunning || node.frameIndex !== (motorRunning ? 1 : 0)) {
            node.isEnergized = motorRunning;
            node.frameIndex = motorRunning ? 1 : 0;
            outerChanged = true;
          }

          if (motorRunning) {
            if (hasTop3Ph) {
              node.motorDirection = get3PhaseDirection(p0, p1, p2);
            } else if (hasBottom3Ph) {
              node.motorDirection = get3PhaseDirection(p4, p5, p3);
            } else {
              node.motorDirection = "cw";
            }

            if (starRunning) {
              const comp3 = getConnectedPorts(`${node.id}:3`);
              for (const p of comp3) starNetworkPorts.add(p);
            } else if (starRunningRev) {
              const comp0 = getConnectedPorts(`${node.id}:0`);
              for (const p of comp0) starNetworkPorts.add(p);
            }
          } else {
            node.motorDirection = "off";
          }
        } else if (cid === "motortwospeeds") {
          // Speed 1: U1 (0), V1 (1), W1 (2)
          const pU1 = portPotentials.get(`${node.id}:0`);
          const pV1 = portPotentials.get(`${node.id}:1`);
          const pW1 = portPotentials.get(`${node.id}:2`);
          const speed1Running = Boolean(pU1 && pV1 && pW1 && pU1 !== pV1 && pV1 !== pW1 && pU1 !== pW1);

          // Speed 2: U2 (3), V2 (4), W2 (5)
          const pU2 = portPotentials.get(`${node.id}:3`);
          const pV2 = portPotentials.get(`${node.id}:4`);
          const pW2 = portPotentials.get(`${node.id}:5`);
          const speed2Running = Boolean(pU2 && pV2 && pW2 && pU2 !== pV2 && pV2 !== pW2 && pU2 !== pW2);

          const motorRunning = speed1Running || speed2Running;
          if (node.isEnergized !== motorRunning || node.frameIndex !== (motorRunning ? 1 : 0)) {
            node.isEnergized = motorRunning;
            node.frameIndex = motorRunning ? 1 : 0;
            outerChanged = true;
          }

          if (motorRunning) {
            if (speed1Running) {
              node.motorDirection = get3PhaseDirection(pU1, pV1, pW1);
            } else {
              node.motorDirection = get3PhaseDirection(pU2, pV2, pW2);
            }
          } else {
            node.motorDirection = "off";
          }
        } else if (cid === "motordhalander") {
          // Low Speed: U1 (0), V1 (1), W1 (2)
          const pU1 = portPotentials.get(`${node.id}:0`);
          const pV1 = portPotentials.get(`${node.id}:1`);
          const pW1 = portPotentials.get(`${node.id}:2`);
          const lowSpeedRunning = Boolean(pU1 && pV1 && pW1 && pU1 !== pV1 && pV1 !== pW1 && pU1 !== pW1);

          // High Speed (Double Star): U2 (3), V2 (4), W2 (5)
          const pU2 = portPotentials.get(`${node.id}:3`);
          const pV2 = portPotentials.get(`${node.id}:4`);
          const pW2 = portPotentials.get(`${node.id}:5`);
          const highSpeedRunning = Boolean(pU2 && pV2 && pW2 && pU2 !== pV2 && pV2 !== pW2 && pU2 !== pW2);

          const motorRunning = lowSpeedRunning || highSpeedRunning;
          if (node.isEnergized !== motorRunning || node.frameIndex !== (motorRunning ? 1 : 0)) {
            node.isEnergized = motorRunning;
            node.frameIndex = motorRunning ? 1 : 0;
            outerChanged = true;
          }

          if (motorRunning) {
            if (lowSpeedRunning) {
              node.motorDirection = get3PhaseDirection(pU1, pV1, pW1);
            } else {
              node.motorDirection = get3PhaseDirection(pU2, pV2, pW2);
            }
          } else {
            node.motorDirection = "off";
          }
        } else if (cid.startsWith("motor3ph")) {
          const pU = portPotentials.get(`${node.id}:0`);
          const pV = portPotentials.get(`${node.id}:1`);
          const pW = portPotentials.get(`${node.id}:2`);
          const motorRunning = Boolean(
            pU && pV && pW && pU !== pV && pV !== pW && pU !== pW
          );
          if (node.isEnergized !== motorRunning || node.frameIndex !== (motorRunning ? 1 : 0)) {
            node.isEnergized = motorRunning;
            node.frameIndex = motorRunning ? 1 : 0;
            outerChanged = true;
          }

          if (motorRunning) {
            node.motorDirection = get3PhaseDirection(pU, pV, pW);
          } else {
            node.motorDirection = "off";
          }
        } else if (cid === "motor1ph" || cid === "motordc" || cid === "buzzer" || cid === "horn" || cid === "solenoidvalve") {
          const p1 = portPotentials.get(`${node.id}:0`);
          const p2 = portPotentials.get(`${node.id}:1`);
          const running = Boolean(p1 && p2 && p1 !== p2);
          if (node.isEnergized !== running || node.frameIndex !== (running ? 1 : 0)) {
            node.isEnergized = running;
            node.frameIndex = running ? 1 : 0;
            outerChanged = true;
          }
          if (cid === "motordc" && running) {
            node.motorDirection = p1 === "+24V" ? "cw" : "ccw";
          } else if (cid === "motor1ph" && running) {
            node.motorDirection = "cw";
          } else {
            node.motorDirection = "off";
          }
        } else if (cid === "panellamp" || comp?.type === "panelLamp") {
          // Virtual Panel Lamp: binds by tag to circuit loads/lamps or contactors
          let shouldEnergize = false;
          if (node.tag) {
            const matchingLoad = nodes.find(
              (n) =>
                n.id !== node.id &&
                n.tag === node.tag &&
                (n.isEnergized || (n.componentId.toLowerCase().includes("lamp") && n.frameIndex === 1))
            );
            shouldEnergize = Boolean(matchingLoad);
          }
          if (node.isEnergized !== shouldEnergize || node.frameIndex !== (shouldEnergize ? 1 : 0)) {
            node.isEnergized = shouldEnergize;
            node.frameIndex = shouldEnergize ? 1 : 0;
            outerChanged = true;
          }
        }
      }
    }

    // Filter return wires (N, -24V, PE): only hot if completing a circuit with an energized load
    const energizedNodeIds = new Set(
      nodes.filter((n) => n.isEnergized).map((n) => n.id)
    );

    // Build return wire adjacency graph to trace return currents back to source
    const returnPotentials = new Set(["-24V", "N", "PE", "-V"]);
    const hotReturnWires = new Set<string | number>();
    const returnQueue: CircuitWire[] = [];

    for (const wire of wires) {
      if (wire.potential && returnPotentials.has(wire.potential)) {
        if (energizedNodeIds.has(wire.fromNodeId) || energizedNodeIds.has(wire.toNodeId)) {
          hotReturnWires.add(wire.id);
          returnQueue.push(wire);
        }
      }
    }

    // Traverse all wires connected directly, via endpoints, or via toWireId taps
    while (returnQueue.length > 0) {
      const curr = returnQueue.shift()!;
      const currFromKey = `${curr.fromNodeId}:${curr.fromPortId}`;
      const currToKey = `${curr.toNodeId}:${curr.toPortId}`;

      for (const other of wires) {
        if (!hotReturnWires.has(other.id) && other.potential === curr.potential) {
          // Connected via tap wire
          const isTapped = other.toWireId === curr.id || curr.toWireId === other.id;
          // Or connected via shared node terminals
          const otherFromKey = `${other.fromNodeId}:${other.fromPortId}`;
          const otherToKey = `${other.toNodeId}:${other.toPortId}`;
          const sharesPort =
            otherFromKey === currFromKey ||
            otherFromKey === currToKey ||
            otherToKey === currFromKey ||
            otherToKey === currToKey;

          if (isTapped || sharesPort) {
            hotReturnWires.add(other.id);
            returnQueue.push(other);
          }
        }
      }
    }

    for (const wire of wires) {
      if (wire.potential && returnPotentials.has(wire.potential)) {
        wire.isHot = hotReturnWires.has(wire.id);
      }
    }

    // Star network wires (W2, U2, V2 connected through star contactor or jumpers to form star point)
    if (starNetworkPorts.size > 0) {
      for (const wire of wires) {
        const fromKey = `${wire.fromNodeId}:${wire.fromPortId}`;
        const toKey = `${wire.toNodeId}:${wire.toPortId}`;
        if (starNetworkPorts.has(fromKey) || starNetworkPorts.has(toKey)) {
          wire.isHot = true;
          if (!wire.flowDirection) {
            wire.flowDirection = "forward";
          }
        }
      }
    }

    // Assign realistic physical current flow direction:
    // Flow always travels outward from Power Sources (+24V, L1/L2/L3) through loads, and down towards Neutral/GND/Return (-24V, N, PE).
    const sourceNodeIds = new Set<string | number>();
    const returnNodeIds = new Set<string | number>();

    for (const node of nodes) {
      const cid = node.componentId;
      if (
        cid === "sourceL1" ||
        cid === "sourceL2" ||
        cid === "sourceL3" ||
        cid === "sourceL1L2L3" ||
        cid === "sourceL1L2L3N" ||
        cid === "sourcePlus" ||
        (cid === "arrowDestination" && node.comment?.includes("+24"))
      ) {
        sourceNodeIds.add(node.id);
      } else if (
        cid === "sourceN" ||
        cid === "sourceNegative" ||
        cid === "sourceGnd" ||
        cid === "sourcePE" ||
        (cid === "arrowDestination" && node.comment?.includes("-24"))
      ) {
        returnNodeIds.add(node.id);
      }
    }

    // Compute hop distances from sources (BFS)
    const wireMap = new Map<string | number, CircuitWire>(wires.map((w) => [w.id, w]));
    const nodeSourceDist = new Map<string | number, number>();
    const sourceQueue: Array<{ nodeId: string | number; dist: number }> = [];

    for (const sid of sourceNodeIds) {
      nodeSourceDist.set(sid, 0);
      sourceQueue.push({ nodeId: sid, dist: 0 });
    }

    while (sourceQueue.length > 0) {
      const { nodeId, dist } = sourceQueue.shift()!;
      for (const w of wires) {
        if (!w.isHot) continue;
        const targetNodeId = w.fromNodeId === nodeId ? w.toNodeId : w.toNodeId === nodeId ? w.fromNodeId : null;
        if (targetNodeId && !nodeSourceDist.has(targetNodeId)) {
          nodeSourceDist.set(targetNodeId, dist + 1);
          sourceQueue.push({ nodeId: targetNodeId, dist: dist + 1 });
        }
      }
    }

    // Determine wire flowDirection
    for (const wire of wires) {
      if (!wire.isHot) {
        wire.flowDirection = undefined;
        continue;
      }

      // If wire carries return potential (N, -24V, PE), flow moves towards the return/neutral terminal
      if (wire.potential && returnPotentials.has(wire.potential)) {
        if (returnNodeIds.has(wire.toNodeId)) {
          wire.flowDirection = "forward"; // from fromNode to toNode (to return node)
        } else if (returnNodeIds.has(wire.fromNodeId)) {
          wire.flowDirection = "reverse"; // from toNode to fromNode (to return node)
        } else {
          // Default to outward forward
          wire.flowDirection = "forward";
        }
      } else {
        // Positive / Phase line: flow moves away from source towards load/destination
        const distFrom = nodeSourceDist.get(wire.fromNodeId) ?? Infinity;
        const distTo = nodeSourceDist.get(wire.toNodeId) ?? Infinity;

        if (sourceNodeIds.has(wire.fromNodeId)) {
          wire.flowDirection = "forward";
        } else if (sourceNodeIds.has(wire.toNodeId)) {
          wire.flowDirection = "reverse";
        } else if (distFrom !== Infinity && distTo !== Infinity) {
          wire.flowDirection = distFrom <= distTo ? "forward" : "reverse";
        } else {
          wire.flowDirection = "forward";
        }
      }
    }

    return {
      nodes,
      wires,
      shortCircuit,
      shortCircuitMessage,
      shortCircuitNodes: shortNodes,
    };
  }
}
