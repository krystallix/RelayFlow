import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const SOURCE_ICONS_DIR = "/Applications/Simurelay.app/Contents/Frameworks/App.framework/Versions/A/Resources/flutter_assets/assets/icons";
const SOURCE_EXAMPLES_DIR = "/Applications/Simurelay.app/Contents/Frameworks/App.framework/Versions/A/Resources/flutter_assets/assets/examples";

const TARGET_SYMBOLS_DIR = path.resolve("./public/symbols");
const TARGET_EXAMPLES_DIR = path.resolve("./public/examples");
const TARGET_CATALOG_FILE = path.resolve("./src/constants/components-catalog.json");

interface ComponentNode {
  id: number;
  tag: string;
  direction: number; // 0=Top, 1=Right, 2=Bottom, 3=Left
  type: string;
  dx: number;
  dy: number;
}

interface ComponentContact {
  id: number;
  nodeId1: number;
  nodeId2: number;
  type?: string; // "no", "nc", etc.
  enableFrames?: string;
}

interface ComponentInfo {
  category: string;
  type: string;
  tagType: string;
  timerType?: string;
  width: number;
  height: number;
  name: string;
  description: string;
  duplicateTag?: boolean;
}

export interface ComponentDefinition {
  id: string; // e.g. "breaker3p"
  name: string;
  description: string;
  category: string;
  type: string;
  tagType: string;
  timerType?: string;
  width: number;
  height: number;
  svgPath: string;
  nodes: ComponentNode[];
  contacts: ComponentContact[];
  framesCount: number;
}

async function extractAssets() {
  if (!fs.existsSync(SOURCE_ICONS_DIR)) {
    console.error("Source icons directory not found:", SOURCE_ICONS_DIR);
    process.exit(1);
  }

  fs.mkdirSync(TARGET_SYMBOLS_DIR, { recursive: true });
  fs.mkdirSync(TARGET_EXAMPLES_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(TARGET_CATALOG_FILE), { recursive: true });

  const files = fs.readdirSync(SOURCE_ICONS_DIR).filter((f) => f.endsWith(".svg"));
  console.log(`Found ${files.length} SVG files.`);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
  });

  const catalog: Record<string, ComponentDefinition> = {};

  for (const file of files) {
    const componentId = path.basename(file, ".svg");
    const sourceFilePath = path.join(SOURCE_ICONS_DIR, file);
    const targetFilePath = path.join(TARGET_SYMBOLS_DIR, file);

    const content = fs.readFileSync(sourceFilePath, "utf-8");

    // Copy SVG directly to public/symbols/
    fs.writeFileSync(targetFilePath, content, "utf-8");

    // Parse metadata
    try {
      const parsed = parser.parse(content);
      const metadata = parsed.svg?.metadata;
      if (!metadata) {
        continue;
      }

      const infoRaw = metadata.info || {};
      const width = parseFloat(infoRaw["@_width"] || "120");
      const height = parseFloat(infoRaw["@_height"] || "120");

      // Extract nodes
      const nodes: ComponentNode[] = [];
      const nodesContainer = metadata.nodes;
      if (nodesContainer) {
        // If metadata.nodes is an array of variants (e.g. <nodes id="0">, <nodes id="1">), take only the active/first variant (id="0")
        const primaryContainer = Array.isArray(nodesContainer)
          ? nodesContainer.find((item: any) => item["@_id"] === "0" || item["@_id"] === 0) || nodesContainer[0]
          : nodesContainer;

        const rawNodes = primaryContainer.node
          ? Array.isArray(primaryContainer.node)
            ? primaryContainer.node
            : [primaryContainer.node]
          : [];
        for (const n of rawNodes) {
          nodes.push({
            id: parseInt(n["@_id"] || "0", 10),
            tag: n["@_tag"] || "",
            direction: parseInt(n["@_direction"] || "0", 10),
            type: n["@_type"] || "contact",
            dx: parseFloat(n["@_dx"] || "0"),
            dy: parseFloat(n["@_dy"] || "0"),
          });
        }
      }

      // Extract contacts
      const contacts: ComponentContact[] = [];
      const contactsContainer = metadata.contacts;
      if (contactsContainer?.contact) {
        const contactList = Array.isArray(contactsContainer.contact)
          ? contactsContainer.contact
          : [contactsContainer.contact];

        for (const c of contactList) {
          contacts.push({
            id: parseInt(c["@_id"] || "0", 10),
            nodeId1: parseInt(c["@_nodeId1"] || "0", 10),
            nodeId2: parseInt(c["@_nodeId2"] || "0", 10),
            type: c["@_type"],
            enableFrames: c["@_enableFrames"],
          });
        }
      }

      // Extract frames
      let framesCount = 1;
      const framesContainer = metadata.frames;
      if (framesContainer?.frame) {
        const frameList = Array.isArray(framesContainer.frame)
          ? framesContainer.frame
          : [framesContainer.frame];
        framesCount = frameList.length;
      }

      catalog[componentId] = {
        id: componentId,
        name: infoRaw["@_name"] || componentId,
        description: infoRaw["@_description"] || componentId,
        category: infoRaw["@_category"] || "general",
        type: infoRaw["@_type"] || "component",
        tagType: infoRaw["@_tagType"] || "",
        timerType: infoRaw["@_timerType"],
        width,
        height,
        svgPath: `/symbols/${file}`,
        nodes,
        contacts,
        framesCount,
      };
    } catch (e) {
      console.warn(`Could not parse metadata for ${file}:`, e);
    }
  }

  fs.writeFileSync(TARGET_CATALOG_FILE, JSON.stringify(catalog, null, 2), "utf-8");
  console.log(`Generated catalog with ${Object.keys(catalog).length} components at ${TARGET_CATALOG_FILE}`);

  // Copy example .smrl file
  const exampleFile = path.join(SOURCE_EXAMPLES_DIR, "dol%20starter%20example.smrl");
  if (fs.existsSync(exampleFile)) {
    const exampleContent = fs.readFileSync(exampleFile, "utf-8");
    fs.writeFileSync(path.join(TARGET_EXAMPLES_DIR, "dol-starter.smrl"), exampleContent, "utf-8");
    console.log("Copied dol-starter.smrl to public/examples/dol-starter.smrl");
  }
}

extractAssets().catch(console.error);
