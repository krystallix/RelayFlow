"use client";

import React, { useState } from "react";
import { Search, ChevronDown, ChevronRight, Layers, Shield, Zap, ToggleLeft, Activity, Radio, Cpu, Clock } from "lucide-react";
import catalogData from "@/constants/components-catalog.json";
import { useCircuitStore } from "@/store/useCircuitStore";

const catalog = catalogData as Record<string, any>;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  protections: <Shield className="w-4 h-4 text-zinc-400" />,
  coils: <Zap className="w-4 h-4 text-zinc-400" />,
  contacts: <ToggleLeft className="w-4 h-4 text-zinc-400" />,
  switches: <Activity className="w-4 h-4 text-zinc-400" />,
  sources: <Radio className="w-4 h-4 text-zinc-400" />,
  loads: <Cpu className="w-4 h-4 text-zinc-400" />,
  general: <Layers className="w-4 h-4 text-zinc-400" />,
};

interface NodePaletteProps {
  zoomScale?: number;
  panOffset?: { x: number; y: number };
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  zoomScale = 1,
  panOffset = { x: 0, y: 0 },
}) => {
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const addNode = useCircuitStore((state) => state.addNode);
  const theme = useCircuitStore((state) => state.theme);
  const recentComponentIds = useCircuitStore((state) => state.recentComponentIds);
  const isDark = theme === "dark";

  // Group components by category
  const categorized: Record<string, any[]> = {};
  for (const [id, comp] of Object.entries(catalog)) {
    // Basic filter
    if (search) {
      const q = search.toLowerCase();
      if (!comp.name.toLowerCase().includes(q) && !id.toLowerCase().includes(q)) {
        continue;
      }
    }

    const cat = comp.category || "general";
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
  };

  return (
    <aside
      className={`w-64 border-r flex flex-col z-20 select-none h-[calc(100vh-3.5rem)] transition-colors duration-150 ${
        isDark
          ? "border-white/10 bg-[#0c0e14]/90 backdrop-blur-md text-white"
          : "border-slate-200 bg-white/95 backdrop-blur-md text-slate-800 shadow-sm"
      }`}
    >
      {/* Search Header */}
      <div className={`p-3 border-b ${isDark ? "border-white/10" : "border-slate-200"}`}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 border transition-colors ${
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
              className={`w-full px-3 py-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider transition-colors ${
                isDark
                  ? "text-zinc-300 hover:text-white hover:bg-white/5"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>Recent Symbols</span>
                <span className="text-[10px] text-zinc-500 font-mono font-normal">
                  ({recentComponentIds.filter((id) => catalog[id]).length})
                </span>
              </div>
              {collapsedCategories["__recent__"] ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {!collapsedCategories["__recent__"] && (
              <div className="p-1.5 grid grid-cols-2 gap-1.5">
                {recentComponentIds
                  .map((id) => catalog[id])
                  .filter(Boolean)
                  .map((comp) => (
                    <div
                      key={`recent-${comp.id}`}
                      onClick={() => handleAdd(comp)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("componentId", comp.id);
                      }}
                      className={`group p-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                        isDark
                          ? "hover:bg-white/10 border border-transparent hover:border-white/10"
                          : "hover:bg-slate-100 border border-transparent hover:border-slate-300"
                      }`}
                      title={comp.name}
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
                className={`w-full px-3 py-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isDark
                    ? "text-zinc-300 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  {icon}
                  <span>{category}</span>
                  <span className="text-[10px] text-zinc-500 font-mono font-normal">({items.length})</span>
                </div>
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {!isCollapsed && (
                <div className="p-1.5 grid grid-cols-2 gap-1.5">
                  {items.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => handleAdd(comp)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("componentId", comp.id);
                      }}
                      className={`group p-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center transition-all bg-transparent ${
                        isDark
                          ? "hover:bg-white/5 border border-transparent hover:border-white/10"
                          : "hover:bg-slate-100 border border-transparent hover:border-slate-200"
                      }`}
                      title={comp.description || comp.name}
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
                            ? "text-zinc-300 group-hover:text-amber-300"
                            : "text-slate-700 group-hover:text-amber-700"
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
  );
};
