"use client";

import React, { useState, useMemo } from "react";
import { useCircuitStore } from "@/store/useCircuitStore";
import {
  getCircuitComponentSummary,
  getDetailedHardwareList,
} from "@/utils/circuitSummary";
import {
  X,
  Copy,
  Check,
  Download,
  Search,
  Activity,
  FileSpreadsheet,
  Lightbulb,
} from "lucide-react";

interface HardwareSheetProps {
  onLocateNode?: (nodeId: string | number) => void;
}

export const HardwareSheet: React.FC<HardwareSheetProps> = React.memo(({ onLocateNode }) => {
  const nodes = useCircuitStore((s) => s.nodes);
  const isHardwareSheetOpen = useCircuitStore((s) => s.isHardwareSheetOpen);
  const setIsHardwareSheetOpen = useCircuitStore((s) => s.setIsHardwareSheetOpen);
  const projectTitle = useCircuitStore((s) => s.projectTitle);
  const locale = useCircuitStore((s) => s.locale);

  const [activeTab, setActiveTab] = useState<"telemetry" | "bom">("telemetry");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedBom, setCopiedBom] = useState(false);

  // Grouped Hardware Telemetry Items (only calculated when sheet is open to prevent idle background compute)
  const hardwareItems = useMemo(() => {
    if (!isHardwareSheetOpen) return [];
    return getDetailedHardwareList(nodes);
  }, [nodes, isHardwareSheetOpen]);

  // Concise Component Summary (Type : Total) (only calculated when sheet is open)
  const summaryItems = useMemo(() => {
    if (!isHardwareSheetOpen) return [];
    return getCircuitComponentSummary(nodes);
  }, [nodes, isHardwareSheetOpen]);

  // Filtered Hardware Items based on search
  const filteredHardware = useMemo(() => {
    if (!searchQuery.trim()) return hardwareItems;
    const q = searchQuery.toLowerCase();
    return hardwareItems.filter(
      (item) =>
        item.tag.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.comment && item.comment.toLowerCase().includes(q)) ||
        item.nodes.some(
          (n) =>
            (n.name || "").toLowerCase().includes(q) ||
            (n.comment && n.comment.toLowerCase().includes(q))
        )
    );
  }, [hardwareItems, searchQuery]);

  // Copy BOM as text
  const handleCopyBom = () => {
    const text = summaryItems.map(([type, total]) => `${type} : ${total}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBom(true);
    setTimeout(() => setCopiedBom(false), 2000);
  };

  // Export BOM as CSV
  const handleExportBomCsv = () => {
    const rows = [["Component Type", "Quantity"]];
    for (const [type, total] of summaryItems) {
      rows.push([type, String(total)]);
    }
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.map((x) => `"${x}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${(projectTitle || "circuit").toLowerCase().replace(/\s+/g, "_")}_BOM.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <aside
      aria-hidden={!isHardwareSheetOpen}
      className={`fixed top-14 bottom-0 right-0 z-40 w-full sm:w-[350px] md:w-[380px] flex flex-col bg-white text-zinc-950 border-l border-zinc-200 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none pointer-events-auto ${
        isHardwareSheetOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
    >
      {/* 1. Minimal Sheet Header (Title & Close Button only) */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
          {locale === "id" ? "Inspeksi Perangkat" : "Hardware Inspector"}
        </h2>

        <button
          onClick={() => setIsHardwareSheetOpen(false)}
          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. shadcn-style Tabs with Icons */}
      <div className="px-5 pt-3 pb-2 shrink-0">
        <div className="grid grid-cols-2 p-1 rounded-lg bg-zinc-100/80 text-zinc-600 text-xs font-medium">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "telemetry"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{locale === "id" ? "Telemetri" : "Telemetry"}</span>
          </button>

          <button
            onClick={() => setActiveTab("bom")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "bom"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{locale === "id" ? "Ringkasan BOM" : "BOM Summary"}</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "telemetry" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* shadcn Input Group with Icon & Tips Caption */}
          <div className="px-5 pt-2 pb-1 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder={locale === "id" ? "Cari tag, nama, atau komentar..." : "Search tag, name, or comment..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-md border border-zinc-200 bg-white pl-9 pr-8 text-xs text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-0.5 rounded text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tips caption below search input */}
            <div className="flex items-center justify-center gap-1.5 mt-2 px-0.5 text-[11px] text-zinc-400">
              <Lightbulb className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>
                {locale === "id"
                  ? "Klik komponen pada daftar untuk menujunya di kanvas"
                  : "Click any component to locate it on canvas"}
              </span>
            </div>
          </div>

          {/* Clean Borderless List with Hover & Direct Click-to-Locate */}
          <div className="flex-1 overflow-y-auto px-5 py-1">
            {filteredHardware.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                {locale === "id" ? "Tidak ada komponen" : "No devices found"}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredHardware.map((item) => {
                  const targetNode = item.nodes[0];
                  return (
                    <div
                      key={item.id}
                      onClick={() => targetNode && onLocateNode?.(targetNode.id)}
                      className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md text-xs hover:bg-zinc-50 cursor-pointer transition-colors"
                      title={targetNode ? (locale === "id" ? "Klik untuk menuju komponen di kanvas" : "Click to locate on canvas") : undefined}
                    >
                      {/* Left: Tag Badge, Component Type & Optional Comment */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-900 border border-zinc-200 group-hover:border-zinc-300 transition-colors shrink-0">
                          {item.tag}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="font-medium text-zinc-900 truncate">
                            {item.type}
                          </span>
                          {item.comment && (
                            <span className="text-[11px] text-zinc-400 truncate font-normal">
                              · {item.comment}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: ON/OFF State */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isEnergized !== undefined && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                              item.isEnergized
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {item.isEnergized ? "ON" : "OFF"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Bill of Materials (BOM) Tab */
        <div className="flex-1 flex flex-col min-h-0 px-5 py-3">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 shrink-0">
            <span className="text-xs text-zinc-500 font-mono">
              {summaryItems.length} categories
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyBom}
                className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Copy Summary"
              >
                {copiedBom ? <Check className="w-3.5 h-3.5 text-zinc-900" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBom ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleExportBomCsv}
                className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Borderless BOM List with Divider & Hover */}
          <div className="flex-1 overflow-y-auto text-xs">
            {summaryItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                {locale === "id" ? "Tidak ada komponen di kanvas" : "No components on canvas"}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {summaryItems.map(([type, total]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md hover:bg-zinc-50 transition-colors"
                  >
                    <span className="font-medium text-zinc-900 truncate">{type}</span>
                    <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                      <span className="text-zinc-400">:</span>
                      <strong className="text-zinc-950 font-bold">{total}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Card */}
          <div className="mt-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs flex items-center justify-between shrink-0">
            <span className="text-zinc-600 font-medium">Total Physical Devices</span>
            <strong className="font-mono text-zinc-950 font-bold">
              {summaryItems.reduce((acc, [, total]) => acc + total, 0)}
            </strong>
          </div>
        </div>
      )}
    </aside>
  );
});
