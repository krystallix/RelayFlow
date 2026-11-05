import { RelayFlowProject, SmrlFile, SmrlElement, SmrlConnector, CircuitNode, CircuitWire, Rotation } from "../types";
import catalogData from "../../constants/components-catalog.json";

const catalog = catalogData as Record<string, any>;

export class FileAdapter {
  /**
   * Detects whether the input is a RelayFlow (.rflow) or Simurelay (.smrl) format
   */
  static detectFormat(json: any): "relayflow" | "smrl" | "unknown" {
    if (json?.format === "relayflow" && Array.isArray(json?.nodes)) {
      return "relayflow";
    }
    if (json?.header?.simurelay === "simurelay" && Array.isArray(json?.data)) {
      return "smrl";
    }
    return "unknown";
  }

  /**
   * Parses either .rflow or .smrl file content into unified RelayFlowProject
   */
  static parse(fileContent: string, fileName?: string): RelayFlowProject {
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch (err: any) {
      throw new Error(`Invalid JSON file content: ${err.message}`);
    }

    const format = this.detectFormat(parsed);

    if (format === "relayflow") {
      return parsed as RelayFlowProject;
    }

    if (format === "smrl") {
      return this.fromSmrl(parsed as SmrlFile, fileName);
    }

    throw new Error("Unsupported file format. Please upload a valid .rflow or .smrl file.");
  }

  /**
   * Converts Simurelay .smrl structure into RelayFlowProject (.rflow)
   */
  static fromSmrl(smrl: SmrlFile, fileName?: string): RelayFlowProject {
    const rawElements = smrl.data.filter((d): d is SmrlElement => d.type === "ElectricalElement");
    const rawConnectors = smrl.data.filter((d): d is SmrlConnector => d.type === "Connector");

    const nodes: CircuitNode[] = rawElements.map((el) => {
      const compDef = catalog[el.svgData];
      const category = compDef?.category || "general";
      const name = compDef?.name || el.svgData;

      return {
        id: el.id,
        componentId: el.svgData,
        name,
        category,
        tag: el.tag,
        comment: el.comment,
        position: el.position || { x: 0, y: 0 },
        rotation: (Math.max(0, Math.min(3, el.rotation || 0))) as Rotation,
        frameIndex: el.frameIndex || 0,
        isClosed: el.frameIndex === 1, // frame 1 is closed for contacts/switches in Simurelay
        isEnergized: el.frameIndex === 1,
        valueTimeOn: el.valueTimeOn,
        valueTimeOff: el.valueTimeOff,
        colorType: el.colorType,
        tagVisibility: el.tagVisibility !== false,
      };
    });

    const wires: CircuitWire[] = rawConnectors.map((c) => ({
      id: c.id,
      fromNodeId: c.idElementNode1,
      fromPortId: c.idNode1,
      toNodeId: c.idElementNode2,
      toPortId: c.idNode2,
      margins: {
        start: c.margins?.start || 0,
        center: c.margins?.center || 0,
        end: c.margins?.end || 0,
      },
    }));

    const title = fileName ? fileName.replace(/\.(smrl|rflow)$/i, "") : "Imported Circuit";

    return {
      format: "relayflow",
      version: "1.0.0",
      metadata: {
        title,
        createdAt: smrl.header.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: "Simurelay Import",
        description: "Converted from Simurelay .smrl format",
      },
      settings: {
        gridSize: 30,
        wireRouting: "orthogonal",
        theme: "dark",
      },
      nodes,
      wires,
    };
  }

  /**
   * Serializes a project into native .rflow JSON string
   */
  static toRflow(project: RelayFlowProject): string {
    return JSON.stringify(project, null, 2);
  }

  /**
   * Serializes a RelayFlowProject back into legacy .smrl JSON string
   */
  static toSmrl(project: RelayFlowProject): string {
    const data: Array<SmrlElement | SmrlConnector> = [];

    // Convert nodes to ElectricalElement
    for (const node of project.nodes) {
      data.push({
        type: "ElectricalElement",
        id: typeof node.id === "number" ? node.id : parseInt(node.id, 10) || 0,
        svgData: node.componentId,
        position: node.position,
        rotation: node.rotation,
        text: null,
        tag: node.tag,
        comment: node.comment,
        value: null,
        tagVisibility: node.tagVisibility !== false,
        valueTimeOn: node.valueTimeOn || 0,
        valueTimeOff: node.valueTimeOff || 0,
        colorType: node.colorType || 0,
        frameIndex: node.frameIndex,
      });
    }

    // Convert wires to Connector
    for (const wire of project.wires) {
      data.push({
        type: "Connector",
        id: typeof wire.id === "number" ? wire.id : parseInt(String(wire.id), 10) || 0,
        idElementNode1: typeof wire.fromNodeId === "number" ? wire.fromNodeId : parseInt(String(wire.fromNodeId), 10) || 0,
        idNode1: wire.fromPortId,
        idElementNode2: typeof wire.toNodeId === "number" ? wire.toNodeId : parseInt(String(wire.toNodeId), 10) || 0,
        idNode2: wire.toPortId,
        margins: wire.margins,
      });
    }

    const smrl: SmrlFile = {
      header: {
        simurelay: "simurelay",
        "3.0.0.30": "1.0",
        created_at: project.metadata.createdAt || new Date().toISOString(),
      },
      data,
    };

    return JSON.stringify(smrl, null, 2);
  }
}
