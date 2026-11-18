/**
 * Predefined center coordinates for text paths within SVG symbols.
 * Used to apply counter-rotations so text markings (e.g., "M", "3~", "L1", "L2", "L3")
 * remain upright when a component is rotated on the schematic canvas or CAD blueprint.
 */
export const TEXT_CENTERS: Record<string, Record<string, { cx: number; cy: number }>> = {
  sourceL1L2L3N: {
    textPath1: { cx: 210, cy: 99.5 },
    textPath2: { cx: 150, cy: 99.5 },
    textPath3: { cx: 90, cy: 99.5 },
    textPath4: { cx: 30, cy: 99.5 },
  },
  sourceL1L2L3: {
    textPath1: { cx: 150, cy: 99.5 },
    textPath2: { cx: 90, cy: 99.5 },
    textPath3: { cx: 30, cy: 99.5 },
  },
  sourceL1: { textPath1: { cx: 30, cy: 99.5 } },
  sourceL2: { textPath1: { cx: 30, cy: 99.5 } },
  sourceL3: { textPath1: { cx: 30, cy: 99.5 } },
  sourceN: { textPath1: { cx: 30, cy: 99.5 } },
  sourcePE: { textPath1: { cx: 30, cy: 99.5 } },
  sourcePlus: { textPath1: { cx: 30, cy: 99.5 } },
  sourceNegative: { textPath1: { cx: 30, cy: 99.8 } },
  sourceGnd: { textPath1: { cx: 30, cy: 99.5 } },
  motor: { textPath1: { cx: 90, cy: 90 } },
  motor1ph: { textPath1: { cx: 90, cy: 90 } },
  motor3ph: { textPath1: { cx: 90, cy: 90 } },
  motorDC: { textPath1: { cx: 90, cy: 90 } },
  motorDhalander: { textPath1: { cx: 90, cy: 90 } },
  motorStarDelta: { textPath1: { cx: 90, cy: 90 } },
  motorTwoSpeeds: { textPath1: { cx: 90, cy: 90 } },
  generator3ph: { textPath1: { cx: 90, cy: 90 } },
  rollerCON: { textPath1: { cx: 20, cy: 60 }, textPath2: { cx: 38, cy: 60 } },
  rollerCON_on: { textPath1: { cx: 20, cy: 60 }, textPath2: { cx: 38, cy: 60 } },
  rollerNC: { textPath1: { cx: 20, cy: 60 }, textPath2: { cx: 26.3, cy: 60 } },
  rollerNC_on: { textPath1: { cx: 20, cy: 60 }, textPath2: { cx: 26.3, cy: 60 } },
  rollerNO: { textPath1: { cx: 20, cy: 60 }, textPath2: { cx: 26.5, cy: 60 } },
  rollerNO_on: { textPath1: { cx: 20, cy: 60 }, textPath2: { cx: 26.5, cy: 60 } },
  rollerNONC: { textPath1: { cx: -10, cy: 60 }, textPath2: { cx: 0, cy: 60 } },
  rollerNONC_on: { textPath1: { cx: -10, cy: 60 }, textPath2: { cx: 0, cy: 60 } },
};
