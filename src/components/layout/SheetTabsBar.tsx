"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Layers,
} from "lucide-react";
import { useCircuitStore } from "@/store/useCircuitStore";
import { cn } from "@/lib/utils";

interface TabMenuState {
  sheetId: string;
  x: number;
  y: number;
}

/**
 * Spreadsheet-style bottom sheet tabs bar for switching, adding, renaming,
 * duplicating, and deleting circuit canvases within a project.
 */
export const SheetTabsBar: React.FC = () => {
  const sheets = useCircuitStore((s) => s.sheets);
  const activeSheetId = useCircuitStore((s) => s.activeSheetId);
  const switchSheet = useCircuitStore((s) => s.switchSheet);
  const addSheet = useCircuitStore((s) => s.addSheet);
  const renameSheet = useCircuitStore((s) => s.renameSheet);
  const duplicateSheet = useCircuitStore((s) => s.duplicateSheet);
  const deleteSheet = useCircuitStore((s) => s.deleteSheet);
  const reorderSheets = useCircuitStore((s) => s.reorderSheets);
  const isReadOnlyViewer = useCircuitStore((s) => s.isReadOnlyViewer);
  const locale = useCircuitStore((s) => s.locale);

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [menuState, setMenuState] = useState<TabMenuState | null>(null);
  const [draggedSheetId, setDraggedSheetId] = useState<string | null>(null);
  const [dragOverSheetId, setDragOverSheetId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isId = locale === "id";

  useEffect(() => {
    if (editingSheetId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSheetId]);

  useEffect(() => {
    if (!menuState) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuState(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuState]);

  const startRename = (sheetId: string, currentName: string) => {
    if (isReadOnlyViewer) return;
    setMenuState(null);
    setEditingSheetId(sheetId);
    setDraftName(currentName);
  };

  const commitRename = () => {
    if (editingSheetId) {
      const trimmed = draftName.trim();
      if (trimmed) {
        renameSheet(editingSheetId, trimmed);
      }
      setEditingSheetId(null);
    }
  };

  const openMenuAt = (sheetId: string, clientX: number, clientY: number) => {
    if (isReadOnlyViewer) return;
    const menuWidth = 176;
    const clampedX =
      typeof window !== "undefined"
        ? Math.min(Math.max(8, clientX), window.innerWidth - menuWidth - 8)
        : clientX;
    setMenuState({ sheetId, x: clampedX, y: clientY });
  };

  const activeIndex = Math.max(
    0,
    sheets.findIndex((s) => s.id === activeSheetId)
  );

  return (
    <div className="h-9 shrink-0 border-t border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-[#11141c] dark:text-zinc-300 flex items-center px-2 gap-1.5 select-none z-20">
      {/* Add Sheet Button */}
      {!isReadOnlyViewer && (
        <button
          type="button"
          onClick={() => addSheet()}
          title={isId ? "Tambah Sheet Baru" : "Add New Sheet"}
          className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Scrollable Sheet Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 py-1">
        {sheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = editingSheetId === sheet.id;
          const isDragging = draggedSheetId === sheet.id;
          const isDragOver = dragOverSheetId === sheet.id && draggedSheetId !== sheet.id;

          return (
            <div
              key={sheet.id}
              draggable={!isReadOnlyViewer && !isEditing}
              onDragStart={(e) => {
                if (isReadOnlyViewer || isEditing) return;
                setDraggedSheetId(sheet.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", sheet.id);
              }}
              onDragOver={(e) => {
                if (!draggedSheetId || draggedSheetId === sheet.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverSheetId !== sheet.id) {
                  setDragOverSheetId(sheet.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverSheetId === sheet.id) {
                  setDragOverSheetId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = draggedSheetId || e.dataTransfer.getData("text/plain");
                if (sourceId && sourceId !== sheet.id) {
                  reorderSheets(sourceId, sheet.id);
                }
                setDraggedSheetId(null);
                setDragOverSheetId(null);
              }}
              onDragEnd={() => {
                setDraggedSheetId(null);
                setDragOverSheetId(null);
              }}
              onClick={() => {
                if (!isEditing) switchSheet(sheet.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startRename(sheet.id, sheet.name);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openMenuAt(sheet.id, e.clientX, rect.top);
              }}
              className={cn(
                "group relative h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer",
                isActive
                  ? "bg-slate-100 border-slate-300 text-slate-900 shadow-xs dark:bg-[#1c212e] dark:border-white/20 dark:text-white"
                  : "bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/5",
                isDragging && "opacity-40",
                isDragOver && "border-amber-400 dark:border-amber-400"
              )}
            >

              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") commitRename();
                    else if (e.key === "Escape") setEditingSheetId(null);
                  }}
                  className="w-24 px-1 py-0 text-xs rounded border border-amber-500 bg-white text-slate-900 dark:bg-zinc-900 dark:text-white outline-none"
                />
              ) : (
                <span className="max-w-[140px] truncate">{sheet.name}</span>
              )}

              {!isReadOnlyViewer && !isEditing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    openMenuAt(sheet.id, rect.left, rect.top);
                  }}
                  title={isId ? "Opsi Sheet" : "Sheet Options"}
                  className={cn(
                    "p-0.5 rounded transition-opacity cursor-pointer",
                    isActive || menuState?.sheetId === sheet.id
                      ? "opacity-70 hover:opacity-100 hover:bg-slate-200/70 dark:hover:bg-white/10"
                      : "opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-slate-200/70 dark:hover:bg-white/10"
                  )}
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact Sheet Counter */}
      <div className="hidden sm:flex items-center gap-1.5 px-2 text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
        <Layers className="w-3 h-3" />
        <span>
          {activeIndex + 1} / {sheets.length}
        </span>
      </div>

      {/* Sheet Tab Popover Menu */}
      {menuState && !isReadOnlyViewer && (
        <div
          ref={menuRef}
          style={{
            left: `${menuState.x}px`,
            top: `${menuState.y - 6}px`,
            transform: "translateY(-100%)",
          }}
          className="fixed w-44 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 bg-white border-slate-200 text-slate-700 dark:bg-[#161a23] dark:border-white/15 dark:text-zinc-200"
        >
          {(() => {
            const targetSheet = sheets.find((s) => s.id === menuState.sheetId);
            if (!targetSheet) return null;
            const canDelete = sheets.length > 1;

            return (
              <>
                <button
                  type="button"
                  onClick={() => startRename(targetSheet.id, targetSheet.name)}
                  className="w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors hover:bg-slate-100 text-slate-800 dark:hover:bg-white/10 dark:text-zinc-200 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isId ? "Ubah Nama" : "Rename"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    duplicateSheet(targetSheet.id);
                    setMenuState(null);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors hover:bg-slate-100 text-slate-800 dark:hover:bg-white/10 dark:text-zinc-200 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isId ? "Duplikasi" : "Duplicate"}</span>
                </button>

                <div className="my-1 border-t border-slate-200 dark:border-white/10" />

                <button
                  type="button"
                  disabled={!canDelete}
                  onClick={() => {
                    if (!canDelete) return;
                    deleteSheet(targetSheet.id);
                    setMenuState(null);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors",
                    !canDelete
                      ? "opacity-40 cursor-not-allowed text-zinc-400"
                      : "hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isId ? "Hapus" : "Delete"}</span>
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
