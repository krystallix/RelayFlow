"use client";

import React from "react";
import { Sparkles, PlusCircle, Wrench, Zap } from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import {
  CHANGELOG_RELEASES,
  CURRENT_CHANGELOG_VERSION,
  ChangelogItemType,
} from "@/constants/changelog";
import { Modal, ModalHeader, ModalFooter, Badge, Button, BadgeVariant } from "@/components/ui";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEM_TYPE_META: Record<
  ChangelogItemType,
  { variant: BadgeVariant; en: string; id: string; icon: React.ReactNode }
> = {
  added: {
    variant: "emerald",
    en: "Added",
    id: "Baru",
    icon: <PlusCircle className="w-3 h-3" />,
  },
  improved: {
    variant: "blue",
    en: "Improved",
    id: "Peningkatan",
    icon: <Zap className="w-3 h-3" />,
  },
  fixed: {
    variant: "amber",
    en: "Fixed",
    id: "Perbaikan",
    icon: <Wrench className="w-3 h-3" />,
  },
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const locale = useCircuitStore((s) => s.locale);
  const isId = locale === "id";

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-lg">
      <ModalHeader
        title={isId ? "Apa yang Baru di RelayFlow" : "What's New in RelayFlow"}
        subtitle={
          isId
            ? `Catatan pembaruan terbaru — v${CURRENT_CHANGELOG_VERSION}`
            : `Latest updates and improvements — v${CURRENT_CHANGELOG_VERSION}`
        }
        icon={<Sparkles className="w-4 h-4" />}
        onClose={onClose}
      />

      {/* Scrollable Release Timeline */}
      <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-5">
        {CHANGELOG_RELEASES.map((release, releaseIdx) => (
          <section
            key={release.version}
            className={
              releaseIdx > 0
                ? "pt-4 border-t border-slate-200 dark:border-white/10"
                : undefined
            }
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Badge
                  variant={releaseIdx === 0 ? "emerald" : "neutral"}
                  className="font-mono text-[10px] shrink-0"
                >
                  v{release.version}
                </Badge>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                  {isId ? release.title.id : release.title.en}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                {release.date}
              </span>
            </div>

            <ul className="space-y-2">
              {release.items.map((item, idx) => {
                const meta = ITEM_TYPE_META[item.type];
                return (
                  <li
                    key={`${release.version}-${idx}`}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-zinc-300"
                  >
                    <Badge
                      variant={meta.variant}
                      className="mt-0.5 shrink-0 text-[9.5px] px-1.5 py-0.5"
                    >
                      {meta.icon}
                      <span>{isId ? meta.id : meta.en}</span>
                    </Badge>
                    <span className="flex-1">{isId ? item.id : item.en}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <ModalFooter className="justify-between">
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          {isId
            ? "Dapat dibuka kembali lewat menu Help"
            : "Reopen anytime from the Help menu"}
        </span>
        <Button variant="primary" size="md" onClick={onClose} className="font-semibold">
          {isId ? "Mengerti" : "Got it"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
