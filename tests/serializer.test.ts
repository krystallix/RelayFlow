import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FileAdapter } from "../src/engine/serializer/FileAdapter";

describe("FileAdapter (.rflow and .smrl)", () => {
  it("should parse dol-starter.smrl and convert to RelayFlowProject", () => {
    const smrlPath = path.resolve("./public/examples/dol-starter.smrl");
    expect(fs.existsSync(smrlPath)).toBe(true);

    const smrlContent = fs.readFileSync(smrlPath, "utf-8");
    const project = FileAdapter.parse(smrlContent, "dol-starter.smrl");

    expect(project.format).toBe("relayflow");
    expect(project.version).toBe("1.0.0");
    expect(project.nodes.length).toBeGreaterThan(0);
    expect(project.wires.length).toBeGreaterThan(0);

    // Verify KM1 contactor and Motor exist in nodes
    const motor = project.nodes.find((n) => n.componentId === "motor3ph");
    expect(motor).toBeDefined();
    expect(motor?.tag).toBe("-M1");

    const contactor = project.nodes.find((n) => n.tag === "-KM1");
    expect(contactor).toBeDefined();
  });

  it("should serialize to .rflow and parse back identically", () => {
    const smrlPath = path.resolve("./public/examples/dol-starter.smrl");
    const smrlContent = fs.readFileSync(smrlPath, "utf-8");
    const project = FileAdapter.parse(smrlContent, "dol-starter.smrl");

    const rflowJson = FileAdapter.toRflow(project);
    const roundtripProject = FileAdapter.parse(rflowJson);

    expect(roundtripProject.format).toBe("relayflow");
    expect(roundtripProject.nodes.length).toBe(project.nodes.length);
    expect(roundtripProject.wires.length).toBe(project.wires.length);
  });

  it("should serialize back to .smrl format", () => {
    const smrlPath = path.resolve("./public/examples/dol-starter.smrl");
    const smrlContent = fs.readFileSync(smrlPath, "utf-8");
    const project = FileAdapter.parse(smrlContent, "dol-starter.smrl");

    const exportedSmrl = FileAdapter.toSmrl(project);
    const parsedSmrl = JSON.parse(exportedSmrl);

    expect(parsedSmrl.header.simurelay).toBe("simurelay");
    expect(Array.isArray(parsedSmrl.data)).toBe(true);
    expect(parsedSmrl.data.length).toBe(project.nodes.length + project.wires.length);
  });
});
