"use client";

import React, { useState, useEffect } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { SubToolbar } from "@/components/layout/SubToolbar";
import { NodePalette } from "@/components/sidebar/NodePalette";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
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
  const [loadingViewerProject, setLoadingViewerProject] = useState(Boolean(viewerProjectId));
  const [projectNotFound, setProjectNotFound] = useState(false);

  const theme = useCircuitStore((state) => state.theme);
  const isReadOnlyViewer = useCircuitStore((state) => state.isReadOnlyViewer);
  const hydrateFromLocalStorage = useCircuitStore((state) => state.hydrateFromLocalStorage);
  const loadProject = useCircuitStore((state) => state.loadProject);
  const setCloudProjectId = useCircuitStore((state) => state.setCloudProjectId);
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
            });
            setCloudProjectId(project.id);
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
      setIsReadOnlyViewer(false);
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setIsPaletteOpen(true);
      }
    }
  }, [
    viewerProjectId,
    hydrateFromLocalStorage,
    initAuth,
    loadProject,
    setCloudProjectId,
    setIsCloudSynced,
    setIsReadOnlyViewer,
    setProjectTitle,
    theme,
  ]);

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

  if (loadingViewerProject) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen w-screen ${
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
        className={`flex flex-col items-center justify-center h-screen w-screen p-6 text-center select-none ${
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
      className={`flex flex-col h-screen w-screen overflow-hidden ${
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
      />

      {/* Main Workspace (Sidebar on the left + Right Column: SubToolbar & Canvas) */}
      <div className="flex flex-1 overflow-hidden relative">
        {!isReadOnlyViewer && (
          <NodePalette
            zoomScale={zoomScale}
            panOffset={panOffset}
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
          />
        )}
        <div className="flex flex-col flex-1 h-full overflow-hidden relative">
          {/* SubToolbar positioned to the right of Sidebar, above the Canvas */}
          <SubToolbar />
          <FlowCanvas
            zoomScale={zoomScale}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            setZoomScale={setZoomScale}
            onOpenPalette={() => setIsPaletteOpen(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default CircuitEditor;
