"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, Play, Globe } from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { getTranslation } from "@/i18n/translations";
import { Modal, ModalHeader, Alert, Badge, Input, Button } from "@/components/ui";

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
  const { locale } = useCircuitStore();
  const t = getTranslation(locale).share;

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
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-md">
      <ModalHeader
        title={t.title}
        subtitle={projectTitle || "Untitled Circuit"}
        icon={<Share2 className="w-4 h-4" />}
        onClose={onClose}
      />

      {/* Access Badge Notice */}
      <Alert variant="info" icon={<Globe className="w-4 h-4 text-emerald-400" />} className="mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{t.accessBadge}</span>
            <Badge variant="emerald" className="font-mono text-[9px] uppercase rounded">
              Public Link
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{t.subtitle}</p>
        </div>
      </Alert>

      {/* URL Box & Copy Button */}
      <div className="space-y-1.5 mb-4">
        <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
          Public Link
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 font-mono select-all"
          />
          <Button
            variant={copied ? "emerald" : "primary"}
            size="md"
            onClick={handleCopy}
            className="shrink-0 font-semibold"
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
          </Button>
        </div>
      </div>

      {/* Permissions & Security explanation */}
      <div className="p-3 rounded-xl border text-[11px] leading-relaxed space-y-1.5 bg-slate-100/70 border-slate-200 text-slate-600 dark:bg-[#0b0d13] dark:border-white/5 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
          <Play className="w-3 h-3 text-blue-400" />
          <span>Interactive Viewer Features:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 pl-1 text-[10.5px]">
          <li>Full live simulation (switches, coils, motors, lamps)</li>
          <li>Multimeter / Voltage Probe HUD measurement</li>
          <li>Circuit layout protected against unauthorized edits</li>
        </ul>
      </div>
    </Modal>
  );
};
