"use client";

import React from "react";
import { Activity, Zap, ShieldCheck, AlertCircle } from "lucide-react";

export interface ProbeReading {
  potential: string | null;
  isEnergized: boolean;
  name: string;
  terminalTag?: string | null;
  screenPos: { x: number; y: number };
}

interface VirtualProbeHUDProps {
  reading: ProbeReading | null;
  isSimulating: boolean;
  isDark: boolean;
}

export const VirtualProbeHUD: React.FC<VirtualProbeHUDProps> = ({
  reading,
  isSimulating,
  isDark,
}) => {
  if (!reading) return null;

  // Determine measurement specs based on potential string
  let voltage = "0.0 V";
  let mode = "AC";
  let freq = "50.0 Hz";
  let statusText = "HIGH-Z (OPEN)";
  let statusColor = "text-zinc-500";
  let badgeColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  const p = reading.potential;

  if (p === "L1" || p === "L2" || p === "L3") {
    voltage = "230.0 V";
    mode = "AC RMS";
    freq = "50.0 Hz";
    statusText = reading.isEnergized ? "ACTIVE (LIVE PHASE)" : "POTENTIAL PRESENT";
    statusColor = reading.isEnergized ? "text-zinc-100 font-semibold" : "text-zinc-400";
  } else if (p === "N") {
    voltage = "0.05 V";
    mode = "AC";
    freq = "50.0 Hz";
    statusText = reading.isEnergized ? "RETURN CURRENT (ACTIVE)" : "NEUTRAL REFERENCE";
    statusColor = reading.isEnergized ? "text-zinc-100 font-semibold" : "text-zinc-400";
  } else if (p === "+24V") {
    voltage = "+24.0 V";
    mode = "DC";
    freq = "---";
    statusText = reading.isEnergized ? "CLOSED CIRCUIT (+24V)" : "SUPPLY BUS";
    statusColor = reading.isEnergized ? "text-zinc-100 font-semibold" : "text-zinc-400";
  } else if (p === "-24V") {
    voltage = "0.0 V";
    mode = "DC";
    freq = "---";
    statusText = reading.isEnergized ? "RETURN (0V DC)" : "COMMON REFERENCE";
    statusColor = reading.isEnergized ? "text-zinc-100 font-semibold" : "text-zinc-400";
  } else if (p === "PE") {
    voltage = "0.0 V";
    mode = "GND";
    freq = "---";
    statusText = "PROTECTIVE EARTH";
    statusColor = "text-zinc-400";
  }

  const screenW = typeof window !== "undefined" ? window.innerWidth : 400;
  const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
  const posX = Math.max(12, Math.min(reading.screenPos.x + 18, screenW - 250));
  const posY = Math.max(12, Math.min(reading.screenPos.y - 45, screenH - 160));

  return (
    <div
      style={{
        left: posX,
        top: posY,
      }}
      className={`fixed z-50 pointer-events-none rounded-xl border p-2.5 shadow-2xl backdrop-blur-md transition-all duration-75 select-none ${
        isDark
          ? "bg-[#0b0e17]/95 border-white/15 text-white shadow-black/80"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-xl"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Activity className="w-3 h-3" />
          <span>VIRTUAL MULTIMETER</span>
        </div>
        <span className="font-mono text-[9px] text-zinc-400">
          {reading.name} {reading.terminalTag ? `[${reading.terminalTag}]` : ""}
        </span>
      </div>

      {/* Main LCD Display */}
      <div className="mt-1.5 flex items-baseline justify-between gap-4">
        <div>
          <div className={`font-mono text-xl font-black tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
            {voltage}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-zinc-400">
            <span>MODE: <strong className={isDark ? "text-zinc-200" : "text-zinc-700"}>{mode}</strong></span>
            <span>FREQ: <strong className={isDark ? "text-zinc-200" : "text-zinc-700"}>{freq}</strong></span>
          </div>
        </div>

        {/* State Badge */}
        <div className="px-2 py-1 rounded border text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 border-white/10 text-zinc-300">
          {p || "OPEN"}
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-2 pt-1 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        <span className={statusColor}>{statusText}</span>
      </div>
    </div>
  );
};
