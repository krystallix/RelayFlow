import { describe, it, expect } from "vitest";
import { BomExporter } from "@/engine/export/BomExporter";
import { CadSvgGenerator, CadExportOptions } from "@/engine/export/CadSvgGenerator";
import { CircuitNode, CircuitWire } from "@/engine/types";

function createMockNode(partial: Partial<CircuitNode>): CircuitNode {
  return {
    id: String(Math.random()),
    componentId: "coil",
    name: "Coil",
    category: "coils",
    tag: null,
    comment: null,
    position: { x: 300, y: 300 },
    rotation: 0,
    frameIndex: 0,
    ...partial,
  };
}

describe("BomExporter", () => {
  it("groups coupled contactor coil, contacts, and power poles into 1 Contactor item", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ componentId: "contactor3p", name: "Contactor 3P", category: "contactors", tag: "-KM1" }),
      createMockNode({ componentId: "coil", name: "Coil", category: "coils", tag: "-KM1" }),
      createMockNode({ componentId: "contactNO", name: "Contact NO", category: "auxiliaries", tag: "-KM1" }),
      createMockNode({ componentId: "contactNC", name: "Contact NC", category: "auxiliaries", tag: "-KM1" }),
      createMockNode({ componentId: "buttonNO", name: "Push Button NO", category: "switches", tag: "-S1" }),
    ];

    const wires: CircuitWire[] = [
      {
        id: "wire-1",
        fromNodeId: nodes[0].id,
        fromPortId: 0,
        toNodeId: nodes[1].id,
        toPortId: 0,
      },
    ];

    const summary = BomExporter.generateBomSummary(nodes, wires);

    expect(summary.totalDevices).toBe(2); // 1 Contactor (-KM1) + 1 Button (-S1)
    const km1 = summary.records.find((r) => r.tag === "-KM1");
    expect(km1).toBeDefined();
    expect(km1?.type).toBe("Contactor");
    expect(km1?.quantity).toBe(1);
    expect(km1?.subElements).toContain("Coil");
    expect(km1?.subElements).toContain("Contact NO");

    const s1 = summary.records.find((r) => r.tag === "-S1");
    expect(s1).toBeDefined();
    expect(s1?.type).toBe("Push Button");
  });

  it("calculates wire network metrics and length estimation", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ id: "node-1", position: { x: 100, y: 100 } }),
      createMockNode({ id: "node-2", position: { x: 200, y: 100 } }),
    ];
    const wires: CircuitWire[] = [
      {
        id: "wire-1",
        fromNodeId: "node-1",
        fromPortId: 0,
        toNodeId: "node-2",
        toPortId: 0,
      },
      {
        id: "wire-2",
        fromNodeId: "node-1",
        fromPortId: 1,
        toNodeId: "node-2",
        toPortId: 1,
      },
    ];

    const summary = BomExporter.generateBomSummary(nodes, wires);
    expect(summary.wireStats.totalWires).toBe(2);
    expect(summary.wireStats.totalConnections).toBe(4);
    expect(summary.wireStats.estWireLengthMeters).toBeGreaterThan(0);
  });

  it("generates CSV with UTF-8 BOM byte \\uFEFF and RFC-4180 escaping", () => {
    const nodes: CircuitNode[] = [
      createMockNode({
        componentId: "breaker3p",
        name: "Circuit Breaker 3P",
        category: "protections",
        tag: "-Q1",
        comment: '10A, "Thermal-Magnetic"',
      }),
    ];
    const wires: CircuitWire[] = [];

    const summary = BomExporter.generateBomSummary(nodes, wires);
    const csv = BomExporter.toCsv(summary, "Motor Control Panel");

    // Must start with UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // Contains project header
    expect(csv).toContain("Motor Control Panel");
    expect(csv).toContain("Item #");
    expect(csv).toContain("-Q1");
    expect(csv).toContain("MCB");

    // Escaped quotes test
    expect(csv).toContain('""Thermal-Magnetic""');

    // Wire summary included
    expect(csv).toContain("WIRE & NETWORKING SUMMARY");
  });

  it("generates TSV table for clipboard paste into Excel", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ componentId: "lamp", name: "Pilot Lamp", category: "loads", tag: "-H1" }),
    ];
    const summary = BomExporter.generateBomSummary(nodes, []);
    const tsv = BomExporter.toTsv(summary);

    expect(tsv).toContain("Item #\tTag\tComponent Type\tCategory\tQty\tDescription\tSub-elements");
    expect(tsv).toContain("1\t-H1\tLamp\tloads\t1");
  });
});

describe("CadSvgGenerator", () => {
  const mockOptions: CadExportOptions = {
    paperSize: "A4",
    orientation: "landscape",
    theme: "monochrome",
    projectTitle: "Star-Delta Motor Starter",
    author: "Ir. John Doe",
    organization: "PT Industrial Automation",
    revision: "REV 2.1",
    date: "2026-11-16",
    scale: "1:1",
    sheetNumber: "1/1",
  };

  it("generates valid standalone SVG with correct A4 dimensions and CAD elements", () => {
    const nodes: CircuitNode[] = [
      createMockNode({
        id: "node-1",
        componentId: "contactor3p",
        name: "Contactor",
        category: "contactors",
        tag: "-KM1",
        position: { x: 300, y: 300 },
      }),
    ];
    const wires: CircuitWire[] = [];

    const svg = CadSvgGenerator.generateSvg(nodes, wires, mockOptions);

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 1190 842"');
    expect(svg).toContain('width="1190"');
    expect(svg).toContain('height="842"');

    // CAD coordinate grid markers
    expect(svg).toContain('class="cad-grid-text">1</text>');
    expect(svg).toContain('class="cad-grid-text">A</text>');

    // Title Block content
    expect(svg).toContain("Star-Delta Motor Starter");
    expect(svg).toContain("Ir. John Doe");
    expect(svg).toContain("PT Industrial Automation");
    expect(svg).toContain("REV 2.1");
    expect(svg).toContain("2026-11-16");

    // Component rendered with Tag
    expect(svg).toContain('id="node-node-1"');
    expect(svg).toContain("-KM1");
  });

  it("handles A3 paper size and portrait orientation correctly", () => {
    const svgA3Portrait = CadSvgGenerator.generateSvg([], [], {
      ...mockOptions,
      paperSize: "A3",
      orientation: "portrait",
    });

    expect(svgA3Portrait).toContain('viewBox="0 0 1190 1684"');
  });

  it("renders wires and crossing jumps in schematic drawing group", () => {
    const nodes: CircuitNode[] = [
      createMockNode({ id: "n1", position: { x: 100, y: 100 } }),
      createMockNode({ id: "n2", position: { x: 250, y: 100 } }),
    ];
    const wires: CircuitWire[] = [
      {
        id: "w1",
        fromNodeId: "n1",
        fromPortId: 0,
        toNodeId: "n2",
        toPortId: 0,
        label: "101",
      },
    ];

    const svg = CadSvgGenerator.generateSvg(nodes, wires, mockOptions);

    expect(svg).toContain('<g id="cad-schematic-drawing"');
    expect(svg).toContain('class="cad-wire"');
    expect(svg).toContain("101"); // Wire label rendered
  });

  it("organizes title block rows with non-overlapping Y coordinates", () => {
    const svg = CadSvgGenerator.generateSvg([], [], mockOptions);

    // Organization should be in Row 2, Drafter in Row 3
    const orgHeaderMatch = svg.match(/<text [^>]*>ORGANIZATION \/ COMPANY<\/text>/);
    const orgValMatch = svg.match(/<text [^>]*>PT Industrial Automation<\/text>/);
    const drafterHeaderMatch = svg.match(/<text [^>]*>DRAFTER<\/text>/);
    const drafterValMatch = svg.match(/<text [^>]*>Ir\. John Doe<\/text>/);

    expect(orgHeaderMatch).toBeTruthy();
    expect(orgValMatch).toBeTruthy();
    expect(drafterHeaderMatch).toBeTruthy();
    expect(drafterValMatch).toBeTruthy();

    const parseY = (tag: string) => {
      const match = tag.match(/y="([^"]+)"/);
      return match ? parseFloat(match[1]) : NaN;
    };

    const orgHeaderY = parseY(orgHeaderMatch![0]);
    const orgValY = parseY(orgValMatch![0]);
    const drafterHeaderY = parseY(drafterHeaderMatch![0]);
    const drafterValY = parseY(drafterValMatch![0]);

    // Organization must be placed strictly above Drafter
    expect(orgValY).toBeLessThan(drafterHeaderY);
    expect(orgHeaderY).toBeLessThan(orgValY);
    expect(drafterHeaderY).toBeLessThan(drafterValY);
  });

  it("inlines original SVG symbols, replaces white fills with CAD dark ink, and counter-rotates text", () => {
    const mockMotorSvg = `<svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r="70" id="mainPath1" style="fill:none;stroke:#ffffff;stroke-width:2" />
      <path id="textPath1" style="fill:#ffffff" d="M 100 80 L 120 100" />
    </svg>`;

    const symbolMap = new Map<string, string>();
    symbolMap.set("/symbols/motor3ph.svg", mockMotorSvg);

    const nodes: CircuitNode[] = [
      createMockNode({
        id: "motor-1",
        componentId: "motor3ph",
        name: "Three-Phase Motor",
        rotation: 1, // 90 degrees clockwise
        position: { x: 500, y: 500 },
      }),
    ];

    const svg = CadSvgGenerator.generateSvg(nodes, [], mockOptions, symbolMap);

    // Motor main circle stroke converted to dark ink
    expect(svg).toContain('style="fill:none;stroke:#0f172a;stroke-width:2"');
    // Motor "M" text path converted from fill:#ffffff to fill:#0f172a
    expect(svg).toContain('id="textPath1" style="fill:#0f172a"');
    // White fills must NOT remain in the symbol
    expect(svg).not.toContain('style="fill:#ffffff"');
    // Counter-rotation (-90 deg around motor center 90, 90) applied to textPath1
    expect(svg).toContain('transform="rotate(-90 90 90)"');
  });
});
