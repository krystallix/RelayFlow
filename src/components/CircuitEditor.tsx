"use client";

import React, { useState, useEffect } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { SubToolbar } from "@/components/layout/SubToolbar";
import { NodePalette } from "@/components/sidebar/NodePalette";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { HardwareSheet } from "@/components/layout/HardwareSheet";
import { PreferencesSheet } from "@/components/layout/PreferencesSheet";
import { SheetTabsBar } from "@/components/layout/SheetTabsBar";
import { ChangelogModal } from "@/components/modals/ChangelogModal";
import {
  hasSeenCurrentChangelog,
  markCurrentChangelogSeen,
} from "@/constants/changelog";
import { useCircuitStore } from "@/store/useCircuitStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProjectsService } from "@/lib/projectsService";
import { AlertTriangle, Plus, ArrowLeft } from "lucide-react";

interface CircuitEditorProps {
  viewerProjectId?: string;
}

export const CircuitEditor: React.FC<CircuitEditorProps> = ({ viewerProjectId }) => {
  const [zoomScale, setZoomScale] = useState(0.85);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 15 });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [loadingViewerProject, setLoadingViewerProject] = useState(Boolean(viewerProjectId));
  const [projectNotFound, setProjectNotFound] = useState(false);

  const theme = useCircuitStore((state) => state.theme);
  const isReadOnlyViewer = useCircuitStore((state) => state.isReadOnlyViewer);
  const hydrateFromLocalStorage = useCircuitStore((state) => state.hydrateFromLocalStorage);
  const loadProject = useCircuitStore((state) => state.loadProject);
  const setCloudProjectId = useCircuitStore((state) => state.setCloudProjectId);
  const setCurrentProjectOwnerId = useCircuitStore((state) => state.setCurrentProjectOwnerId);
  const setIsCloudSynced = useCircuitStore((state) => state.setIsCloudSynced);
  const setIsReadOnlyViewer = useCircuitStore((state) => state.setIsReadOnlyViewer);
  const setProjectTitle = useCircuitStore((state) => state.setProjectTitle);
  const initAuth = useAuthStore((state) => state.initAuth);
  const isDark = theme === "dark";

  useEffect(() => {
    initAuth();

    if (viewerProjectId) {
      setLoadingViewerProject(true);
      ProjectsService.getProjectById(viewerProjectId)
        .then((project) => {
          if (!project || !project.data) {
            setProjectNotFound(true);
          } else {
            loadProject({
              format: "relayflow",
              version: "1.0.0",
              metadata: {
                title: project.title,
                createdAt: project.created_at,
                updatedAt: project.updated_at,
              },
              settings: { gridSize: 30, wireRouting: "orthogonal", theme },
              nodes: project.data.nodes || [],
              wires: project.data.wires || [],
              sheets: project.data.sheets,
              activeSheetId: project.data.activeSheetId,
            });
            setCloudProjectId(project.id);
            setCurrentProjectOwnerId(project.owner_id ?? null);
            setProjectTitle(project.title);
            setIsCloudSynced(true);
            setIsReadOnlyViewer(true);
          }
        })
        .catch((err) => {
          console.error("Failed to load viewer circuit:", err);
          setProjectNotFound(true);
        })
        .finally(() => {
          setLoadingViewerProject(false);
        });
    } else {
      hydrateFromLocalStorage();
      setCurrentProjectOwnerId(null);
      setIsReadOnlyViewer(false);
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setIsPaletteOpen(true);
      }
      if (!hasSeenCurrentChangelog()) {
        setIsChangelogOpen(true);
        markCurrentChangelogSeen();
      }
    }
  }, [
    viewerProjectId,
    hydrateFromLocalStorage,
    initAuth,
    loadProject,
    setCloudProjectId,
    setCurrentProjectOwnerId,
    setIsCloudSynced,
    setIsReadOnlyViewer,
    setProjectTitle,
  ]);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle Component Library Sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCloseChangelog = React.useCallback(() => {
    markCurrentChangelogSeen();
    setIsChangelogOpen(false);
  }, []);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(3, prev * 1.15));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.2, prev * 0.85));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 100, y: 100 });
  };

  const handleLocateNode = React.useCallback((nodeId: string | number) => {
    const state = useCircuitStore.getState();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (!state.isReadOnlyViewer) {
      state.selectNode(nodeId);
    }
    if (typeof window !== "undefined") {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      // Center canvas view around target node
      setPanOffset({
        x: screenW / 2 - node.position.x * zoomScale,
        y: screenH / 2 - node.position.y * zoomScale,
      });
    }
  }, [zoomScale, setPanOffset]);

  if (loadingViewerProject) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-dvh w-full ${
          isDark ? "bg-[#090b10] text-slate-100" : "bg-[#f8fafc] text-slate-900"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading circuit simulation...</p>
        </div>
      </div>
    );
  }

  if (projectNotFound) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-dvh w-full p-6 text-center select-none ${
          isDark ? "bg-[#090b10] text-slate-100" : "bg-[#f8fafc] text-slate-900"
        }`}
      >
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${
            isDark ? "bg-white/5 border-white/10 text-amber-400" : "bg-slate-100 border-slate-200 text-amber-600"
          }`}
        >
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold mb-1 tracking-tight">Circuit Not Found</h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
          The shared circuit link may be expired, private, or the identifier is invalid.
        </p>
        <a
          href="/"
          className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
            isDark
              ? "bg-white text-black hover:bg-zinc-200 border-white"
              : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Circuit</span>
        </a>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-dvh w-full overflow-hidden ${
        isDark ? "bg-[#090b10] text-slate-100" : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Top Navbar */}
      <TopNavbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        zoomScale={zoomScale}
        isPaletteOpen={isPaletteOpen}
        onTogglePalette={() => setIsPaletteOpen((prev) => !prev)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
      />

      {/* Main Workspace (Sidebar on the left + Right Column: SubToolbar & Canvas) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {!isReadOnlyViewer && (
          <NodePalette
            zoomScale={zoomScale}
            panOffset={panOffset}
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
          />
        )}
        <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative">
          {/* SubToolbar positioned to the right of Sidebar, above the Canvas */}
          <SubToolbar />
          <FlowCanvas
            zoomScale={zoomScale}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            setZoomScale={setZoomScale}
            onOpenPalette={() => setIsPaletteOpen(true)}
          />
          <SheetTabsBar />
        </div>

        {/* Hardware Inspector & BOM Side Sheet Drawer */}
        <HardwareSheet onLocateNode={handleLocateNode} />

        {/* View Preferences Side Sheet Drawer */}
        <PreferencesSheet />
      </div>

      {/* Changelog Modal (auto-shown once per release version via localStorage) */}
      <ChangelogModal isOpen={isChangelogOpen} onClose={handleCloseChangelog} />
    </div>
  );
};

export default CircuitEditor;
