import { CircuitNode, CircuitWire, Point } from "../types";

export interface WireNetInfo {
  netId: number;
  label: string;
}

/**
 * Disjoint-Set / Union-Find structure for grouping equipotential endpoints
 */
class UnionFind {
  private parent: Map<string, string> = new Map();

  find(i: string): string {
    if (!this.parent.has(i)) {
      this.parent.set(i, i);
      return i;
    }
    const root = this.parent.get(i)!;
    if (root === i) return i;
    const nextRoot = this.find(root);
    this.parent.set(i, nextRoot);
    return nextRoot;
  }

  union(i: string, j: string): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ);
    }
  }
}

export class WireNetResolver {
  /**
   * Resolves the equipotential net for every wire in the circuit.
   *
   * Logic:
   * - Wires that connect directly or via wire-to-wire taps belong to the SAME net.
   * - Passing through switches, coils, loads, or contacts breaks the net into a NEW net.
   * - If wires in a net have explicit or existing numbers, preserve them (Mazhab 2: persistent).
   * - For newly created nets without a number, reuse the lowest available positive integer gap (1, 2, 3...).
   */
  static resolveWireNets(
    wires: CircuitWire[],
    nodes: CircuitNode[] = []
  ): Map<string | number, WireNetInfo> {
    const resultMap = new Map<string | number, WireNetInfo>();
    if (!wires || wires.length === 0) return resultMap;

    const uf = new UnionFind();
    const wireKey = (wId: string | number) => `w:${wId}`;
    const portKey = (nId: string | number, pId: number) => `p:${nId}:${pId}`;

    // 1. Group wires and ports into equipotential sets
    for (const wire of wires) {
      const wK = wireKey(wire.id);
      const fromPK = portKey(wire.fromNodeId, wire.fromPortId);
      uf.union(wK, fromPK);

      if (wire.toWireId) {
        // Wire-to-wire branch connection
        const targetWK = wireKey(wire.toWireId);
        uf.union(wK, targetWK);
      } else {
        const toPK = portKey(wire.toNodeId, wire.toPortId);
        uf.union(wK, toPK);
      }
    }

    // 2. Cluster wires by their connected component root
    const clusters = new Map<string, CircuitWire[]>();
    for (const wire of wires) {
      const root = uf.find(wireKey(wire.id));
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(wire);
    }

    // Node lookup for spatial coordinates
    const nodeMap = new Map<string | number, CircuitNode>();
    for (const n of nodes) {
      nodeMap.set(n.id, n);
    }

    // 3. For each cluster, check if any wire already has a valid numeric label
    const clusterNetIds = new Map<string, number>();
    const usedNetIds = new Set<number>();

    // First pass: collect already assigned/existing numbers in each cluster
    for (const [root, clusterWires] of clusters.entries()) {
      let existingId: number | null = null;

      for (const w of clusterWires) {
        if (w.label) {
          const parsed = parseInt(String(w.label).trim(), 10);
          if (!isNaN(parsed) && parsed > 0) {
            existingId = parsed;
            break;
          }
        }
      }

      if (existingId !== null && !usedNetIds.has(existingId)) {
        clusterNetIds.set(root, existingId);
        usedNetIds.add(existingId);
      }
    }

    // Sort unassigned clusters spatially (Top-to-Bottom, Left-to-Right)
    const unassignedRoots = Array.from(clusters.keys()).filter((r) => !clusterNetIds.has(r));

    const getClusterPosition = (clusterWires: CircuitWire[]): { x: number; y: number } => {
      let minX = Infinity;
      let minY = Infinity;
      for (const w of clusterWires) {
        const fn = nodeMap.get(w.fromNodeId);
        if (fn) {
          minX = Math.min(minX, fn.position.x);
          minY = Math.min(minY, fn.position.y);
        }
        if (w.tapPoint) {
          minX = Math.min(minX, w.tapPoint.x);
          minY = Math.min(minY, w.tapPoint.y);
        } else {
          const tn = nodeMap.get(w.toNodeId);
          if (tn) {
            minX = Math.min(minX, tn.position.x);
            minY = Math.min(minY, tn.position.y);
          }
        }
      }
      return {
        x: minX === Infinity ? 0 : minX,
        y: minY === Infinity ? 0 : minY,
      };
    };

    unassignedRoots.sort((a, b) => {
      const posA = getClusterPosition(clusters.get(a)!);
      const posB = getClusterPosition(clusters.get(b)!);
      if (Math.abs(posA.y - posB.y) > 15) {
        return posA.y - posB.y;
      }
      return posA.x - posB.x;
    });

    // Helper to find the lowest unused integer >= 1 (Mazhab 2 Gap Recycle)
    let nextCandidate = 1;
    const getNextAvailableId = (): number => {
      while (usedNetIds.has(nextCandidate)) {
        nextCandidate++;
      }
      usedNetIds.add(nextCandidate);
      return nextCandidate;
    };

    // Assign IDs to clusters needing new numbers
    for (const root of unassignedRoots) {
      const assignedId = getNextAvailableId();
      clusterNetIds.set(root, assignedId);
    }

    // 4. Fill resultMap for all wires
    for (const [root, clusterWires] of clusters.entries()) {
      const netId = clusterNetIds.get(root) || 1;
      const netLabel = String(netId);

      for (const w of clusterWires) {
        // If wire has custom manual string override (non-pure number or explicit rename), respect it
        const finalLabel = w.label && isNaN(Number(w.label)) ? w.label : netLabel;
        resultMap.set(w.id, {
          netId,
          label: finalLabel,
        });
      }
    }

    return resultMap;
  }

  /**
   * Renumbers ALL wire nets strictly sequentially from 1 to N
   * (Top-to-Bottom, Left-to-Right ladder order) without gaps.
   */
  static renumberAll(wires: CircuitWire[], nodes: CircuitNode[]): CircuitWire[] {
    if (!wires || wires.length === 0) return wires;

    // Reset all existing wire labels to null so resolveWireNets re-indexes everything
    const cleared = wires.map((w) => ({ ...w, label: null }));
    const nets = this.resolveWireNets(cleared, nodes);

    return wires.map((w) => {
      const net = nets.get(w.id);
      return {
        ...w,
        label: net ? net.label : null,
      };
    });
  }

  /**
   * Finds the best placement for the wire number labels following "Terminal Near" ferrule style:
   * - Threshold: 80px total wire length.
   * - If total wire length < 80px (kawat pendek):
   *     Returns exactly ONE label placed at the midpoint of the wire route.
   * - If total wire length >= 80px (kawat panjang):
   *     Returns TWO labels (ferrule collars near both terminal ends: ~18px from source and ~18px from destination).
   */
  static getOptimalLabelPositions(points: Point[]): Array<{
    x: number;
    y: number;
    orientation: "horizontal" | "vertical";
  }> {
    if (!points || points.length < 2) return [];

    // Calculate total wire length
    let totalLength = 0;
    const segLens: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segLens.push(len);
      totalLength += len;
    }

    if (totalLength < 16) {
      // Too tiny to fit any label cleanly
      return [];
    }

    // Helper: interpolate a point along the wire path at given distance from start
    const getPointAtDist = (dist: number): { x: number; y: number; orientation: "horizontal" | "vertical" } => {
      let accumulated = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const segLen = segLens[i];
        if (accumulated + segLen >= dist || i === points.length - 2) {
          const remain = Math.max(0, Math.min(segLen, dist - accumulated));
          const pA = points[i];
          const pB = points[i + 1];
          const ratio = segLen > 0 ? remain / segLen : 0;
          const isHoriz = Math.abs(pB.y - pA.y) <= Math.abs(pB.x - pA.x);
          return {
            x: pA.x + (pB.x - pA.x) * ratio,
            y: pA.y + (pB.y - pA.y) * ratio,
            orientation: isHoriz ? "horizontal" : "vertical",
          };
        }
        accumulated += segLen;
      }
      const lastP = points[points.length - 1];
      return { x: lastP.x, y: lastP.y, orientation: "horizontal" };
    };

    // SHORT WIRE (< 80px): exactly 1 label at the exact midpoint!
    if (totalLength < 80) {
      const mid = getPointAtDist(totalLength / 2);
      return [mid];
    }

    // LONG WIRE (>= 80px): TWO labels (one near start terminal, one near end terminal)
    const ferruleDistance = 18;
    const startFerrule = getPointAtDist(ferruleDistance);
    const endFerrule = getPointAtDist(totalLength - ferruleDistance);

    return [startFerrule, endFerrule];
  }

  // Backward compatibility alias for single position lookup
  static getOptimalLabelPosition(points: Point[]): {
    x: number;
    y: number;
    orientation: "horizontal" | "vertical";
  } | null {
    const list = this.getOptimalLabelPositions(points);
    return list.length > 0 ? list[0] : null;
  }
}
