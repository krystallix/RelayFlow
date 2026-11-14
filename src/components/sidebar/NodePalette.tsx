"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Shield,
  Zap,
  ToggleLeft,
  Activity,
  Radio,
  Cpu,
  Clock,
  X,
  SlidersHorizontal,
} from "lucide-react";
import catalogData from "@/constants/components-catalog.json";
import { COMPONENT_METADATA } from "@/constants/component-descriptions";
import { useCircuitStore } from "@/store/useCircuitStore";
import { getTranslation } from "@/i18n/translations";

const catalog = catalogData as Record<string, any>;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  protections: <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  coils: <Zap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  contacts: <ToggleLeft className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  auxiliaries: <ToggleLeft className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  switches: <Activity className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  sources: <Radio className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  loads: <Cpu className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  contactors: <Zap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  motors: <Cpu className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  panel: <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
  others: <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
};

interface NodePaletteProps {
  zoomScale?: number;
  panOffset?: { x: number; y: number };
  isOpen?: boolean;
  onClose?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  zoomScale = 1,
  panOffset = { x: 0, y: 0 },
  isOpen = true,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [hoveredComp, setHoveredComp] = useState<{ comp: any; rect: DOMRect } | null>(null);

  const addNode = useCircuitStore((state) => state.addNode);
  const theme = useCircuitStore((state) => state.theme);
  const locale = useCircuitStore((state) => state.locale);
  const recentComponentIds = useCircuitStore((state) => state.recentComponentIds);
  const isDark = theme === "dark";
  const t = getTranslation(locale).palette;

  // Group components by category (excluding internal junctionDot and dummy general symbols)
  const categorized: Record<string, any[]> = {};
  for (const [id, comp] of Object.entries(catalog)) {
    if (id === "junctionDot" || comp.category === "general") {
      continue;
    }

    const meta = COMPONENT_METADATA[id];
    const info = meta?.[locale] || meta?.id || meta;

    // Smart filter matching name, id, category, summary, and function description
    if (search) {
      const q = search.toLowerCase();
      const matchName = comp.name?.toLowerCase().includes(q) || info?.name?.toLowerCase().includes(q);
      const matchId = id.toLowerCase().includes(q);
      const matchDesc = info?.functionDesc?.toLowerCase().includes(q);
      const matchSummary = info?.summary?.toLowerCase().includes(q);
      const matchCategory = comp.category?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDesc && !matchSummary && !matchCategory) {
        continue;
      }
    }

    const cat = comp.category || "others";
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(comp);
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleAdd = (comp: any) => {
    const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
    const centerX = (-panOffset.x + screenW / 2) / zoomScale;
    const centerY = (-panOffset.y + screenH / 2) / zoomScale;
    addNode(comp.id, {
      x: Math.round(centerX / 30) * 30,
      y: Math.round(centerY / 30) * 30,
    });
    // On mobile screens, auto-close the palette after adding
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-20 w-[85vw] max-w-[320px] md:w-64 border-r flex flex-col select-none h-full md:h-[calc(100vh-3.5rem)] transition-all duration-300 ease-out shadow-2xl md:shadow-none ${
          isDark
            ? "border-white/10 bg-[#0c0e14]/98 md:bg-[#0c0e14]/90 backdrop-blur-xl text-white"
            : "border-slate-200 bg-white/98 md:bg-white/95 backdrop-blur-xl text-slate-800"
        } ${
          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full md:translate-x-0 md:hidden opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
        }`}
      >
        {/* Mobile Header Bar */}
        <div
          className={`p-3 border-b flex items-center justify-between md:hidden ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-300" />
            <span className="font-bold text-sm tracking-tight">{t.title}</span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark
                ? "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Header */}
        <div className={`p-3 border-b ${isDark ? "border-white/10" : "border-slate-200"}`}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 border transition-colors ${
                isDark
                  ? "bg-[#151922] border-white/10 text-zinc-200"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              }`}
            />
          </div>
        </div>

        {/* Component Groups List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Recent Symbols Group */}
          {!search && recentComponentIds && recentComponentIds.length > 0 && (
            <div
              className={`rounded-xl border overflow-hidden transition-colors ${
                isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <button
                onClick={() => toggleCategory("__recent__")}
                className={`w-full px-2.5 py-1.5 flex items-center gap-1.5 text-left text-[11px] font-medium transition-colors ${
                  isDark
                    ? "text-zinc-300 hover:text-white hover:bg-white/5"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {collapsedCategories["__recent__"] ? (
                  <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                )}
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{t.recentSymbols}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-normal shrink-0">
                  (
                  {
                    recentComponentIds.filter(
                      (id) => catalog[id] && id !== "junctionDot" && catalog[id].category !== "general"
                    ).length
                  }
                  )
                </span>
              </button>

              {!collapsedCategories["__recent__"] && (
                <div className="p-1.5 grid grid-cols-2 gap-1.5">
                  {recentComponentIds
                    .filter((id) => catalog[id] && id !== "junctionDot" && catalog[id].category !== "general")
                    .map((id) => catalog[id])
                    .map((comp) => (
                      <div
                        key={`recent-${comp.id}`}
                        onClick={() => handleAdd(comp)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredComp({ comp, rect });
                        }}
                        onMouseLeave={() => setHoveredComp(null)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("componentId", comp.id);
                        }}
                        className={`group p-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                          isDark
                            ? "hover:bg-white/10 border border-transparent hover:border-white/10"
                            : "hover:bg-slate-100 border border-transparent hover:border-slate-300"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center mb-1">
                          <img
                            src={comp.svgPath}
                            alt={comp.name}
                            className={`w-full h-full object-contain transition-transform group-hover:scale-105 ${
                              isDark ? "" : "filter invert"
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-medium leading-tight line-clamp-1">
                          {comp.name}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Categorized Groups */}
          {Object.entries(categorized).map(([category, items]) => {
            const isCollapsed = collapsedCategories[category];
            const icon = CATEGORY_ICONS[category] || <Layers className="w-4 h-4 text-zinc-400" />;

            return (
              <div
                key={category}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isDark ? "bg-transparent border-white/5" : "bg-transparent border-slate-200"
                }`}
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full px-2.5 py-1.5 flex items-center gap-1.5 text-left text-[11px] font-medium transition-colors ${
                    isDark
                      ? "text-zinc-300 hover:text-white hover:bg-white/5"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                  )}
                  {icon}
                  <span className="truncate">{(t.categories as Record<string, string>)[category] || category}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-normal shrink-0">
                    ({items.length})
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="p-1.5 grid grid-cols-2 gap-1.5">
                    {items.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => handleAdd(comp)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredComp({ comp, rect });
                        }}
                        onMouseLeave={() => setHoveredComp(null)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("componentId", comp.id);
                        }}
                        className={`group p-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center transition-all bg-transparent ${
                          isDark
                            ? "hover:bg-white/5 border border-transparent hover:border-white/10"
                            : "hover:bg-slate-100 border border-transparent hover:border-slate-200"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-1 rounded-md mb-1.5 bg-transparent">
                          <img
                            src={comp.svgPath}
                            alt={comp.name}
                            className={`w-full h-full object-contain transition-transform group-hover:scale-105 ${
                              isDark
                                ? "opacity-90 group-hover:opacity-100"
                                : "filter invert opacity-80 group-hover:opacity-100"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-medium truncate w-full transition-colors ${
                            isDark
                              ? "text-zinc-300 group-hover:text-white"
                              : "text-slate-700 group-hover:text-slate-900"
                          }`}
                        >
                          {comp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Floating Rich Popover Card on Symbol Hover */}
      {hoveredComp &&
        (() => {
          const { comp, rect } = hoveredComp;
          const meta = COMPONENT_METADATA[comp.id];
          const info = meta?.[locale] || meta?.id || meta;
          const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
          const screenH = typeof window !== "undefined" ? window.innerHeight : 800;

          // Position: render next to sidebar item
          const cardW = 300;
          let left = rect.right + 12;
          if (left + cardW > screenW - 12) {
            left = Math.max(12, rect.left - cardW - 12);
          }

          // Bound vertical position to viewport
          const cardEstimatedH = 320;
          let top = Math.max(16, Math.min(screenH - cardEstimatedH - 16, rect.top - 20));

          return (
            <div
              style={{
                position: "fixed",
                left: `${left}px`,
                top: `${top}px`,
                width: `${cardW}px`,
                zIndex: 9999,
              }}
              className={`pointer-events-none rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2.5 select-none transition-all ${
                isDark
                  ? "bg-[#0f1219]/95 border-zinc-800/90 text-zinc-100 shadow-black/80 ring-1 ring-white/10"
                  : "bg-white/98 border-zinc-200 text-zinc-900 shadow-zinc-950/15 ring-1 ring-black/5"
              }`}
            >
              {/* Card Header: Category Chip, IEC Badge & Thumbnail */}
              <div
                className={`flex items-start justify-between gap-2.5 pb-2.5 border-b ${
                  isDark ? "border-zinc-800" : "border-zinc-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {/* Category Monochrome Tag */}
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                        isDark
                          ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                          : "bg-zinc-100 text-zinc-700 border-zinc-300"
                      }`}
                    >
                      {(t.categories as Record<string, string>)[comp.category] || comp.category}
                    </span>

                    {/* IEC Prefix Tag */}
                    {meta?.tagPrefix && (
                      <span
                        className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                          isDark
                            ? "bg-zinc-900/90 text-zinc-400 border-zinc-800"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        IEC: {meta.tagPrefix}
                      </span>
                    )}
                  </div>

                  <h4
                    className={`font-bold text-xs tracking-tight leading-snug line-clamp-2 ${
                      isDark ? "text-zinc-100" : "text-zinc-900"
                    }`}
                  >
                    {info?.name || comp.name}
                  </h4>
                </div>

                {/* Monochrome Symbol Visual Thumbnail */}
                <div
                  className={`w-11 h-11 shrink-0 rounded-lg border flex items-center justify-center p-1.5 transition-colors ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800"
                      : "bg-zinc-50 border-zinc-200"
                  }`}
                >
                  <img
                    src={comp.svgPath}
                    alt={comp.name}
                    className={`w-full h-full object-contain ${
                      isDark ? "brightness-100" : "filter invert opacity-90"
                    }`}
                  />
                </div>
              </div>

              {/* Function & Description */}
              <div className="space-y-1 text-[11px] leading-relaxed">
                {info?.summary && (
                  <p
                    className={`font-semibold tracking-tight ${
                      isDark ? "text-zinc-200" : "text-zinc-800"
                    }`}
                  >
                    {info.summary}
                  </p>
                )}
                <p className={isDark ? "text-zinc-400" : "text-zinc-600"}>
                  {info?.functionDesc || comp.description || "Komponen rangkaian kontrol listrik."}
                </p>
              </div>

              {/* Real-world Application Box */}
              {info?.application && (
                <div
                  className={`p-2 rounded-lg text-[10.5px] leading-normal border ${
                    isDark
                      ? "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600"
                  }`}
                >
                  <span
                    className={`font-semibold font-mono text-[9.5px] uppercase tracking-wide mr-1.5 ${
                      isDark ? "text-zinc-300" : "text-zinc-800"
                    }`}
                  >
                    {t.popover.application}
                  </span>
                  <span>{info.application}</span>
                </div>
              )}

              {/* Ports / Terminals Badges */}
              {comp.nodes && comp.nodes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span
                    className={`text-[9.5px] font-mono uppercase tracking-wider font-medium ${
                      isDark ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {t.popover.terminals}
                  </span>
                  {comp.nodes
                    .filter((n: any) => n.tag)
                    .slice(0, 8)
                    .map((n: any, idx: number) => (
                      <span
                        key={idx}
                        className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border shadow-2xs ${
                          isDark
                            ? "bg-zinc-800/90 text-zinc-200 border-zinc-700"
                            : "bg-zinc-100 text-zinc-800 border-zinc-300"
                        }`}
                      >
                        {n.tag}
                      </span>
                    ))}
                </div>
              )}

              {/* Footer tip */}
              <div
                className={`text-[9px] font-mono text-center pt-2 border-t ${
                  isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-400"
                }`}
              >
                {t.popover.clickOrDrag}
              </div>
            </div>
          );
        })()}
    </>
  );
};
