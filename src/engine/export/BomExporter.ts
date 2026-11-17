import { CircuitNode, CircuitWire } from "@/engine/types";
import { getDetailedHardwareList, DetailedHardwareItem } from "@/utils/circuitSummary";
import { WireNetResolver } from "@/engine/router/WireNetResolver";

export interface BomDeviceRecord {
  itemNo: number;
  tag: string;
  type: string;
  category: string;
  quantity: number;
  description: string;
  subElements: string;
}

export interface BomWireStats {
  totalWires: number;
  totalNets: number;
  totalConnections: number;
  estWireLengthMeters: number;
}

export interface BomSummary {
  records: BomDeviceRecord[];
  totalDevices: number;
  wireStats: BomWireStats;
}

/**
 * Escapes a cell value for RFC-4180 CSV compliance.
 */
function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export class BomExporter {
  /**
   * Generates a comprehensive structured Bill of Materials summary from nodes and wires.
   */
  static generateBomSummary(nodes: CircuitNode[], wires: CircuitWire[]): BomSummary {
    const hardwareItems = getDetailedHardwareList(nodes);

    // Group identical untagged independent devices of the same type/name/category together
    const records: BomDeviceRecord[] = [];
    let itemCounter = 1;

    for (const item of hardwareItems) {
      // Sub-elements description (e.g. "1x Coil, 2x Contact NO")
      let subDesc = "-";
      if (item.subElements && item.subElements.length > 0) {
        const counts = new Map<string, number>();
        for (const sub of item.subElements) {
          const name = sub.name || sub.role;
          counts.set(name, (counts.get(name) || 0) + 1);
        }
        subDesc = Array.from(counts.entries())
          .map(([name, count]) => `${count}x ${name}`)
          .join("; ");
      }

      records.push({
        itemNo: itemCounter++,
        tag: item.tag && item.tag !== "-" ? item.tag : "-",
        type: item.type,
        category: item.category,
        quantity: 1,
        description: item.comment || "-",
        subElements: subDesc,
      });
    }

    // Sort: tagged devices first alphabetically by tag, then untagged
    records.sort((a, b) => {
      if (a.tag !== "-" && b.tag !== "-") return a.tag.localeCompare(b.tag);
      if (a.tag !== "-") return -1;
      if (b.tag !== "-") return 1;
      return a.type.localeCompare(b.type);
    });

    // Re-assign item numbers cleanly after sorting
    records.forEach((r, idx) => {
      r.itemNo = idx + 1;
    });

    // Wire Metrics Calculation
    const netsMap = WireNetResolver.resolveWireNets(wires, nodes);
    const uniqueNets = new Set<number>();
    for (const info of netsMap.values()) {
      uniqueNets.add(info.netId);
    }

    // Estimate wire length: in RelayFlow grid 30px ~ 0.1 meter (10 cm)
    let totalWirePx = 0;
    for (const w of wires) {
      if (w.tapPoint) {
        // Approximate tap wire length
        totalWirePx += 90;
      } else {
        totalWirePx += 120; // Default segment length heuristic
      }
    }
    const estMeters = Number(((totalWirePx / 30) * 0.1).toFixed(2));

    const wireStats: BomWireStats = {
      totalWires: wires.length,
      totalNets: uniqueNets.size,
      totalConnections: wires.length * 2,
      estWireLengthMeters: estMeters,
    };

    return {
      records,
      totalDevices: records.length,
      wireStats,
    };
  }

  /**
   * Generates an RFC-4180 CSV string with UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility.
   */
  static toCsv(summary: BomSummary, projectTitle: string = "RelayFlow Circuit"): string {
    const lines: string[] = [];

    // Header block
    lines.push(escapeCsvCell("RELAYFLOW - BILL OF MATERIALS (BOM)"));
    lines.push(`${escapeCsvCell("Project Title:")},${escapeCsvCell(projectTitle)}`);
    lines.push(`${escapeCsvCell("Date Generated:")},${escapeCsvCell(new Date().toLocaleDateString())}`);
    lines.push(`${escapeCsvCell("Total Hardware Units:")},${escapeCsvCell(summary.totalDevices)}`);
    lines.push(""); // Empty line

    // Table Header
    const headers = ["Item #", "Tag", "Component Type", "Category", "Qty", "Description / Spec", "Sub-elements"];
    lines.push(headers.map(escapeCsvCell).join(","));

    // Table Rows
    for (const r of summary.records) {
      lines.push(
        [
          r.itemNo,
          r.tag,
          r.type,
          r.category,
          r.quantity,
          r.description,
          r.subElements,
        ].map(escapeCsvCell).join(",")
      );
    }

    lines.push(""); // Empty line
    // Wire Summary Section
    lines.push(escapeCsvCell("WIRE & NETWORKING SUMMARY"));
    lines.push(`${escapeCsvCell("Total Wire Segments:")},${escapeCsvCell(summary.wireStats.totalWires)}`);
    lines.push(`${escapeCsvCell("Distinct Equipotential Nets:")},${escapeCsvCell(summary.wireStats.totalNets)}`);
    lines.push(`${escapeCsvCell("Total Wire Terminations:")},${escapeCsvCell(summary.wireStats.totalConnections)}`);
    lines.push(`${escapeCsvCell("Est. Total Wire Length (m):")},${escapeCsvCell(summary.wireStats.estWireLengthMeters)}`);

    // Prepend UTF-8 Byte Order Mark (\uFEFF)
    return "\uFEFF" + lines.join("\r\n");
  }

  /**
   * Generates a clean TSV string (Tab-Separated Values) for direct clipboard paste into Excel / Google Sheets.
   */
  static toTsv(summary: BomSummary): string {
    const lines: string[] = [];
    const headers = ["Item #", "Tag", "Component Type", "Category", "Qty", "Description", "Sub-elements"];
    lines.push(headers.join("\t"));

    for (const r of summary.records) {
      lines.push(
        [
          r.itemNo,
          r.tag,
          r.type,
          r.category,
          r.quantity,
          r.description,
          r.subElements,
        ].join("\t")
      );
    }

    lines.push("");
    lines.push(`Total Wire Segments\t${summary.wireStats.totalWires}`);
    lines.push(`Distinct Nets\t${summary.wireStats.totalNets}`);
    lines.push(`Estimated Wire Length (m)\t${summary.wireStats.estWireLengthMeters}`);

    return lines.join("\n");
  }
}
