"use client";

import React, { useEffect, useState } from "react";

// In-memory cache for raw SVG strings so fetches happen only once
const svgCache = new Map<string, string>();
const fetchPromises = new Map<string, Promise<string>>();

// Components with text and their text path coordinates
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

function processSvg(rawSvg: string, componentId: string, rotation: number): string {
  let cleanSvg = rawSvg.replace(/<\?xml[^>]*\?>/g, "").replace(/<!--[\s\S]*?-->/g, "").trim();

  if (rotation === 0) return cleanSvg;

  const centers = TEXT_CENTERS[componentId];
  if (!centers) return cleanSvg;

  const rotAngle = -rotation * 90;

  for (const [id, { cx, cy }] of Object.entries(centers)) {
    const regex = new RegExp(`(<path[^>]*id="${id}"[^>]*\\/?>)`, "g");
    cleanSvg = cleanSvg.replace(regex, `<g transform="rotate(${rotAngle} ${cx} ${cy})">$1</g>`);
  }

  return cleanSvg;
}

interface SymbolRendererProps {
  svgPath: string;
  componentId: string;
  name: string;
  rotation: number;
  isEnergized?: boolean;
  isDark: boolean;
}

export const SymbolRenderer: React.FC<SymbolRendererProps> = ({
  svgPath,
  componentId,
  name,
  rotation,
  isEnergized,
  isDark,
}) => {
  const hasText = Boolean(TEXT_CENTERS[componentId]);
  const isOverload = componentId.toLowerCase().startsWith("overload");
  const needsInline = hasText || isOverload;
  const [svgContent, setSvgContent] = useState<string | null>(() => svgCache.get(svgPath) || null);

  useEffect(() => {
    if (!needsInline) return;
    if (svgCache.has(svgPath)) {
      setSvgContent(svgCache.get(svgPath)!);
      return;
    }

    let promise = fetchPromises.get(svgPath);
    if (!promise) {
      promise = fetch(svgPath)
        .then((res) => res.text())
        .then((text) => {
          svgCache.set(svgPath, text);
          fetchPromises.delete(svgPath);
          return text;
        });
      fetchPromises.set(svgPath, promise);
    }

    promise.then((text) => setSvgContent(text));
  }, [svgPath, needsInline]);

  const filterClass = isOverload
    ? ""
    : isDark
    ? isEnergized
      ? "brightness-125"
      : "opacity-95"
    : isEnergized
    ? "filter invert brightness-110"
    : "filter invert opacity-95";

  if (!needsInline || !svgContent) {
    return (
      <img
        src={svgPath}
        alt={name}
        className={`w-full h-full object-contain pointer-events-none select-none transition-opacity duration-150 ${filterClass}`}
      />
    );
  }

  if (isOverload && svgContent) {
    let cleanSvg = svgContent
      .replace(/<\?xml[^>]*\?>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();

    if (!isDark) {
      // In light mode, turn white strokes into dark slate CAD strokes, preserving vivid red fill
      cleanSvg = cleanSvg
        .replace(/stroke:#ffffff/g, "stroke:#0f172a")
        .replace(/stroke="#ffffff"/g, 'stroke="#0f172a"')
        .replace(/stroke:#f9f9f9/g, "stroke:#0f172a");
    }

    return (
      <div
        className="w-full h-full flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );
  }

  const processed = processSvg(svgContent, componentId, rotation);

  return (
    <div
      className={`w-full h-full flex items-center justify-center pointer-events-none select-none transition-opacity duration-150 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain ${filterClass}`}
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
};
