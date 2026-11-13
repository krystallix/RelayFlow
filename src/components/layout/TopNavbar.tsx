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
  Grid2x2,
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
  Languages,
  Share2,
  GitFork,
  LogIn,
  LogOut,
  User,
  Cloud,
  CloudUpload,
  Loader2,
  Save,
  Cpu,
} from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProjectsService, CloudProjectRecord } from "@/lib/projectsService";
import { AuthModal } from "@/components/modals/AuthModal";
import { ProjectsModal } from "@/components/modals/ProjectsModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { getTranslation } from "@/i18n/translations";
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

const CloudCheckIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path
      d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 4.5 4.5c0 .35-.04.7-.12 1.03"
      stroke="currentColor"
    />
    <polyline
      points="14 16.5 17 19.5 22 13.5"
      className="text-emerald-500 stroke-[2.8]"
      stroke="currentColor"
    />
  </svg>
);

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

  // Cloud & Auth Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCustomMessage, setAuthCustomMessage] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<"share" | "fork" | "save" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetProject, setShareTargetProject] = useState<{ id: string; title: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { user, signOut } = useAuthStore();

  const {
    projectTitle,
    fileFormat,
    isSimulating,
    wireRoutingMode,
    theme,
    locale,
    showGrid,
    showWireLabels,
    toggleWireLabels,
    renumberWires,
    undoStack,
    redoStack,
    setProjectTitle,
    setWireRoutingMode,
    toggleTheme,
    toggleLocale,
    toggleGrid,
    pageViewEnabled,
    togglePageView,
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
    currentProjectId,
    isCloudSynced,
    isReadOnlyViewer,
    isHardwareSheetOpen,
    toggleHardwareSheet,
    setIsHardwareSheetOpen,
    setCloudProjectId,
    setIsCloudSynced,
    setIsReadOnlyViewer,
  } = useCircuitStore();

  const isDark = theme === "dark";
  const isMac = useIsMac();
  const modKey = useModifierKey();
  const t = getTranslation(locale);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveErrorCooldownRef = useRef(false);

  // Reset save error cooldown whenever the circuit actually changes
  useEffect(() => {
    saveErrorCooldownRef.current = false;
  }, [nodes, wires, projectTitle]);

  const handleSaveProject = async (silent = false) => {
    if (isReadOnlyViewer) return;

    if (!user) {
      if (!silent) {
        setAuthCustomMessage(t.auth.loginSubtitle || "Log in to save your projects and share them with others");
        setPendingAction("save");
        setShowAuthModal(true);
      }
      return;
    }

    const storeState = useCircuitStore.getState();
    const effectiveProjectId = storeState.currentProjectId;
    const effectiveTitle = storeState.projectTitle;
    const effectiveNodes = storeState.nodes;
    const effectiveWires = storeState.wires;

    try {
      setIsSaving(true);
      const record = await ProjectsService.saveProject(
        user.id,
        effectiveTitle,
        effectiveNodes,
        effectiveWires,
        effectiveProjectId
      );
      setCloudProjectId(record.id);
      setIsCloudSynced(true);
      setIsSaving(false);
      setJustSaved(true);
      saveErrorCooldownRef.current = false;
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e: any) {
      setIsSaving(false);
      saveErrorCooldownRef.current = true;
      console.error("Save error:", e);
      if (!silent) {
        alert("Failed to save project: " + (e?.message || "Unknown error"));
      }
    }
  };

  // Autosave to cloud every 3 seconds after changes (debounced with error cooldown)
  useEffect(() => {
    if (!user || isReadOnlyViewer || isCloudSynced || isSaving || saveErrorCooldownRef.current) return;

    const timer = setTimeout(() => {
      handleSaveProject(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, isReadOnlyViewer, isCloudSynced, isSaving, nodes, wires, projectTitle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveProject();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, projectTitle, nodes, wires, currentProjectId, isReadOnlyViewer]);

  const handleOpenShare = async () => {
    if (!user) {
      setAuthCustomMessage(t.auth.loginToFork || "Please sign in to save and generate a share link.");
      setPendingAction("share");
      setShowAuthModal(true);
      return;
    }

    const storeState = useCircuitStore.getState();
    const effectiveProjectId = storeState.currentProjectId;
    const effectiveTitle = storeState.projectTitle;
    const effectiveNodes = storeState.nodes;
    const effectiveWires = storeState.wires;

    if (!effectiveProjectId) {
      try {
        const record = await ProjectsService.saveProject(
          user.id,
          effectiveTitle,
          effectiveNodes,
          effectiveWires,
          null
        );
        setCloudProjectId(record.id);
        setIsCloudSynced(true);
        setShareTargetProject({ id: record.id, title: record.title });
        setShowShareModal(true);
      } catch (e) {
        console.error("Save error:", e);
      }
    } else {
      setShareTargetProject({ id: effectiveProjectId, title: effectiveTitle });
      setShowShareModal(true);
    }
  };

  const handleForkToEdit = () => {
    if (!user) {
      setAuthCustomMessage(t.auth.loginToFork);
      setPendingAction("fork");
      setShowAuthModal(true);
      return;
    }
    setCloudProjectId(null);
    setIsCloudSynced(false);
    setIsReadOnlyViewer(false);
    setProjectTitle(`${projectTitle} (Fork)`);
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/c/")) {
      window.history.pushState({}, "", "/");
    }
  };

  const handleAuthSuccess = async () => {
    const currentUser = useAuthStore.getState().user;
    const storeState = useCircuitStore.getState();
    const effectiveProjectId = storeState.currentProjectId;
    const effectiveTitle = storeState.projectTitle;
    const effectiveNodes = storeState.nodes;
    const effectiveWires = storeState.wires;

    if (pendingAction === "save" && currentUser) {
      try {
        setIsSaving(true);
        const record = await ProjectsService.saveProject(
          currentUser.id,
          effectiveTitle,
          effectiveNodes,
          effectiveWires,
          effectiveProjectId
        );
        setCloudProjectId(record.id);
        setIsCloudSynced(true);
        setIsSaving(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
      } catch (e: any) {
        setIsSaving(false);
        console.error("Auth success save error:", e);
      }
    } else if (pendingAction === "share" && currentUser) {
      try {
        const record = await ProjectsService.saveProject(
          currentUser.id,
          effectiveTitle,
          effectiveNodes,
          effectiveWires,
          effectiveProjectId
        );
        setCloudProjectId(record.id);
        setIsCloudSynced(true);
        setShareTargetProject({ id: record.id, title: record.title });
        setShowShareModal(true);
      } catch (e) {
        console.error("Auth success save error:", e);
      }
    } else if (pendingAction === "fork") {
      setCloudProjectId(null);
      setIsCloudSynced(false);
      setIsReadOnlyViewer(false);
      setProjectTitle(`${effectiveTitle} (Fork)`);
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/c/")) {
        window.history.pushState({}, "", "/");
      }
    }
    setPendingAction(null);
  };

  const handleOpenCloudProject = (proj: CloudProjectRecord) => {
    if (proj.data?.nodes && proj.data?.wires) {
      loadProject({
        format: "relayflow",
        version: "1.0.0",
        metadata: {
          id: proj.id,
          title: proj.title,
          createdAt: proj.created_at,
          updatedAt: proj.updated_at,
        } as any,
        settings: { gridSize: 30, wireRouting: "orthogonal", theme },
        nodes: proj.data.nodes,
        wires: proj.data.wires,
      });
      setCloudProjectId(proj.id);
      setIsCloudSynced(true);
      setIsReadOnlyViewer(false);
    }
  };

  const handleShareFromProjects = (proj: CloudProjectRecord) => {
    setShareTargetProject({ id: proj.id, title: proj.title });
    setShowShareModal(true);
  };

  const handleNewBlankProject = () => {
    resetCanvas();
    setCloudProjectId(null);
    setIsCloudSynced(false);
    setIsReadOnlyViewer(false);
  };

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
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold">
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
              <span>{t.navbar.file}</span>
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
                    <span>{t.navbar.newProject}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{modKey}+N</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu(null);
                    handleSaveProject();
                  }}
                  disabled={isReadOnlyViewer}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CloudUpload className="w-4 h-4 text-emerald-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span>{t.navbar.saveProject}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{modKey}+S</span>
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
                    <span>{t.navbar.openProject}</span>
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
                  <span>{t.navbar.loadDolExample}</span>
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
                    <span>{t.navbar.saveRflow}</span>
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
                    <span>{t.navbar.exportSmrl}</span>
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
                    <span>{t.navbar.exportBom}</span>
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
              <span>{t.navbar.edit}</span>
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
                    <span>{t.navbar.undoAction}</span>
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
                    <span>{t.navbar.redoAction}</span>
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
                    <span>{t.navbar.duplicateSelection}</span>
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
                    <span className="font-medium">{t.navbar.autoLayout}</span>
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
                  <span>{t.navbar.selectAll}</span>
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
                    <span>{t.navbar.deleteSelection}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Del</span>
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={() => { renumberWires(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                  title="Renumber all wire nets sequentially (1, 2, 3...) from top to bottom"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold opacity-70">#</span>
                    <span>{t.navbar.renumberWires}</span>
                  </div>
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
              <span>{t.navbar.view}</span>
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
                    <span>{t.common.theme}: {isDark ? t.common.darkMode : t.common.lightMode}</span>
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
                    <span>{t.navbar.dottedGrid}</span>
                  </div>
                  {showGrid && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                </button>

                <button
                  onClick={() => { togglePageView(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                  title="Toggle Draw.io-style A4 Page Sheets"
                >
                  <div className="flex items-center gap-2">
                    <Grid2x2 className="w-4 h-4 text-zinc-400" />
                    <span>{t.navbar.pageView}</span>
                  </div>
                  {pageViewEnabled && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                </button>

                <button
                  onClick={() => { toggleWireLabels(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                  title="Toggle CAD Wire Number Badges (1, 2, 3...)"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold opacity-70">#</span>
                    <span>{t.navbar.wireNumbers}</span>
                  </div>
                  {showWireLabels && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                </button>

                <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <button
                  onClick={() => { onResetZoom(); setActiveMenu(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>{t.navbar.resetZoom}</span>
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
              <span>{t.navbar.help}</span>
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
                  <span>{t.navbar.keyboardShortcuts}</span>
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
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs shadow-xs transition-colors ${
            isDark
              ? "bg-[#131620] border-white/10 hover:border-white/20 focus-within:border-white/30 text-zinc-200"
              : "bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-400 text-slate-800"
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            disabled={isReadOnlyViewer}
            className="bg-transparent border-none focus:outline-none w-28 sm:w-36 font-semibold truncate disabled:opacity-80 disabled:cursor-not-allowed"
            title={isReadOnlyViewer ? "Circuit Title (Read-Only)" : "Click to rename project"}
          />
          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
            isDark ? "bg-white/10 text-zinc-300" : "bg-slate-100 text-slate-700"
          }`}>
            .{fileFormat}
          </span>
        </div>
      </div>

      {/* Right Controls: Zoom, Language, Theme, Cloud Autosave Indicator, Share & Export, and Login */}
      <div className="hidden md:flex items-center gap-2">
        {/* 1. Zoom Controls (Border Group) */}
        <div
          className={`flex items-center rounded-lg border shadow-xs text-xs font-mono overflow-hidden transition-colors ${
            isDark
              ? "bg-[#131620] border-white/10 text-zinc-200"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          <button
            onClick={onZoomOut}
            className={`p-1.5 transition-colors cursor-pointer ${
              isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className={`px-2 py-1 font-medium cursor-pointer transition-colors ${
              isDark
                ? "text-zinc-200 hover:text-white hover:bg-white/5"
                : "text-slate-800 hover:text-slate-900 hover:bg-slate-50"
            }`}
            title="Reset Zoom"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className={`p-1.5 transition-colors cursor-pointer ${
              isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Language Switcher (Icon-Only, Borderless, Shadowless) */}
        <button
          onClick={toggleLocale}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200 hover:text-white"
              : "bg-white hover:bg-slate-100 text-slate-800"
          }`}
          title={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
        >
          <Languages className="w-4 h-4" />
        </button>

        {/* 3. Theme Toggle (Icon-Only, Borderless, Shadowless) */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200 hover:text-white"
              : "bg-white hover:bg-slate-100 text-slate-800"
          }`}
          title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Hardware Inspector & BOM Side Sheet Toggle Button */}
        <button
          onClick={toggleHardwareSheet}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isHardwareSheetOpen
              ? isDark
                ? "bg-white text-black"
                : "bg-slate-900 text-white"
              : isDark
              ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200 hover:text-white"
              : "bg-white hover:bg-slate-100 text-slate-800"
          }`}
          title={locale === "id" ? "Inspeksi Perangkat & BOM" : "Hardware Inspector & BOM"}
        >
          <Cpu className="w-4 h-4" />
        </button>

        {/* 4. Cloud Autosave & Sync Indicator Button (Icon-Only, Borderless, Shadowless) */}
        {!isReadOnlyViewer && (
          <button
            onClick={() => handleSaveProject(false)}
            disabled={isSaving}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              isDark
                ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200 hover:text-white"
                : "bg-white hover:bg-slate-100 text-slate-800"
            }`}
            title={
              !user
                ? t.auth.loginSubtitle || "Sign in to sync with Cloud"
                : isSaving
                ? "Saving to Cloud..."
                : isCloudSynced
                ? "Cloud Synced (All changes saved)"
                : `Unsaved changes • Click to save now (${modKey}+S)`
            }
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : isCloudSynced ? (
              <CloudCheckIcon className="w-4 h-4" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
          </button>
        )}

        {/* 5. Unified Share & Export Popover (Icon-Only Solid Button, Borderless, Shadowless) */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setExportMenuOpen((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              exportMenuOpen
                ? isDark
                  ? "bg-[#1c202e] text-white"
                  : "bg-slate-100 text-slate-900"
                : isDark
                ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200 hover:text-white"
                : "bg-white hover:bg-slate-100 text-slate-800"
            }`}
            title="Share & Export"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {exportMenuOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-56 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 select-none ${
                isDark
                  ? "bg-[#131620] border-white/15 text-zinc-200 shadow-black/80"
                  : "bg-white border-slate-300 text-slate-800 shadow-slate-900/15"
              }`}
            >
              {/* Save Project Option */}
              {!isReadOnlyViewer && (
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleSaveProject();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${
                    isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CloudUpload className="w-4 h-4 text-emerald-400" />
                    <span>{t.navbar.saveProject}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {modKey}+S
                  </span>
                </button>
              )}

              {/* Share Circuit Link Option */}
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  handleOpenShare();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${
                  isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>{t.share.title}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Link
                </span>
              </button>

              <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

              {/* Export .rflow */}
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  handleExportRflow();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                  isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>{t.navbar.saveRflow}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10">
                  .rflow
                </span>
              </button>

              {/* Export .smrl */}
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  handleExportSmrl();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                  isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>{t.navbar.exportSmrl}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10">
                  .smrl
                </span>
              </button>

              {/* Export BOM */}
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  handleExportBom();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                  isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <span>{t.navbar.exportBom}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10">
                  BOM
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 6. My Projects (Icon-Only Solid Button, Borderless, Shadowless) */}
        {user && (
          <button
            onClick={() => setShowProjectsModal(true)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200 hover:text-white"
                : "bg-white hover:bg-slate-100 text-slate-800"
            }`}
            title={t.cloudNavbar.myProjects}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}

        {/* 7. Fork to Edit (Icon-Only Solid Button, Borderless, Shadowless, if in Viewer Mode) */}
        {isReadOnlyViewer && (
          <button
            onClick={handleForkToEdit}
            className="p-2 rounded-xl transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer"
            title={t.cloudNavbar.forkToEdit}
          >
            <GitFork className="w-4 h-4" />
          </button>
        )}

        {/* Viewer Mode Pill (if in Viewer Mode) */}
        {isReadOnlyViewer && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-medium bg-[#0b1c2e] text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>{t.cloudNavbar.viewerMode}</span>
          </div>
        )}

        {/* 8. Login / User Profile (Borderless, Shadowless, Paling Kanan) */}
        {!user ? (
          <button
            onClick={() => {
              setAuthCustomMessage(undefined);
              setPendingAction(null);
              setShowAuthModal(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
            title={t.cloudNavbar.login}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.auth.signIn}</span>
          </button>
        ) : (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className={`p-1 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-[#131620] hover:bg-[#1c202e] text-zinc-200"
                  : "bg-white hover:bg-slate-100 text-slate-800"
              }`}
              title={user.email || "Account"}
            >
              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.email ? user.email[0] : "U"}
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400 pr-0.5" />
            </button>

            {userMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-52 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 select-none ${
                  isDark
                    ? "bg-[#131620] border-white/15 text-zinc-200 shadow-black/80"
                    : "bg-white border-slate-300 text-slate-800 shadow-slate-900/15"
                }`}
              >
                <div className="px-3 py-2 border-b border-white/10 text-[11px]">
                  <div className="font-semibold text-zinc-200 truncate">{user.user_metadata?.full_name || "Account"}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                </div>

                <button
                  onClick={() => {
                    setShowProjectsModal(true);
                    setUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors ${
                    isDark ? "hover:bg-white/10 text-zinc-200" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t.cloudNavbar.myProjects}</span>
                </button>

                <button
                  onClick={() => {
                    signOut();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.cloudNavbar.logout}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE COMPACT HEADER (Visible only on screens < md) */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Left: Brand + Project Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold shrink-0">
            <Zap className="w-4 h-4 fill-current text-zinc-300" />
          </div>
          <div
            className={`min-w-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs shadow-xs transition-colors ${
              isDark
                ? "bg-[#131620] border-white/10 hover:border-white/20 focus-within:border-white/30 text-zinc-200"
                : "bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-400 text-slate-800"
            }`}
          >
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
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isDark 
                  ? "bg-red-600/90 hover:bg-red-500 text-white" 
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              title="Stop Simulation"
            >
              <Square className="w-3.5 h-3.5 fill-current text-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold cursor-pointer"
              title="Run Simulation"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
          )}

          {/* Mobile Hardware Inspector Button */}
          <button
            onClick={toggleHardwareSheet}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isHardwareSheetOpen
                ? isDark ? "bg-white text-black" : "bg-slate-900 text-white"
                : isDark
                ? "bg-[#151922] text-zinc-300"
                : "bg-slate-100 text-slate-700"
            }`}
            title="Toggle Hardware Inspector & BOM"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Mobile Add Component Palette Button */}
          <button
            onClick={onTogglePalette}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isPaletteOpen
                ? isDark ? "bg-white text-black" : "bg-slate-900 text-white"
                : isDark
                ? "bg-[#151922] text-zinc-300"
                : "bg-slate-100 text-slate-700"
            }`}
            title="Toggle Components Palette"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? "bg-[#151922] text-zinc-300"
                : "bg-slate-100 text-slate-700"
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
                    className="col-span-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black font-bold text-xs"
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
                    <span>{t.navbar.autoLayout}</span>
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
                    <span>{t.navbar.undoAction}</span>
                  </button>
                  <button
                    onClick={() => redo()}
                    disabled={redoStack.length === 0}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs disabled:opacity-40 ${
                      isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>{t.navbar.redoAction}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cloud & Sharing Mobile Section */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Cloud & Sharing</div>
              <div className="space-y-1.5 text-xs">
                {isReadOnlyViewer ? (
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleForkToEdit(); }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl font-bold bg-blue-600 text-white"
                  >
                    <GitFork className="w-4 h-4" />
                    <span>{t.cloudNavbar.forkToEdit}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleSaveProject(); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-xl border ${
                        justSaved
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : isDark
                          ? "bg-white/5 border-white/10 text-zinc-200"
                          : "bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      ) : justSaved ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <CloudUpload className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>
                        {isSaving
                          ? "Saving..."
                          : justSaved
                          ? "Saved to Cloud!"
                          : t.navbar.saveProject || "Save Project"}
                      </span>
                    </button>

                    <button
                      onClick={() => { setMobileMenuOpen(false); handleOpenShare(); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-xl border ${
                        isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      <Share2 className="w-4 h-4 text-blue-400" />
                      <span>{t.share.title}</span>
                    </button>

                    {!user ? (
                      <button
                        onClick={() => { setMobileMenuOpen(false); setAuthCustomMessage(undefined); setShowAuthModal(true); }}
                        className={`w-full flex items-center gap-2 p-2 rounded-xl border font-semibold ${
                          isDark ? "bg-white/10 border-white/15" : "bg-slate-900 text-white border-slate-900"
                        }`}
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{t.cloudNavbar.login}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => { setMobileMenuOpen(false); setShowProjectsModal(true); }}
                          className={`w-full flex items-center gap-2 p-2 rounded-xl border ${
                            isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                          }`}
                        >
                          <FolderOpen className="w-4 h-4 text-zinc-400" />
                          <span>{t.cloudNavbar.myProjects}</span>
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); signOut(); }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-red-400 border border-red-500/20 bg-red-500/5"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t.cloudNavbar.logout} ({user.email?.split("@")[0]})</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* File Operations */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">{t.navbar.file}</div>
              <div className="space-y-1 text-xs">
                <button
                  onClick={handleNewCircuit}
                  className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <FilePlus className="w-4 h-4 text-zinc-400" />
                  <span>{t.navbar.newProject}</span>
                </button>
                <button
                  onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-zinc-400" />
                  <span>{t.navbar.openProject}</span>
                </button>
                <button
                  onClick={() => { loadDolExample(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                  <span>{t.navbar.loadDolExample}</span>
                </button>
                <button
                  onClick={() => { handleExportRflow(); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-zinc-400" />
                    <span>{t.navbar.saveRflow}</span>
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
                    <span>{t.navbar.exportSmrl}</span>
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
                    <span>{t.navbar.exportBom}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">Parts List</span>
                </button>
              </div>
            </div>

            {/* View & Appearance Settings */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">{t.navbar.view}</div>
              <div className="space-y-1.5 text-xs">
                {/* Language Switcher Mobile */}
                <button
                  onClick={() => toggleLocale()}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-zinc-300" />
                    <span>{t.common.language}</span>
                  </div>
                  <span className="font-semibold uppercase">{locale}</span>
                </button>
                <button
                  onClick={() => toggleTheme()}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
                    <span>{t.common.theme}</span>
                  </div>
                  <span className="font-semibold">{isDark ? t.common.darkMode : t.common.lightMode}</span>
                </button>
                <button
                  onClick={() => toggleGrid()}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-zinc-400" />
                    <span>{t.navbar.dottedGrid}</span>
                  </div>
                  {showGrid ? <Check className="w-4 h-4 text-zinc-200" /> : <span className="text-zinc-500">Off</span>}
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
                <span>{t.navbar.keyboardShortcuts}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud & Auth Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        customMessage={authCustomMessage}
        onSuccess={handleAuthSuccess}
      />

      <ProjectsModal
        isOpen={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        onOpenProject={handleOpenCloudProject}
        onShareProject={handleShareFromProjects}
        onNewProject={handleNewBlankProject}
      />

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          projectId={shareTargetProject?.id || currentProjectId || "demo"}
          projectTitle={shareTargetProject?.title || projectTitle}
        />
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
