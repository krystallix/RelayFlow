import { describe, it, expect } from "vitest";
import catalogData from "../src/constants/components-catalog.json";
import { ManhattanRouter } from "../src/engine/router/ManhattanRouter";

const catalog = catalogData as Record<string, any>;

describe("Circular Symbols & On-Circle Node Terminals", () => {
  it("lamp ports must be positioned directly on the top and bottom of the circle", () => {
    const lamp = catalog.lamp;
    expect(lamp).toBeDefined();
    // Circle radius = 24, center is (30, 60)
    const port0 = lamp.nodes.find((n: any) => n.id === 0);
    const port1 = lamp.nodes.find((n: any) => n.id === 1);
    expect(port0.dy).toBe(-24);
    expect(port1.dy).toBe(24);
  });

  it("motorStarDelta ports must be positioned directly on the circle circumference (radius 70)", () => {
    const motor = catalog.motorStarDelta;
    expect(motor).toBeDefined();
    for (const node of motor.nodes) {
      const dist = Math.sqrt(node.dx * node.dx + node.dy * node.dy);
      expect(dist).toBeCloseTo(70, 0);
    }
  });

  it("motor3ph ports must be positioned directly on the circle circumference (radius 70)", () => {
    const motor3ph = catalog.motor3ph;
    expect(motor3ph).toBeDefined();
    for (const node of motor3ph.nodes) {
      const dist = Math.sqrt(node.dx * node.dx + node.dy * node.dy);
      expect(dist).toBeCloseTo(70, 0);
    }
  });

  it("cleaned SVGs must not contain baked-in terminal lead lines", async () => {
    const fs = await import("fs");
    const path = await import("path");

    // Check lamp.svg: should not contain "V 84" or "V 36"
    const lampSvg = fs.readFileSync(path.resolve(process.cwd(), "public/symbols/lamp.svg"), "utf-8");
    expect(lampSvg).not.toContain("V 84 m 0,-84 V 36");

    // Check sourceL1.svg: should only contain circle path, not "v -79.5"
    const sourceL1Svg = fs.readFileSync(path.resolve(process.cwd(), "public/symbols/sourceL1.svg"), "utf-8");
    expect(sourceL1Svg).not.toContain("v -79.5");
    expect(sourceL1Svg).not.toContain("V 0");
  });

  it("ManhattanRouter must connect vertically aligned opposing ports cleanly without overshoots or loops", () => {
    // Switch port at (210, 240) facing bottom (dir=2), Lamp top port at (210, 276) facing top (dir=0)
    const routed = ManhattanRouter.routeOrthogonal(
      { x: 210, y: 240 },
      2,
      { x: 210, y: 276 },
      0
    );

    // Must be a single straight vertical line without backtrack
    expect(routed.points).toEqual([
      { x: 210, y: 240 },
      { x: 210, y: 276 },
    ]);
    expect(routed.svgPath).toBe("M 210 240 L 210 276");
  });

  it("ManhattanRouter must not overshoot or loop when ports have a small vertical gap", () => {
    // Two opposing ports separated by 36px (less than 2 * STUB_LENGTH) with a horizontal offset
    const routed = ManhattanRouter.routeOrthogonal(
      { x: 210, y: 240 },
      2,
      { x: 270, y: 276 },
      0
    );

    // Must form a clean Z-step without any backtrack or spike
    expect(routed.points.length).toBe(4);
    expect(routed.points[0]).toEqual({ x: 210, y: 240 });
    expect(routed.points[3]).toEqual({ x: 270, y: 276 });
    // Y-coordinate of middle jog must be strictly between 240 and 276
    expect(routed.points[1].y).toBeGreaterThanOrEqual(240);
    expect(routed.points[1].y).toBeLessThanOrEqual(276);
    expect(routed.points[2].y).toBe(routed.points[1].y);
  });
});
