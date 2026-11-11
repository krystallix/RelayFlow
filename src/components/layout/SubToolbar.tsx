"use client";

import React, { useState } from "react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { getTranslation } from "@/i18n/translations";
import {
  Play,
  Square,
  StepForward,
  RotateCcw,
  Sparkles,
  GitCommit,
  Hash,
} from "lucide-react";

interface SubToolbarProps {
  onAutoLayout?: () => void;
}

interface TooltipButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  active?: boolean;
  isDark: boolean;
  children: React.ReactNode;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  onClick,
  disabled = false,
  tooltip,
  shortcut,
  active = false,
  isDark,
  children,
}) => {
  const [hovered, setHovered] = useState(false);

  const colorClasses = active
    ? isDark
      ? "bg-white/20 text-white shadow-xs"
      : "bg-slate-200/90 text-slate-900 shadow-xs"
    : isDark
    ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70";

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltip}
        className={`p-1.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none select-none ${colorClasses}`}
      >
        {children}
      </button>

      {/* Floating Tooltip below Island */}
      {hovered && !disabled && (
        <div
          className={`absolute top-full mt-2.5 pointer-events-none z-50 whitespace-nowrap px-2.5 py-1 text-[11px] font-sans font-medium rounded-lg shadow-2xl border animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1.5 ${
            isDark
              ? "bg-[#161922] text-zinc-200 border-white/15 shadow-black/80"
              : "bg-slate-900 text-slate-100 border-slate-800 shadow-slate-900/30"
          }`}
        >
          <span>{tooltip}</span>
          {shortcut && (
            <span
              className={`text-[9.5px] font-mono px-1 py-0.2 rounded border ${
                isDark
                  ? "bg-white/10 text-zinc-400 border-white/10"
                  : "bg-white/15 text-slate-300 border-white/10"
              }`}
            >
              {shortcut}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const SubToolbar: React.FC<SubToolbarProps> = ({ onAutoLayout }) => {
  const {
    isSimulating,
    isReadOnlyViewer,
    startSimulation,
    stopSimulation,
    stepSimulation,
    autoLayout,
    showWireLabels,
    toggleWireLabels,
    renumberWires,
    theme,
    locale,
    nodes,
  } = useCircuitStore();

  const isDark = theme === "dark";
  const t = getTranslation(locale).subtoolbar;

  const handleAutoLayout = () => {
    if (onAutoLayout) onAutoLayout();
    else autoLayout();
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none">
      {/* Floating Island / Capsule Container */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 ${
          isDark
            ? "bg-[#11141c]/80 border-white/15 text-zinc-300 shadow-black/60"
            : "bg-white/85 border-slate-200/90 text-slate-700 shadow-slate-900/15"
        }`}
      >
        {/* Simulation: Primary Pill Button */}
        {isSimulating ? (
          <button
            onClick={stopSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
              isDark
                ? "bg-red-600/90 hover:bg-red-500 text-white border-red-500 shadow-red-950/40"
                : "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-red-600/20"
            }`}
            title={t.stopSimTooltip}
          >
            <Square className="w-3.5 h-3.5 fill-current text-white" />
            <span>{t.stop}</span>
          </button>
        ) : (
          <button
            onClick={startSimulation}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-sm"
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            }`}
            title={t.runSimTooltip}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.simulate}</span>
          </button>
        )}

        {/* Step Forward */}
        <TooltipButton
          onClick={stepSimulation}
          disabled={!isSimulating}
          tooltip={t.stepTooltip}
          isDark={isDark}
        >
          <StepForward className="w-4 h-4" />
        </TooltipButton>

        {/* Reset Simulation */}
        <TooltipButton
          onClick={stopSimulation}
          tooltip={t.resetTooltip}
          isDark={isDark}
        >
          <RotateCcw className="w-4 h-4" />
        </TooltipButton>

        {/* Auto Layout (Editor only) */}
        {!isReadOnlyViewer && (
          <>
            <div
              className={`h-4 w-[1px] mx-1 ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
            <TooltipButton
              onClick={handleAutoLayout}
              disabled={nodes.length === 0}
              tooltip={t.autoLayoutTooltip}
              shortcut="Alt+L"
              isDark={isDark}
            >
              <Sparkles className="w-4 h-4" />
            </TooltipButton>
          </>
        )}

        {/* Subtle Divider */}
        <div
          className={`h-4 w-[1px] mx-1 ${
            isDark ? "bg-white/10" : "bg-slate-200"
          }`}
        />

        {/* Wire Labels Toggle */}
        <TooltipButton
          onClick={toggleWireLabels}
          tooltip={showWireLabels ? t.wireLabelsHideTooltip : t.wireLabelsShowTooltip}
          active={showWireLabels}
          isDark={isDark}
        >
          <Hash className="w-4 h-4" />
        </TooltipButton>

        {/* Renumber All Wires (Editor only) */}
        {!isReadOnlyViewer && (
          <TooltipButton
            onClick={renumberWires}
            tooltip={t.renumberTooltip}
            isDark={isDark}
          >
            <GitCommit className="w-4 h-4" />
          </TooltipButton>
        )}
      </div>
    </div>
  );
};
