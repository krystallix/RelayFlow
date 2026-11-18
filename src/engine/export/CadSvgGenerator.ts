import { CircuitNode, CircuitWire, Point } from "@/engine/types";
import { ManhattanRouter } from "@/engine/router/ManhattanRouter";
import { WireIntersectionResolver } from "@/engine/router/WireIntersectionResolver";
import { WireNetResolver } from "@/engine/router/WireNetResolver";
import { TEXT_CENTERS } from "@/constants/symbol-text-centers";
import catalogData from "@/constants/components-catalog.json";

const catalog = catalogData as Record<string, any>;

export interface CadExportOptions {
  paperSize: "A4" | "A3";
  orientation: "landscape" | "portrait";
  theme?: "monochrome" | "color";
  projectTitle: string;
  author: string;
  organization: string;
  revision: string;
  date: string;
  sheetNumber?: string;
  scale?: string;
}

export class CadSvgGenerator {
  /**
   * Generates a complete, standalone, high-resolution CAD Blueprint SVG string.
   */
  static generateSvg(
    nodes: CircuitNode[],
    wires: CircuitWire[],
    options: CadExportOptions,
    symbolSvgMap?: Map<string, string>
  ): string {
    // 1. Determine Sheet Dimensions (in standard CAD points: 72/96 DPI compliant)
    // A4: 1190 x 842 pt (Landscape) or 842 x 1190 pt (Portrait)
    // A3: 1684 x 1190 pt (Landscape) or 1190 x 1684 pt (Portrait)
    let pageWidth = 1190;
    let pageHeight = 842;

    if (options.paperSize === "A3") {
      pageWidth = options.orientation === "portrait" ? 1190 : 1684;
      pageHeight = options.orientation === "portrait" ? 1684 : 1190;
    } else {
      pageWidth = options.orientation === "portrait" ? 842 : 1190;
      pageHeight = options.orientation === "portrait" ? 1190 : 842;
    }

    const isMono = options.theme !== "color";
    const bgFill = "#ffffff";
    const cadBorderStroke = isMono ? "#0f172a" : "#1e293b";
    const wireStroke = isMono ? "#0f172a" : "#2563eb";
    const textColor = isMono ? "#0f172a" : "#0f172a";
    const subTextColor = "#64748b";

    // 2. Margins & Inner Drawing Frame (Left binding margin: 40px, Others: 20px)
    const marginL = 40;
    const marginT = 20;
    const marginR = 20;
    const marginB = 20;

    const frameX = marginL;
    const frameY = marginT;
    const frameW = pageWidth - marginL - marginR;
    const frameH = pageHeight - marginT - marginB;

    // 3. Title Block Dimensions (Bottom-Right ISO 7200 format)
    const titleBlockW = 340;
    const titleBlockH = 92;
    const tbX = frameX + frameW - titleBlockW;
    const tbY = frameY + frameH - titleBlockH;

    // 4. Compute Circuit Bounding Box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const c = catalog[node.componentId];
      const hw = (c?.width || 120) / 2;
      const hh = (c?.height || 120) / 2;
      minX = Math.min(minX, node.position.x - hw);
      maxX = Math.max(maxX, node.position.x + hw);
      minY = Math.min(minY, node.position.y - hh);
      maxY = Math.max(maxY, node.position.y + hh);
    }

    // Include wire tap points in bounds
    for (const wire of wires) {
      if (wire.tapPoint) {
        minX = Math.min(minX, wire.tapPoint.x);
        maxX = Math.max(maxX, wire.tapPoint.x);
        minY = Math.min(minY, wire.tapPoint.y);
        maxY = Math.max(maxY, wire.tapPoint.y);
      }
    }

    if (minX === Infinity) {
      // Empty circuit fallback
      minX = 0;
      maxX = 400;
      minY = 0;
      maxY = 300;
    }

    // Add padding to circuit bounds
    const pad = 60;
    const circuitW = Math.max(100, maxX - minX + pad * 2);
    const circuitH = Math.max(100, maxY - minY + pad * 2);
    const cCenterX = (minX + maxX) / 2;
    const cCenterY = (minY + maxY) / 2;

    // Available drawing area inside frame (excluding title block)
    const drawAreaW = frameW - 40;
    const drawAreaH = frameH - 40;
    const drawCenterX = frameX + frameW / 2;
    const drawCenterY = frameY + (frameH - 20) / 2;

    // Scale to fit neatly inside CAD frame
    const scaleFactor = Math.min(drawAreaW / circuitW, drawAreaH / circuitH, 1.25);
    const effectiveScale = Number(scaleFactor.toFixed(3));

    // Translation to center the circuit
    const transX = drawCenterX - cCenterX * effectiveScale;
    const transY = drawCenterY - cCenterY * effectiveScale;

    // 5. Precompute Wires & Routes
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const wireMap = new Map(wires.map((w) => [w.id, w]));
    const wireRoutes = new Map<string | number, Point[]>();
    const wireSvgPaths = new Map<string | number, string>();

    for (const wire of wires) {
      const endpoints = ManhattanRouter.resolveWireEndpoints(wire, nodeMap, wireMap);
      if (!endpoints) continue;
      const { p1, dir1, p2, dir2, isTapWire } = endpoints;
      const effectiveMargins = isTapWire ? { ...wire.margins, end: -30 } : wire.margins;
      const routed = ManhattanRouter.routeOrthogonal(p1, dir1, p2, dir2, effectiveMargins);
      wireRoutes.set(wire.id, routed.points);
      wireSvgPaths.set(wire.id, routed.svgPath);
    }

    // Resolve Crossing Bridge Jumps
    const crossingsMap = WireIntersectionResolver.resolveAllCrossings(wires, wireRoutes);
    const wireNets = WireNetResolver.resolveWireNets(wires, nodes);

    // 6. Build SVG XML Content
    const svgParts: string[] = [];

    // Header
    svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageWidth} ${pageHeight}" width="${pageWidth}" height="${pageHeight}">`
    );

    // Styles
    svgParts.push(`<style>
      .cad-bg { fill: ${bgFill}; }
      .cad-border { stroke: ${cadBorderStroke}; stroke-width: 1.5; fill: none; }
      .cad-thin { stroke: ${cadBorderStroke}; stroke-width: 0.75; fill: none; }
      .cad-grid-text { font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; fill: ${subTextColor}; text-anchor: middle; dominant-baseline: central; }
      .cad-tb-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: bold; fill: ${textColor}; }
      .cad-tb-header { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 8px; font-weight: bold; fill: ${subTextColor}; text-transform: uppercase; }
      .cad-tb-val { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; font-weight: 600; fill: ${textColor}; }
      .cad-wire { stroke: ${wireStroke}; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .cad-wire-dot { fill: ${wireStroke}; }
      .cad-tag { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; font-weight: bold; fill: ${textColor}; }
      .cad-comment { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 9px; fill: ${subTextColor}; font-style: italic; }
      .cad-pin { font-family: 'Courier New', monospace; font-size: 8px; font-weight: bold; fill: ${subTextColor}; }
    </style>`);

    // Paper Background
    svgParts.push(`<rect width="${pageWidth}" height="${pageHeight}" class="cad-bg" />`);

    // 7. Outer & Inner CAD Border
    // Outer Border (5px inset)
    svgParts.push(`<rect x="8" y="8" width="${pageWidth - 16}" height="${pageHeight - 16}" class="cad-thin" />`);
    // Main Drawing Inner Frame
    svgParts.push(`<rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" class="cad-border" />`);

    // 8. Coordinate Grid Reference System (Columns 1-8 Top/Bottom, Rows A-F Left/Right)
    const cols = 8;
    const rows = 6;
    const colStep = frameW / cols;
    const rowStep = frameH / rows;

    // Top & Bottom Columns (1..8)
    for (let c = 0; c < cols; c++) {
      const cx = frameX + c * colStep + colStep / 2;
      const colNum = String(c + 1);
      // Top marker
      svgParts.push(`<text x="${cx}" y="${marginT / 2 + 1}" class="cad-grid-text">${colNum}</text>`);
      // Bottom marker
      svgParts.push(`<text x="${cx}" y="${pageHeight - marginB / 2}" class="cad-grid-text">${colNum}</text>`);
      // Top tick
      if (c > 0) {
        const tickX = frameX + c * colStep;
        svgParts.push(`<line x1="${tickX}" y1="${marginT - 4}" x2="${tickX}" y2="${marginT}" class="cad-thin" />`);
        svgParts.push(`<line x1="${tickX}" y1="${pageHeight - marginB}" x2="${tickX}" y2="${pageHeight - marginB + 4}" class="cad-thin" />`);
      }
    }

    // Left & Right Rows (A..F)
    const rowLetters = ["A", "B", "C", "D", "E", "F"];
    for (let r = 0; r < rows; r++) {
      const cy = frameY + r * rowStep + rowStep / 2;
      const letter = rowLetters[r] || String.fromCharCode(65 + r);
      // Left marker
      svgParts.push(`<text x="${marginL / 2}" y="${cy}" class="cad-grid-text">${letter}</text>`);
      // Right marker
      svgParts.push(`<text x="${pageWidth - marginR / 2}" y="${cy}" class="cad-grid-text">${letter}</text>`);
      // Tick marks
      if (r > 0) {
        const tickY = frameY + r * rowStep;
        svgParts.push(`<line x1="${marginL - 4}" y1="${tickY}" x2="${marginL}" y2="${tickY}" class="cad-thin" />`);
        svgParts.push(`<line x1="${pageWidth - marginR}" y1="${tickY}" x2="${pageWidth - marginR + 4}" y2="${tickY}" class="cad-thin" />`);
      }
    }

    // 9. Standard ISO 7200 Title Block (Etiket)
    svgParts.push(`<g id="cad-title-block">`);
    // Outer box
    svgParts.push(`<rect x="${tbX}" y="${tbY}" width="${titleBlockW}" height="${titleBlockH}" class="cad-border" fill="#ffffff" />`);
    // Horizontal dividers separating the 4 distinct rows
    svgParts.push(`<line x1="${tbX}" y1="${tbY + 28}" x2="${tbX + titleBlockW}" y2="${tbY + 28}" class="cad-thin" />`);
    svgParts.push(`<line x1="${tbX}" y1="${tbY + 52}" x2="${tbX + titleBlockW}" y2="${tbY + 52}" class="cad-thin" />`);
    svgParts.push(`<line x1="${tbX}" y1="${tbY + 76}" x2="${tbX + titleBlockW}" y2="${tbY + 76}" class="cad-thin" />`);

    // Vertical dividers strictly inside Row 3 (Drafter, Date, Scale, Revision)
    const col3W = titleBlockW / 4;
    svgParts.push(`<line x1="${tbX + col3W}" y1="${tbY + 52}" x2="${tbX + col3W}" y2="${tbY + 76}" class="cad-thin" />`);
    svgParts.push(`<line x1="${tbX + col3W * 2}" y1="${tbY + 52}" x2="${tbX + col3W * 2}" y2="${tbY + 76}" class="cad-thin" />`);
    svgParts.push(`<line x1="${tbX + col3W * 3}" y1="${tbY + 52}" x2="${tbX + col3W * 3}" y2="${tbY + 76}" class="cad-thin" />`);

    // Row 1 Content: Project Title & Format (tbY to tbY + 28)
    const safeTitle = (options.projectTitle || "RelayFlow Circuit").replace(/[<>&]/g, "");
    svgParts.push(`<text x="${tbX + 8}" y="${tbY + 18}" class="cad-tb-title">${safeTitle}</text>`);
    svgParts.push(`<text x="${tbX + titleBlockW - 8}" y="${tbY + 18}" text-anchor="end" class="cad-tb-header">${options.paperSize} ${options.orientation.toUpperCase()}</text>`);

    // Row 2 Content: Organization / Institution (tbY + 28 to tbY + 52)
    const safeOrg = (options.organization || "RelayFlow Industrial CAD Studio").replace(/[<>&]/g, "");
    svgParts.push(`<text x="${tbX + 8}" y="${tbY + 38}" class="cad-tb-header">ORGANIZATION / COMPANY</text>`);
    svgParts.push(`<text x="${tbX + 8}" y="${tbY + 48}" class="cad-tb-val">${safeOrg}</text>`);

    // Row 3 Content: 4 Columns (Drafter, Date, Scale, Revision) (tbY + 52 to tbY + 76)
    // Col 1: Drafter
    const safeAuthor = (options.author || "RelayFlow Web").replace(/[<>&]/g, "");
    svgParts.push(`<text x="${tbX + 6}" y="${tbY + 62}" class="cad-tb-header">DRAFTER</text>`);
    svgParts.push(`<text x="${tbX + 6}" y="${tbY + 72}" class="cad-tb-val">${safeAuthor}</text>`);

    // Col 2: Date
    const safeDate = (options.date || new Date().toISOString().slice(0, 10)).replace(/[<>&]/g, "");
    svgParts.push(`<text x="${tbX + col3W + 6}" y="${tbY + 62}" class="cad-tb-header">DATE</text>`);
    svgParts.push(`<text x="${tbX + col3W + 6}" y="${tbY + 72}" class="cad-tb-val">${safeDate}</text>`);

    // Col 3: Scale & Sheet
    const safeScale = (options.scale || `1:${(1 / effectiveScale).toFixed(1)}`).replace(/[<>&]/g, "");
    svgParts.push(`<text x="${tbX + col3W * 2 + 6}" y="${tbY + 62}" class="cad-tb-header">SCALE / SHEET</text>`);
    svgParts.push(`<text x="${tbX + col3W * 2 + 6}" y="${tbY + 72}" class="cad-tb-val">${safeScale} • ${options.sheetNumber || "1/1"}</text>`);

    // Col 4: Revision
    const safeRev = (options.revision || "REV 1.0").replace(/[<>&]/g, "");
    svgParts.push(`<text x="${tbX + col3W * 3 + 6}" y="${tbY + 62}" class="cad-tb-header">REVISION</text>`);
    svgParts.push(`<text x="${tbX + col3W * 3 + 6}" y="${tbY + 72}" class="cad-tb-val">${safeRev}</text>`);

    // Row 4: Watermark & Standard (tbY + 76 to tbY + 92)
    svgParts.push(`<text x="${tbX + 8}" y="${tbY + 86}" class="cad-tb-header" fill="${subTextColor}">IEC 61082 / ISO 7200 STANDARD • RELAYFLOW ELECTRICAL CAD</text>`);
    svgParts.push(`</g>`);

    // 10. Render Circuit Content (Transformed with Center & Scale)
    svgParts.push(`<g id="cad-schematic-drawing" transform="translate(${transX}, ${transY}) scale(${effectiveScale})">`);

    // Render Wires
    for (const wire of wires) {
      const points = wireRoutes.get(wire.id);
      if (!points || points.length < 2) continue;

      const crossings = crossingsMap.get(wire.id);
      let pathD = wireSvgPaths.get(wire.id) || "";

      // Inject bridge arc jumps if crossings exist
      if (crossings && crossings.length > 0) {
        pathD = WireIntersectionResolver.injectArcJumps(points, crossings);
      }

      svgParts.push(`<path d="${pathD}" class="cad-wire" />`);

      // Wire Tap Dots (Junction connections)
      if (wire.tapPoint) {
        svgParts.push(`<circle cx="${wire.tapPoint.x}" cy="${wire.tapPoint.y}" r="3.5" class="cad-wire-dot" />`);
      }

      // Wire Labels (Ferrules)
      const netInfo = wireNets.get(wire.id);
      const labelText = wire.label || netInfo?.label;
      if (labelText) {
        const optimalPositions = WireNetResolver.getOptimalLabelPositions(points);
        for (const pos of optimalPositions) {
          const tw = Math.max(16, labelText.length * 6 + 6);
          const th = 11;
          svgParts.push(`<g transform="translate(${pos.x}, ${pos.y})">
            <rect x="${-tw / 2}" y="${-th / 2}" width="${tw}" height="${th}" rx="2" fill="#ffffff" stroke="${isMono ? '#0f172a' : '#2563eb'}" stroke-width="0.8" />
            <text x="0" y="0.5" font-family="'Courier New', monospace" font-size="8" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${labelText}</text>
          </g>`);
        }
      }
    }

    // Render Component Nodes
    for (const node of nodes) {
      const c = catalog[node.componentId];
      const nw = c?.width || 120;
      const nh = c?.height || 120;
      const halfW = nw / 2;
      const halfH = nh / 2;
      const rotAngle = (node.rotation || 0) * 90;

      svgParts.push(`<g id="node-${node.id}" transform="translate(${node.position.x}, ${node.position.y})">`);

      // Inlined SVG Symbol or Fallback Image
      const svgPath = c?.svgPath || `/symbols/${node.componentId}.svg`;
      const inlinedSvg = symbolSvgMap?.get(svgPath);

      if (inlinedSvg) {
        // Strip XML prolog, comments, inkscape metadata and sodipodi nodes
        let cleanSymbol = inlinedSvg
          .replace(/<\?xml[^>]*\?>/g, "")
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/<sodipodi:namedview[\s\S]*?\/>/gi, "")
          .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
          .trim();

        // Counter-rotate text markings (e.g., "M" on motors, "L1/L2/L3" on power sources)
        // so they stay upright and readable when the component is rotated
        if (node.rotation && TEXT_CENTERS[node.componentId]) {
          const centers = TEXT_CENTERS[node.componentId];
          const counterRot = -node.rotation * 90;
          for (const [tId, { cx, cy }] of Object.entries(centers)) {
            const regex = new RegExp(`(<path[^>]*id="${tId}"[^>]*\\/?>)`, "g");
            cleanSymbol = cleanSymbol.replace(regex, `<g transform="rotate(${counterRot} ${cx} ${cy})">$1</g>`);
          }
        }

        // Normalize root <svg> tag attributes to match component dimension & preserve viewBox
        cleanSymbol = cleanSymbol.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
          let cleanAttrs = attrs
            .replace(/\s*x="[^"]*"/gi, "")
            .replace(/\s*y="[^"]*"/gi, "")
            .replace(/\s*width="[^"]*"/gi, "")
            .replace(/\s*height="[^"]*"/gi, "");
          if (!/viewBox=/i.test(cleanAttrs)) {
            cleanAttrs += ` viewBox="0 0 ${nw} ${nh}"`;
          }
          return `<svg x="0" y="0" width="${nw}" height="${nh}" ${cleanAttrs}>`;
        });

        if (isMono) {
          // Monochrome CAD standard:
          // 1. Replace all non-none strokes with dark slate CAD ink
          cleanSymbol = cleanSymbol
            .replace(/stroke\s*:\s*(?!none\b|transparent\b)[^;"]+/gi, `stroke:#0f172a`)
            .replace(/stroke\s*=\s*["'](?!none["']|transparent["'])[^"']+["']/gi, `stroke="#0f172a"`);

          // 2. Replace white fills (e.g., "M", "3~", "L1", "L2", "PE") with dark slate CAD ink
          // so text markings are clearly visible against the white CAD drawing paper
          cleanSymbol = cleanSymbol
            .replace(/fill\s*:\s*#(?:ffffff|fff|f9f9f9|white)\b/gi, `fill:#0f172a`)
            .replace(/fill\s*=\s*["']#(?:ffffff|fff|f9f9f9|white)["']/gi, `fill="#0f172a"`);

          // 3. Replace any other colored fills (e.g. hex codes) with dark slate CAD ink
          cleanSymbol = cleanSymbol
            .replace(/fill\s*:\s*(?!none\b|transparent\b)#[0-9a-fA-F]{3,6}/gi, `fill:#0f172a`)
            .replace(/fill\s*=\s*["'](?!none["']|transparent["'])#[0-9a-fA-F]{3,6}["']/gi, `fill="#0f172a"`);
        }

        svgParts.push(`<g transform="translate(${-halfW}, ${-halfH}) rotate(${rotAngle} ${halfW} ${halfH})">
          ${cleanSymbol}
        </g>`);
      } else {
        // Fallback: embedded image link
        svgParts.push(`<g transform="translate(${-halfW}, ${-halfH}) rotate(${rotAngle} ${halfW} ${halfH})">
          <image href="${svgPath}" width="${nw}" height="${nh}" />
        </g>`);
      }

      // Component Tag (e.g., "-KM1", "-Q1", "-F1")
      if (node.tag) {
        const tagX = -halfW;
        const tagY = -halfH - 4;
        svgParts.push(`<text x="${tagX}" y="${tagY}" class="cad-tag">${node.tag}</text>`);
      }

      // Component Comment / Description
      if (node.comment) {
        const commX = -halfW;
        const commY = halfH + 12;
        svgParts.push(`<text x="${commX}" y="${commY}" class="cad-comment">${node.comment}</text>`);
      }

      // Port Pin Numbers (Terminal markers if available in catalog)
      if (c?.nodes && Array.isArray(c.nodes)) {
        for (let pIdx = 0; pIdx < c.nodes.length; pIdx++) {
          const port = c.nodes[pIdx];
          const pinLabel = port.name || port.label;
          if (pinLabel) {
            const px = port.x - halfW;
            const py = port.y - halfH;
            svgParts.push(`<text x="${px}" y="${py - 3}" class="cad-pin">${pinLabel}</text>`);
          }
        }
      }

      svgParts.push(`</g>`);
    }

    svgParts.push(`</g>`); // End #cad-schematic-drawing

    // Close SVG
    svgParts.push(`</svg>`);

    return svgParts.join("\n");
  }
}
