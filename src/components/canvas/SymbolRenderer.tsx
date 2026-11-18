"use client";

import React, { useEffect, useState } from "react";
import { TEXT_CENTERS } from "@/constants/symbol-text-centers";

export { TEXT_CENTERS };

// In-memory cache for raw SVG strings so fetches happen only once
export const svgCache = new Map<string, string>();
const fetchPromises = new Map<string, Promise<string>>();

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

export const SymbolRenderer: React.FC<SymbolRendererProps> = React.memo(({
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
});
SymbolRenderer.displayName = "SymbolRenderer";
