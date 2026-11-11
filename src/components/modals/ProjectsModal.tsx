"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FolderOpen,
  Plus,
  Share2,
  Trash2,
  Clock,
  Cpu,
  GitFork,
  ExternalLink,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCircuitStore } from "@/store/useCircuitStore";
import { ProjectsService, CloudProjectRecord } from "@/lib/projectsService";
import { getTranslation } from "@/i18n/translations";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (project: CloudProjectRecord) => void;
  onShareProject: (project: CloudProjectRecord) => void;
  onNewProject: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  onOpenProject,
  onShareProject,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<CloudProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { theme, locale } = useCircuitStore();
  const isDark = theme === "dark";
  const t = getTranslation(locale).projects;

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await ProjectsService.listUserProjects(user.id);
      setProjects(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadProjects();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(id);
    await ProjectsService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 select-none ${
          isDark ? "bg-[#131620] border-white/15 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg border ${
                isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">{t.title}</h3>
              <p className="text-[11px] text-zinc-400 font-normal">
                {user?.email} • {projects.length} {projects.length === 1 ? "circuit" : "circuits"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isDark
                  ? "bg-white/10 hover:bg-white/15 border-white/15 text-zinc-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newProject}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project List / Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs">
              <span className="animate-spin text-lg mb-2">◷</span>
              <span>Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 ${
                  isDark ? "bg-white/5 border-white/10 text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              >
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold mb-1">{t.noProjects}</h4>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">{t.noProjectsDesc}</p>
              <button
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200 border-white"
                    : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.newProject}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    onOpenProject(proj);
                    onClose();
                  }}
                  className={`group p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isDark
                      ? "bg-[#181c26] hover:bg-[#202634] border-white/10 hover:border-white/20"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-semibold text-xs leading-snug truncate group-hover:text-blue-400 transition-colors">
                        {proj.title}
                      </h4>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase shrink-0">
                        #{proj.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(proj.updated_at)}
                      </span>
                      <span>•</span>
                      <span>
                        {proj.node_count ?? proj.data?.nodes?.length ?? 0} {t.symbols}
                      </span>
                      <span>•</span>
                      <span>
                        {proj.wire_count ?? proj.data?.wires?.length ?? 0} {t.wires}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareProject(proj);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition-colors ${
                        isDark
                          ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                          : "bg-white hover:bg-slate-200 border-slate-200 text-slate-700"
                      }`}
                      title={t.share}
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{t.share}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, proj.id)}
                        disabled={deletingId === proj.id}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
