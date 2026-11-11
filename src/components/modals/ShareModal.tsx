"use client";

import React, { useState } from "react";
import { X, Share2, Copy, Check, Eye, Play, ShieldAlert, Sparkles, Globe } from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { getTranslation } from "@/i18n/translations";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const { theme, locale } = useCircuitStore();
  const isDark = theme === "dark";
  const t = getTranslation(locale).share;

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://relayflow.app";
  const shareUrl = `${origin}/c/${projectId}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 select-none ${
          isDark ? "bg-[#131620] border-white/15 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">{t.title}</h3>
              <p className="text-[11px] text-zinc-400 font-normal truncate max-w-[240px]">
                {projectTitle || "Untitled Circuit"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Access Badge Notice */}
        <div
          className={`p-3 rounded-xl border mb-4 flex items-start gap-2.5 ${
            isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200"
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{t.accessBadge}</span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                Public Link
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{t.subtitle}</p>
          </div>
        </div>

        {/* URL Box & Copy Button */}
        <div className="space-y-1.5 mb-4">
          <label className="block text-[11px] font-medium text-zinc-400">Public Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none select-all ${
                isDark
                  ? "bg-[#151922] border-white/10 text-zinc-300"
                  : "bg-slate-100 border-slate-300 text-slate-800"
              }`}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : isDark
                  ? "bg-white text-black hover:bg-zinc-200 border-white"
                  : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyLink}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Permissions & Security explanation */}
        <div
          className={`p-3 rounded-xl border text-[11px] text-zinc-400 leading-relaxed space-y-1.5 ${
            isDark ? "bg-[#0b0d13] border-white/5" : "bg-slate-100/70 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Play className="w-3 h-3 text-blue-400" />
            <span>Interactive Viewer Features:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-1 text-[10.5px]">
            <li>Full live simulation (switches, coils, motors, lamps)</li>
            <li>Multimeter / Voltage Probe HUD measurement</li>
            <li>Circuit layout protected against unauthorized edits</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
