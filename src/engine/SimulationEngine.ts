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

    while (outerChanged && outerIteration < maxOuterIterations) {
      outerChanged = false;
      outerIteration++;

      // Reset potentials on each evaluation pass to prevent stale potential leakage
      portPotentials = new Map<string, string>();
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
        for (const wire of wires) {
          const keyFrom = `${wire.fromNodeId}:${wire.fromPortId}`;
          const keyTo = `${wire.toNodeId}:${wire.toPortId}`;

          const potFrom = portPotentials.get(keyFrom);
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

      // D. Evaluate Actuators: Lamps, Motors, Horns, Buzzers, and Solenoids
      for (const node of nodes) {
        const comp = catalog[node.componentId];
        const cid = node.componentId.toLowerCase();

        if (cid === "lamp" || cid === "lampblink" || cid.includes("indicator")) {
          const p1 = portPotentials.get(`${node.id}:0`);
          const p2 = portPotentials.get(`${node.id}:1`);
          const lampOn = Boolean(p1 && p2 && p1 !== p2);
          if (node.isEnergized !== lampOn || node.frameIndex !== (lampOn ? 1 : 0)) {
            node.isEnergized = lampOn;
            node.frameIndex = lampOn ? 1 : 0;
            outerChanged = true;
          }
        } else if (cid.startsWith("motor3ph") || cid === "motortwospeeds" || cid === "motordhalander") {
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

          // Determine 3-phase rotation direction
          if (motorRunning) {
            const seq = `${pU}-${pV}-${pW}`;
            if (seq === "L1-L2-L3" || seq === "L2-L3-L1" || seq === "L3-L1-L2") {
              node.motorDirection = "cw";
            } else if (seq === "L1-L3-L2" || seq === "L3-L2-L1" || seq === "L2-L1-L3") {
              node.motorDirection = "ccw";
            } else {
              node.motorDirection = "cw";
            }
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
        }
      }
    }

    // Filter return wires (N, -24V, PE): only hot if completing a circuit with an energized load
    const energizedNodeIds = new Set(
      nodes.filter((n) => n.isEnergized).map((n) => n.id)
    );

    for (const wire of wires) {
      if (wire.potential === "-24V" || wire.potential === "N" || wire.potential === "PE") {
        const fromEnergized = energizedNodeIds.has(wire.fromNodeId);
        const toEnergized = energizedNodeIds.has(wire.toNodeId);
        wire.isHot = Boolean(fromEnergized || toEnergized);
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
