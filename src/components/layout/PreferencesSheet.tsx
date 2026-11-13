"use client";

import React from "react";
import { useCircuitStore } from "@/store/useCircuitStore";
import {
  X,
  RotateCcw,
  Sliders,
  Type,
  Activity,
  Check,
  Minus,
  Plus,
} from "lucide-react";

interface CheckboxItemProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
}) => {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 p-2.5 -mx-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors group select-none"
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            checked
              ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
              : "border-zinc-300 bg-white group-hover:border-zinc-400"
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-900 leading-tight">
          {label}
        </div>
        {description && (
          <div className="text-[11px] text-zinc-500 mt-0.5 leading-normal">
            {description}
          </div>
        )}
      </div>
    </label>
  );
};

interface PxStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
  onChange: (val: number) => void;
}

const PxStepper: React.FC<PxStepperProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  description,
  onChange,
}) => {
  const handleDec = () => {
    onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  };

  const handleInc = () => {
    onChange(Math.min(max, Math.round((value + step) * 10) / 10));
  };

  return (
    <div className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-zinc-50 transition-colors">
      <div className="flex flex-col min-w-0 pr-3">
        <span className="text-xs font-medium text-zinc-900">{label}</span>
        {description && (
          <span className="text-[11px] text-zinc-500 mt-0.5">{description}</span>
        )}
      </div>

      {/* Stepper Border Group: [-  12 px  +] without internal separators */}
      <div className="flex items-center rounded-lg border border-zinc-200 bg-white shadow-xs text-xs font-mono overflow-hidden shrink-0">
        <button
          onClick={handleDec}
          disabled={value <= min}
          className="p-1.5 transition-colors cursor-pointer text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Decrease"
        >
          <Minus className="w-3 h-3" />
        </button>

        <span className="px-2.5 py-1 text-center font-medium text-zinc-900 text-xs min-w-[54px] select-none">
          {value} {unit}
        </span>

        <button
          onClick={handleInc}
          disabled={value >= max}
          className="p-1.5 transition-colors cursor-pointer text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Increase"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const PreferencesSheet: React.FC = React.memo(() => {
  const isPreferencesOpen = useCircuitStore((s) => s.isPreferencesOpen);
  const setIsPreferencesOpen = useCircuitStore((s) => s.setIsPreferencesOpen);
  const preferences = useCircuitStore((s) => s.canvasPreferences);
  const updatePreferences = useCircuitStore((s) => s.updateCanvasPreferences);
  const resetPreferences = useCircuitStore((s) => s.resetCanvasPreferences);
  const locale = useCircuitStore((s) => s.locale);

  const isId = locale === "id";

  return (
    <aside
      aria-hidden={!isPreferencesOpen}
      className={`fixed top-14 bottom-0 right-0 z-40 w-full sm:w-[350px] md:w-[380px] flex flex-col bg-white text-zinc-950 border-l border-zinc-200 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none pointer-events-auto ${
        isPreferencesOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
    >
      {/* 1. Header (shadcn-style) */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-700" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            {isId ? "Preferensi Tampilan" : "View Preferences"}
          </h2>
        </div>

        <button
          onClick={() => setIsPreferencesOpen(false)}
          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
          title={isId ? "Tutup" : "Close"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-xs">
        {/* Section: Typography & Labels */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
            <Type className="w-3.5 h-3.5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-800 text-xs uppercase tracking-wider">
              {isId ? "Label & Tipografi" : "Labels & Typography"}
            </h3>
          </div>

          <div className="space-y-1">
            {/* Wire Label Stepper: [- 9 px +] */}
            <PxStepper
              label={isId ? "Ukuran Nomor Kawat" : "Wire Label Size"}
              description={isId ? "Ukuran font teks nomor kabel" : "Font size of wire number text"}
              value={typeof preferences.wireNumberSize === "number" ? preferences.wireNumberSize : 9}
              min={7}
              max={16}
              step={1}
              unit="px"
              onChange={(val) => updatePreferences({ wireNumberSize: val })}
            />

            {/* Component Tag Stepper: [- 12 px +] */}
            <PxStepper
              label={isId ? "Ukuran Tag Komponen" : "Component Tag Size"}
              description={isId ? "Ukuran font tag K1, S1, dsb." : "Font size for K1, S1 component tags"}
              value={typeof preferences.componentTagSize === "number" ? preferences.componentTagSize : 12}
              min={8}
              max={22}
              step={1}
              unit="px"
              onChange={(val) => updatePreferences({ componentTagSize: val })}
            />

            {/* Comment Text Stepper: [- 10 px +] */}
            <PxStepper
              label={isId ? "Ukuran Teks Komentar" : "Comment Text Size"}
              description={isId ? "Ukuran font catatan keterangan komponen" : "Font size for component comments"}
              value={typeof preferences.commentTextSize === "number" ? preferences.commentTextSize : 10}
              min={8}
              max={18}
              step={1}
              unit="px"
              onChange={(val) => updatePreferences({ commentTextSize: val })}
            />
          </div>

          {/* Checkboxes for Typography */}
          <div className="pt-2 border-t border-zinc-100 divide-y divide-zinc-100">
            <CheckboxItem
              id="pref-show-comment"
              checked={preferences.showCommentText}
              onChange={(checked) => updatePreferences({ showCommentText: checked })}
              label={isId ? "Tampilkan Deskripsi Komentar" : "Show Component Comments"}
              description={isId ? "Teks keterangan fungsi di bawah tag komponen" : "Display description notes below component tags"}
            />
            <CheckboxItem
              id="pref-high-contrast"
              checked={preferences.highContrastBadges}
              onChange={(checked) => updatePreferences({ highContrastBadges: checked })}
              label={isId ? "Latar Belakang / Kontras Label" : "High-Contrast Label Badges"}
              description={
                isId
                  ? "Tampilkan kotak latar belakang pada label kawat dan tag komponen (-CO1)"
                  : "Show background box on wire numbers and component tags (-CO1)"
              }
            />
          </div>
        </section>

        {/* Section: Wires & Routing */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-800 text-xs uppercase tracking-wider">
              {isId ? "Kawat & Sambungan" : "Wires & Connections"}
            </h3>
          </div>

          <div className="space-y-1">
            {/* Wire Thickness Stepper: [- 2 px +] */}
            <PxStepper
              label={isId ? "Ketebalan Garis Kawat" : "Wire Line Thickness"}
              description={isId ? "Lebar stroke garis diagram kawat" : "Stroke width for circuit wires"}
              value={typeof preferences.wireThickness === "number" ? preferences.wireThickness : 2}
              min={1}
              max={5}
              step={0.5}
              unit="px"
              onChange={(val) => updatePreferences({ wireThickness: val })}
            />
          </div>

          {/* Checkboxes for Wires */}
          <div className="pt-2 border-t border-zinc-100 divide-y divide-zinc-100">
            <CheckboxItem
              id="pref-terminal-pins"
              checked={preferences.showTerminalPinsAlways}
              onChange={(checked) => updatePreferences({ showTerminalPinsAlways: checked })}
              label={isId ? "Selalu Tampilkan Nomor Pin Terminal" : "Always Show Terminal Pin Numbers"}
              description={isId ? "Tampilkan nomor pin (A1/A2, 13/14) tanpa perlu hover" : "Keep terminal port numbers visible at all times"}
            />
            <CheckboxItem
              id="pref-highlight-crossings"
              checked={preferences.highlightCrossings}
              onChange={(checked) => updatePreferences({ highlightCrossings: checked })}
              label={isId ? "Lengkungan Jumper Persimpangan" : "Orthogonal Wire Crossing Arcs"}
              description={isId ? "Gambarkan busur lompatan saat 2 kawat bersilangan" : "Render bridge arc jump when wires cross"}
            />
          </div>
        </section>
      </div>

      {/* 3. Footer Reset to Default */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-zinc-500">
          {isId ? "Tersimpan otomatis" : "Auto-saved to storage"}
        </span>

        <button
          onClick={resetPreferences}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>{isId ? "Kembalikan Bawaan" : "Reset Default"}</span>
        </button>
      </div>
    </aside>
  );
});

PreferencesSheet.displayName = "PreferencesSheet";
