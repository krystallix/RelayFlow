"use client";

import React, { useState, useEffect } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { NodePalette } from "@/components/sidebar/NodePalette";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { useCircuitStore } from "@/store/useCircuitStore";
import { FileAdapter } from "@/engine/serializer/FileAdapter";

export default function Home() {
  const [zoomScale, setZoomScale] = useState(0.85);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 15 });
  const theme = useCircuitStore((state) => state.theme);
  const isDark = theme === "dark";

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

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden transition-colors duration-150 ${
        isDark ? "bg-[#090b10] text-slate-100" : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Top Navbar */}
      <TopNavbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        zoomScale={zoomScale}
      />

      {/* Main Workspace (Sidebar + Canvas) */}
      <div className="flex flex-1 overflow-hidden relative">
        <NodePalette zoomScale={zoomScale} panOffset={panOffset} />
        <FlowCanvas
          zoomScale={zoomScale}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          setZoomScale={setZoomScale}
        />
      </div>
    </div>
  );
}
