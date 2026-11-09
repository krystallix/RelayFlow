"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Square,
  RotateCcw,
  StepForward,
  Download,
  FolderOpen,
  FilePlus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  FileCode,
  Zap,
  Sun,
  Moon,
  HelpCircle,
  Grid,
  Check,
  ChevronDown,
  Trash2,
  Copy,
  Menu,
  X,
  Plus,
  SlidersHorizontal,
  Maximize2,
  Layers,
} from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { FileAdapter } from "@/engine/serializer/FileAdapter";
import { useIsMac, useModifierKey } from "@/utils/platform";

interface TopNavbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomScale: number;
  isPaletteOpen?: boolean;
  onTogglePalette?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoomScale,
  isPaletteOpen,
  onTogglePalette,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const {
    projectTitle,
    fileFormat,
    isSimulating,
    wireRoutingMode,
    theme,
    showGrid,
    undoStack,
    redoStack,
    setProjectTitle,
    setWireRoutingMode,
    toggleTheme,
    toggleGrid,
    startSimulation,
    stopSimulation,
    stepSimulation,
    undo,
    redo,
    loadProject,
    resetCanvas,
    autoLayout,
    selectAll,
    deleteSelection,
    duplicateSelection,
    nodes,
    wires,
  } = useCircuitStore();

  const isDark = theme === "dark";
  const isMac = useIsMac();
  const modKey = useModifierKey();

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const project = FileAdapter.parse(content, file.name);
        const format = file.name.endsWith(".smrl") ? "smrl" : "rflow";
        loadProject(project, format);
      } catch (err: any) {
        alert("Failed to load file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
    setActiveMenu(null);
  };

  const handleExportRflow = () => {
    const project = {
      format: "relayflow" as const,
      version: "1.0.0" as const,
      metadata: {
        title: projectTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: "RelayFlow Web",
      },
      settings: {
        gridSize: 30,
        wireRouting: wireRoutingMode,
        theme,
      },
      nodes,
      wires,
    };
    const jsonStr = FileAdapter.toRflow(project);
    downloadFile(jsonStr, `${projectTitle.toLowerCase().replace(/\s+/g, "_")}.rflow`, "application/json");
    setActiveMenu(null);
  };

  const handleExportSmrl = () => {
    const project = {
      format: "relayflow" as const,
      version: "1.0.0" as const,
      metadata: {
        title: projectTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      settings: {
        gridSize: 30,
        wireRouting: wireRoutingMode,
        theme,
      },
      nodes,
      wires,
    };
    const smrlStr = FileAdapter.toSmrl(project);
    downloadFile(smrlStr, `${projectTitle.toLowerCase().replace(/\s+/g, "_")}.smrl`, "application/json");
    setActiveMenu(null);
  };

  const handleNewCircuit = () => {
    if (confirm("Create a new blank circuit? Any unsaved changes will be lost.")) {
      resetCanvas();
      setProjectTitle("Untitled Circuit");
    }
    setActiveMenu(null);
  };

  const loadDolExample = async () => {
    try {
      const resp = await fetch("/examples/dol-starter.smrl");
      const text = await resp.text();
      const project = FileAdapter.parse(text, "DOL Starter Example.smrl");
      loadProject(project, "smrl");
    } catch (e: any) {
      alert("Failed to load example: " + e.message);
    }
    setActiveMenu(null);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBom = () => {
    // Generate Bill of Materials CSV
    const rows = [["Component", "Tag", "Category", "Comment", "Count"]];
    const summary: Record<string, { tag: string; category: string; comment: string; count: number }> = {};

    for (const node of nodes) {
      const key = `${node.name}_${node.tag || ""}`;
      if (!summary[key]) {
        summary[key] = {
          tag: node.tag || "-",
          category: node.category,
          comment: node.comment || "-",
          count: 0,
        };
      }
      summary[key].count += 1;
    }

    for (const [nameWithTag, info] of Object.entries(summary)) {
      const name = nameWithTag.split("_")[0];
      rows.push([name, info.tag, info.category, info.comment, String(info.count)]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${projectTitle.toLowerCase().replace(/\s+/g, "_")}_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <header
      className={`h-14 border-b px-4 flex items-center justify-between z-40 select-none transition-colors duration-150 ${
        isDark
          ? "border-white/10 bg-[#0c0e14]/95 text-white"
          : "border-slate-200 bg-white/95 text-slate-800 shadow-sm"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".rflow,.smrl,.json"
        className="hidden"
      />

      {/* Left: Branding, Nav Menu Popovers, Project Name (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        {/* Branding Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold shadow-sm">
            <Zap className="w-4 h-4 fill-current text-zinc-300" />
          </div>
          <span className={`font-bold tracking-tight text-base hidden sm:inline ${isDark ? "text-white" : "text-slate-900"}`}>
            RelayFlow
          </span>
        </div>

        <div className={`h-4 w-[1px] mx-1 ${isDark ? "bg-white/15" : "bg-slate-300"}`} />

        {/* Top-Left Menubar Popovers (File, Edit, View, Help) */}
        <nav ref={menuBarRef} className="flex items-center text-xs font-medium relative">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("file")}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeMenu === "file"
                  ? isDark ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900"
                  : isDark ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>File</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeMenu === "file" && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-56 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? "bg-[#161a23] border-white/15 text-zinc-200"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <button
                  onClick={handleNewCircuit}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <FilePlus className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 flex justify-between">
                    <span>New Circuit</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{modKey}+N</span>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 flex justify-between">
                    <span>Open File...</span>
                    <span className="text-[10px] text-zinc-400 font-mono">.rflow / .smrl</span>
                  </div>
                </button>

                <button
                  onClick={loadDolExample}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                  <span>Load DOL Starter Example</span>
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={handleExportRflow}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span>Save as .rflow</span>
                    <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1 py-0.5 rounded">Native</span>
                  </div>
                </button>

                <button
                  onClick={handleExportSmrl}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span>Export to .smrl</span>
                    <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1 py-0.5 rounded">Simurelay</span>
                  </div>
                </button>

                <button
                  onClick={handleExportBom}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span>Export BOM (CSV)</span>
                    <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1 py-0.5 rounded">Parts List</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("edit")}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeMenu === "edit"
                  ? isDark ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900"
                  : isDark ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>Edit</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeMenu === "edit" && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-52 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? "bg-[#161a23] border-white/15 text-zinc-200"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <button
                  onClick={() => { undo(); setActiveMenu(null); }}
                  disabled={undoStack.length === 0}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs disabled:opacity-40 transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{modKey}+Z</span>
                </button>

                <button
                  onClick={() => { redo(); setActiveMenu(null); }}
                  disabled={redoStack.length === 0}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs disabled:opacity-40 transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>Redo</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{modKey}+Y</span>
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={() => { duplicateSelection(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{modKey}+D</span>
                </button>

                <button
                  onClick={() => { autoLayout(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-medium">Auto Layout Circuit</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{isMac ? "⌥L" : "Alt+L"}</span>
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={() => { selectAll(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>Select All</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{modKey}+A</span>
                </button>

                <button
                  onClick={() => { deleteSelection(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs ${
                    isDark ? "text-zinc-300 hover:bg-white/10" : "text-slate-800 hover:bg-slate-100"
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Delete Selected</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Del</span>
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("view")}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeMenu === "view"
                  ? isDark ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900"
                  : isDark ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>View</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeMenu === "view" && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-56 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? "bg-[#161a23] border-white/15 text-zinc-200"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <button
                  onClick={() => { toggleTheme(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDark ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
                    <span>Theme: {isDark ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                </button>

                <button
                  onClick={() => { toggleGrid(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-zinc-400" />
                    <span>Dotted Grid</span>
                  </div>
                  {showGrid && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={() => { setWireRoutingMode("orthogonal"); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>90° Ortho Routing</span>
                  {wireRoutingMode === "orthogonal" && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                </button>

                <button
                  onClick={() => { setWireRoutingMode("bezier"); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>Curved Bezier Routing</span>
                  {wireRoutingMode === "bezier" && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={() => { onResetZoom(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>Reset Zoom (100%)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{modKey}+0</span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("help")}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeMenu === "help"
                  ? isDark ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900"
                  : isDark ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>Help</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {activeMenu === "help" && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-52 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? "bg-[#161a23] border-white/15 text-zinc-200"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <button
                  onClick={() => { setShowHelpModal(true); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-zinc-400" />
                  <span>Keyboard Shortcuts</span>
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <div className="px-3 py-1.5 text-[11px] text-zinc-400">
                  <div className="font-semibold text-zinc-200">RelayFlow v1.0.0</div>
                  <div className="text-[10px] text-zinc-500">Dual .rflow & .smrl engine</div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Project Name Pill */}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs border transition-colors ${
            isDark ? "bg-white/5 border-white/10 text-zinc-200" : "bg-slate-100 border-slate-200 text-slate-800"
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-transparent border-none focus:outline-none w-28 sm:w-40 font-medium truncate"
            title="Click to rename project"
          />
          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold border ${
            isDark ? "bg-white/10 text-zinc-300 border-white/10" : "bg-slate-200 text-slate-700 border-slate-300"
          }`}>
            .{fileFormat}
          </span>
        </div>
      </div>

      {/* Center: Simulation Controls (Desktop) */}
      <div className="hidden md:flex items-center gap-2">
        <div
          className={`flex items-center p-1 rounded-xl border shadow-inner transition-colors ${
            isDark ? "bg-[#151922] border-white/10" : "bg-slate-100 border-slate-200"
          }`}
        >
          {isSimulating ? (
            <button
              onClick={stopSimulation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isDark 
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600 shadow-sm" 
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
              }`}
              title="Stop Simulation"
            >
              <Square className="w-3.5 h-3.5 fill-current text-zinc-300" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all shadow-sm"
              title="Run Simulation"
            >
              <Play className="w-3.5 h-3.5 fill-current text-black" />
              <span>Simulate</span>
            </button>
          )}

          <button
            onClick={stepSimulation}
            disabled={!isSimulating}
            className={`p-1.5 rounded-lg transition-colors ml-1 disabled:opacity-30 ${
              isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Step Next Tick"
          >
            <StepForward className="w-4 h-4" />
          </button>

          <button
            onClick={stopSimulation}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Reset Circuit"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Auto Layout Button */}
        <button
          onClick={autoLayout}
          disabled={nodes.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            isDark
              ? "bg-[#151922] border-white/10 text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/5"
              : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-200"
          } disabled:opacity-40 disabled:pointer-events-none`}
          title="Auto Layout Circuit (Arrange into clean ladder diagram, Alt+L)"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Auto Layout</span>
        </button>

        {/* Wire Routing Mode Toggle (Fast Access) */}
        <div
          className={`hidden sm:flex items-center p-1 rounded-xl border text-xs ${
            isDark ? "bg-[#151922] border-white/10" : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            onClick={() => setWireRoutingMode("orthogonal")}
            className={`px-2 py-1 rounded-lg transition-colors font-medium ${
              wireRoutingMode === "orthogonal"
                ? isDark ? "bg-white/15 text-white" : "bg-white text-slate-900 shadow-sm"
                : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-slate-800"
            }`}
            title="Orthogonal 90-degree industrial routing"
          >
            90° Ortho
          </button>
          <button
            onClick={() => setWireRoutingMode("bezier")}
            className={`px-2 py-1 rounded-lg transition-colors font-medium ${
              wireRoutingMode === "bezier"
                ? isDark ? "bg-white/15 text-white" : "bg-white text-slate-900 shadow-sm"
                : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-slate-800"
            }`}
            title="Smooth Curved Bezier routing"
          >
            Curved
          </button>
        </div>
      </div>

      {/* Right: Theme Switcher, Zoom, and Quick Export */}
      <div className="hidden md:flex items-center gap-2">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? "bg-[#151922] border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
          }`}
          title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Zoom Controls */}
        <div
          className={`hidden md:flex items-center gap-1 p-1 rounded-xl border text-xs font-mono ${
            isDark ? "bg-[#151922] border-white/10" : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            onClick={onZoomOut}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetZoom}
            className={`px-1.5 py-0.5 font-medium ${isDark ? "text-zinc-300 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
            title="Reset to 100%"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Export Button */}
        <button
          onClick={handleExportRflow}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
            isDark
              ? "bg-white text-black hover:bg-zinc-200 border-white shadow-xs"
              : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
          }`}
          title="Quick export as .rflow"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* MOBILE COMPACT HEADER (Visible only on screens < md) */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Left: Brand + Project Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold shrink-0">
            <Zap className="w-4 h-4 fill-current text-zinc-300" />
          </div>
          <div className="min-w-0 flex items-center gap-1.5">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-24 text-xs font-bold truncate"
            />
            <span className={`font-mono text-[9px] px-1 py-0.2 rounded uppercase font-semibold shrink-0 border ${
              isDark ? "bg-white/10 text-zinc-300 border-white/10" : "bg-slate-200 text-slate-700 border-slate-300"
            }`}>
              .{fileFormat}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons on Mobile */}
        <div className="flex items-center gap-1.5">
          {/* Mobile Simulate Toggle Button */}
          {isSimulating ? (
            <button
              onClick={stopSimulation}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                isDark 
                  ? "bg-zinc-800 text-zinc-200 border-zinc-600" 
                  : "bg-slate-200 text-slate-800 border-slate-300"
              }`}
              title="Stop Simulation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold shadow-sm"
              title="Run Simulation"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
          )}

          {/* Mobile Add Component Palette Button */}
          <button
            onClick={onTogglePalette}
            className={`p-1.5 rounded-lg border transition-colors ${
              isPaletteOpen
                ? isDark ? "bg-white text-black border-white" : "bg-slate-900 text-white border-slate-900"
                : isDark
                ? "bg-[#151922] border-white/10 text-zinc-300"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
            title="Toggle Components Palette"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? "bg-[#151922] border-white/10 text-zinc-300"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE FULL DRAWER NAVIGATION PANEL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <div
            className={`relative ml-auto w-[85vw] max-w-sm h-full flex flex-col p-4 shadow-2xl overflow-y-auto transition-transform z-10 ${
              isDark ? "bg-[#0f121a] text-white border-l border-white/10" : "bg-white text-slate-900 border-l border-slate-200"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold">
                  <Zap className="w-3.5 h-3.5 fill-current text-zinc-300" />
                </div>
                <span className="font-bold text-sm tracking-tight">RelayFlow Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-1.5 rounded-lg border ${
                  isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-100"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulation Controls Section */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Simulation</div>
              <div className="grid grid-cols-3 gap-2">
                {isSimulating ? (
                  <button
                    onClick={() => { stopSimulation(); setMobileMenuOpen(false); }}
                    className={`col-span-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs border ${
                      isDark 
                        ? "bg-zinc-800 text-zinc-200 border-zinc-600" 
                        : "bg-slate-200 text-slate-800 border-slate-300"
                    }`}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { startSimulation(); setMobileMenuOpen(false); }}
                    className="col-span-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black font-bold text-xs shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate</span>
                  </button>
                )}
                <button
                  onClick={stepSimulation}
                  disabled={!isSimulating}
                  className={`flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold disabled:opacity-40 ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <StepForward className="w-3.5 h-3.5" />
                  <span>Step</span>
                </button>
                <button
                  onClick={() => { stopSimulation(); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Quick Actions (Auto layout, Undo, Redo) */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Circuit Actions</div>
              <div className="space-y-1.5">
                <button
                  onClick={() => { autoLayout(); setMobileMenuOpen(false); }}
                  disabled={nodes.length === 0}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold disabled:opacity-40 transition-colors ${
                    isDark
                      ? "bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10"
                      : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                    <span>Auto Layout Circuit</span>
                  </div>
                  <span className="text-[10px] opacity-70">Clean Ladder</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => undo()}
                    disabled={undoStack.length === 0}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs disabled:opacity-40 ${
                      isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={() => redo()}
                    disabled={redoStack.length === 0}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs disabled:opacity-40 ${
                      isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>Redo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* File Operations */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">File & Export</div>
              <div className="space-y-1 text-xs">
                <button
                  onClick={handleNewCircuit}
                  className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <FilePlus className="w-4 h-4 text-zinc-400" />
                  <span>New Blank Circuit</span>
                </button>
                <button
                  onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-zinc-400" />
                  <span>Open File (.rflow / .smrl)</span>
                </button>
                <button
                  onClick={() => { loadDolExample(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                  <span>Load DOL Starter Example</span>
                </button>
                <button
                  onClick={() => { handleExportRflow(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-zinc-400" />
                    <span>Save as .rflow</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">Native</span>
                </button>
                <button
                  onClick={() => { handleExportSmrl(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-zinc-400" />
                    <span>Export to .smrl</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">Simurelay</span>
                </button>
                <button
                  onClick={() => { handleExportBom(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4 text-zinc-400" />
                    <span>Export BOM (CSV)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">Parts List</span>
                </button>
              </div>
            </div>

            {/* View & Appearance Settings */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Display & Settings</div>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => toggleTheme()}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
                    <span>Theme</span>
                  </div>
                  <span className="font-semibold">{isDark ? "Dark Mode" : "Light Mode"}</span>
                </button>
                <button
                  onClick={() => toggleGrid()}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-zinc-400" />
                    <span>Dotted CAD Grid</span>
                  </div>
                  {showGrid ? <Check className="w-4 h-4 text-zinc-200" /> : <span className="text-zinc-500">Off</span>}
                </button>
                <button
                  onClick={() => setWireRoutingMode(wireRoutingMode === "orthogonal" ? "bezier" : "orthogonal")}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                    <span>Routing Mode</span>
                  </div>
                  <span className="font-semibold">{wireRoutingMode === "orthogonal" ? "90° Ortho" : "Curved"}</span>
                </button>
              </div>
            </div>

            {/* Help / Shortcuts Button */}
            <div className="mt-auto pt-3 border-t border-white/10">
              <button
                onClick={() => { setShowHelpModal(true); setMobileMenuOpen(false); }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold ${
                  isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                <span>Shortcuts & Help</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#131620] border-white/15 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-zinc-400" />
                <h3 className="font-bold text-sm">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Pan Canvas</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">Space + Drag / Mid Click</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Zoom In / Out</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">Mouse Wheel</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Rotate Selected Component</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[11px]">Popover / Toolbar</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Duplicate Selection</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{modKey} + D</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Delete Component / Wire</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">Delete / Backspace</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Undo / Redo</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{modKey}+Z / {modKey}+Y</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Auto Layout Circuit</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{isMac ? "⌥ + L" : "Alt + L"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Select All</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{modKey} + A</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-colors border ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200 border-white"
                    : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
