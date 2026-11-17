"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Image as ImageIcon,
  Layers,
  Settings,
  Eye,
} from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getTranslation } from "@/i18n/translations";
import { CadSvgGenerator, CadExportOptions } from "@/engine/export/CadSvgGenerator";
import catalogData from "@/constants/components-catalog.json";

const catalog = catalogData as Record<string, any>;

interface ExportCadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportCadModal: React.FC<ExportCadModalProps> = ({ isOpen, onClose }) => {
  const { nodes, wires, projectTitle, theme, locale } = useCircuitStore();
  const { user } = useAuthStore();
  const t = getTranslation(locale).cadModal;

  // Options state (Monochrome by default, drawing style removed)
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [title, setTitle] = useState(projectTitle || "RelayFlow Circuit");
  const [author, setAuthor] = useState(user?.email?.split("@")[0] || "RelayFlow Web");
  const [organization, setOrganization] = useState("RelayFlow Industrial CAD Studio");
  const [revision, setRevision] = useState("REV 1.0");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [copied, setCopied] = useState(false);
  const [symbolSvgMap, setSymbolSvgMap] = useState<Map<string, string>>(new Map());
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Sync title with projectTitle when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(projectTitle || "RelayFlow Circuit");
    }
  }, [isOpen, projectTitle]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Pre-fetch symbol SVGs
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const uniquePaths = new Set<string>();

    for (const node of nodes) {
      const c = catalog[node.componentId];
      const svgPath = c?.svgPath || `/symbols/${node.componentId}.svg`;
      uniquePaths.add(svgPath);
    }

    Promise.all(
      Array.from(uniquePaths).map(async (path) => {
        try {
          const res = await fetch(path);
          if (!res.ok) return [path, ""] as const;
          const text = await res.text();
          return [path, text] as const;
        } catch {
          return [path, ""] as const;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const newMap = new Map<string, string>();
      for (const [path, svgText] of results) {
        if (svgText) newMap.set(path, svgText);
      }
      setSymbolSvgMap(newMap);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, nodes]);

  // Generate Cad SVG Output (Pure Monochrome CAD Standard)
  const svgOutput = useMemo(() => {
    if (!isOpen) return "";
    const options: CadExportOptions = {
      paperSize,
      orientation,
      theme: "monochrome",
      projectTitle: title,
      author,
      organization,
      revision,
      date,
    };
    return CadSvgGenerator.generateSvg(nodes, wires, options, symbolSvgMap);
  }, [isOpen, nodes, wires, paperSize, orientation, title, author, organization, revision, date, symbolSvgMap]);

  if (!isOpen) return null;

  const baseFileName = (title || "circuit").toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  // Download Standalone SVG
  const handleDownloadSvg = () => {
    const blob = new Blob([svgOutput], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseFileName}_cad_${paperSize.toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy SVG to Clipboard
  const handleCopySvg = () => {
    navigator.clipboard.writeText(svgOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print / Save as PDF
  const handlePrintPdf = () => {
    const iframe = printFrameRef.current;
    if (!iframe) return;

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc) return;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - CAD Blueprint</title>
  <style>
    @page {
      size: ${paperSize.toLowerCase()} ${orientation};
      margin: 0;
    }
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .print-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${svgOutput}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();
  };

  // Download PNG
  const handleDownloadPng = () => {
    const img = new Image();
    const svgBlob = new Blob([svgOutput], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = `${baseFileName}_cad_${paperSize.toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 duration-200 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl duration-200 animate-in zoom-in-95 overflow-hidden dark:border-zinc-800 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50"
      >
        {/* shadcn DialogHeader */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t.title}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[280px] sm:max-w-md">
                {title || "RelayFlow Circuit"} • {paperSize} {orientation} • CAD Monochrome
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area: Left Settings + Right Blueprint Preview */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Configuration Panel (shadcn Form styling) */}
          <div className="w-full md:w-[320px] lg:w-[340px] shrink-0 p-5 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto space-y-5">
            {/* 1. Paper Size & Orientation */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{t.paperSize} & {t.orientation}</span>
              </label>

              {/* Size Segmented Control (shadcn TabsList) */}
              <div className="grid grid-cols-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs font-medium border border-zinc-200/60 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setPaperSize("A4")}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    paperSize === "A4"
                      ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold"
                      : "hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  A4 (297×210)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize("A3")}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    paperSize === "A3"
                      ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold"
                      : "hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  A3 (420×297)
                </button>
              </div>

              {/* Orientation Segmented Control (shadcn TabsList) */}
              <div className="grid grid-cols-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs font-medium border border-zinc-200/60 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    orientation === "landscape"
                      ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold"
                      : "hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.landscape}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    orientation === "portrait"
                      ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold"
                      : "hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.portrait}
                </button>
              </div>
            </div>

            {/* 2. Title Block Metadata Form (shadcn Input & Label) */}
            <div className="space-y-3 pt-1 border-t border-zinc-100 dark:border-zinc-900">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>{t.titleBlock} (ISO 7200)</span>
              </label>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {t.projectTitle}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:text-zinc-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t.drafter}
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:text-zinc-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t.revision}
                    </label>
                    <input
                      type="text"
                      value={revision}
                      onChange={(e) => setRevision(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:text-zinc-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t.organization}
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:text-zinc-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t.date}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:text-zinc-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Blueprint Sheet Preview */}
          <div className="flex-1 min-w-0 p-5 bg-zinc-50 dark:bg-zinc-900/40 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-3 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5" />
                <span>{t.preview}</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 uppercase">
                {paperSize} {orientation} • ISO 7200
              </span>
            </div>

            {/* Drawing Sheet Container with Soft Shadow */}
            <div className="w-full h-full max-h-[460px] flex items-center justify-center p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
              <div
                className="w-full h-full flex items-center justify-center bg-white shadow-md rounded-[2px] overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            </div>
          </div>
        </div>

        {/* shadcn DialogFooter */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
          {/* Left Action: Copy SVG (shadcn Button variant="outline") */}
          <button
            type="button"
            onClick={handleCopySvg}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? t.copied : t.copySvg}</span>
          </button>

          {/* Right Actions: PNG, Print/PDF, SVG */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-900 shadow-xs hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.downloadPdf}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 shadow-xs hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.downloadSvg}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden print iframe for razor-sharp vector PDF rendering */}
      <iframe ref={printFrameRef} className="hidden w-0 h-0 border-0" title="CAD Print Engine" />
    </div>
  );
};
