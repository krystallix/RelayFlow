import { supabase } from "./supabase";
import { CircuitNode, CircuitWire } from "@/engine/types";

export interface CloudProjectRecord {
  id: string;
  title: string;
  owner_id: string;
  is_public: boolean;
  data: {
    nodes: CircuitNode[];
    wires: CircuitWire[];
    settings?: Record<string, any>;
  };
  node_count?: number;
  wire_count?: number;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_MOCK_PROJECTS = "relayflow_mock_cloud_projects";
let inMemoryProjects: CloudProjectRecord[] = [];

function getLocalProjects(): CloudProjectRecord[] {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_MOCK_PROJECTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return inMemoryProjects;
}

function setLocalProjects(projects: CloudProjectRecord[]) {
  inMemoryProjects = projects;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_MOCK_PROJECTS, JSON.stringify(projects));
    } catch (e) {}
  }
}

export const ProjectsService = {
  _resetMockStorage() {
    inMemoryProjects = [];
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(LOCAL_STORAGE_MOCK_PROJECTS);
      } catch (e) {}
    }
  },

  async listUserProjects(userId: string): Promise<CloudProjectRecord[]> {
    if (!supabase) {
      // Mock storage
      const all = getLocalProjects();
      return all.filter((p) => p.owner_id === userId);
    }

    try {
      const { data, error } = await supabase
        .schema("relayflow")
        .from("projects")
        .select("id, title, owner_id, is_public, data, created_at, updated_at")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        node_count: Array.isArray(row.data?.nodes) ? row.data.nodes.length : 0,
        wire_count: Array.isArray(row.data?.wires) ? row.data.wires.length : 0,
      }));
    } catch (e) {
      console.warn("Failed to fetch cloud projects, using local cache:", e);
      return getLocalProjects().filter((p) => p.owner_id === userId);
    }
  },

  async saveProject(
    userId: string,
    title: string,
    nodes: CircuitNode[],
    wires: CircuitWire[],
    existingId?: string | null
  ): Promise<CloudProjectRecord> {
    const cleanTitle = (title || "Untitled Circuit").trim();
    let projectId = existingId?.trim() || null;

    // If existingId is not provided, look for an existing project by the same owner and title to OVERWRITE / UPDATE it!
    if (!projectId) {
      if (!supabase) {
        const list = getLocalProjects();
        const found = list.find(
          (p) => p.owner_id === userId && p.title.trim().toLowerCase() === cleanTitle.toLowerCase()
        );
        if (found) {
          projectId = found.id;
        }
      } else {
        try {
          const { data: existingRows } = await supabase
            .schema("relayflow")
            .from("projects")
            .select("id")
            .eq("owner_id", userId)
            .ilike("title", cleanTitle)
            .order("updated_at", { ascending: false })
            .limit(1);

          if (existingRows && existingRows.length > 0 && existingRows[0]?.id) {
            projectId = existingRows[0].id;
          }
        } catch (err) {
          console.warn("Could not check existing project by title:", err);
        }
      }
    }

    if (!projectId) {
      projectId = "c_" + Math.random().toString(36).slice(2, 8);
    }

    const now = new Date().toISOString();

    const record: CloudProjectRecord = {
      id: projectId,
      title: cleanTitle,
      owner_id: userId,
      is_public: true,
      data: { nodes, wires },
      node_count: nodes.length,
      wire_count: wires.length,
      created_at: now,
      updated_at: now,
    };

    if (!supabase) {
      const list = getLocalProjects();
      const existingIdx = list.findIndex((p) => p.id === projectId);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...record, created_at: list[existingIdx].created_at };
      } else {
        list.unshift(record);
      }
      setLocalProjects(list);
      return record;
    }

    try {
      const { data, error } = await supabase
        .schema("relayflow")
        .from("projects")
        .upsert({
          id: projectId,
          title: record.title,
          owner_id: userId,
          data: record.data,
          is_public: true,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      // Also keep local fallback cache synced
      const list = getLocalProjects();
      const existingIdx = list.findIndex((p) => p.id === projectId);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...record, created_at: list[existingIdx].created_at };
      } else {
        list.unshift(record);
      }
      setLocalProjects(list);

      return {
        ...data,
        node_count: nodes.length,
        wire_count: wires.length,
      };
    } catch (dbErr) {
      console.warn("Supabase upsert failed, falling back to local projects cache:", dbErr);
      const list = getLocalProjects();
      const existingIdx = list.findIndex((p) => p.id === projectId);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...record, created_at: list[existingIdx].created_at };
      } else {
        list.unshift(record);
      }
      setLocalProjects(list);
      return record;
    }
  },

  async getProjectById(projectId: string): Promise<CloudProjectRecord | null> {
    if (!supabase) {
      const list = getLocalProjects();
      return list.find((p) => p.id === projectId) || null;
    }

    const { data, error } = await supabase
      .schema("relayflow")
      .from("projects")
      .select("id, title, owner_id, is_public, data, created_at, updated_at")
      .eq("id", projectId)
      .single();

    if (error || !data) return null;
    return {
      ...data,
      node_count: Array.isArray(data.data?.nodes) ? data.data.nodes.length : 0,
      wire_count: Array.isArray(data.data?.wires) ? data.data.wires.length : 0,
    };
  },

  async deleteProject(projectId: string): Promise<boolean> {
    if (!supabase) {
      const list = getLocalProjects().filter((p) => p.id !== projectId);
      setLocalProjects(list);
      return true;
    }

    const { error } = await supabase.schema("relayflow").from("projects").delete().eq("id", projectId);
    return !error;
  },
};
