import { create } from "zustand";
import { CircuitNode, CircuitWire, RelayFlowProject, Rotation, WireMargins } from "../engine/types";
import { SimulationEngine } from "../engine/SimulationEngine";
import { FileAdapter } from "../engine/serializer/FileAdapter";
import { AutoLayoutEngine } from "../engine/layout/AutoLayoutEngine";
import catalogData from "../constants/components-catalog.json";
import { DEFAULT_SIMPLE_LAMP_PROJECT } from "../constants/default-circuit";
import { WireNetResolver } from "../engine/router/WireNetResolver";
import { ManhattanRouter } from "../engine/router/ManhattanRouter";
import { UserPreferencesService } from "@/lib/userPreferencesService";
import { useAuthStore } from "./useAuthStore";

const catalog = catalogData as Record<string, any>;

const LOCAL_STORAGE_KEY = "relayflow_saved_project";
const LOCAL_STORAGE_THEME_KEY = "relayflow_saved_theme";
const LOCAL_STORAGE_LOCALE_KEY = "relayflow_saved_locale";
const LOCAL_STORAGE_PREFERENCES_KEY = "relayflow_canvas_preferences";

export interface CanvasPreferences {
  // Label & Typography (in px)
  wireNumberSize: number; // default: 9 (range: 7 - 16)
  componentTagSize: number; // default: 12 (range: 8 - 22)
  commentTextSize: number; // default: 10 (range: 8 - 18)
  wireThickness: number; // default: 2 (range: 1 - 5)
  showCommentText: boolean;
  highContrastBadges: boolean;

  // Wires & Connections
  showTerminalPinsAlways: boolean;
  highlightCrossings: boolean;
}

export const DEFAULT_CANVAS_PREFERENCES: CanvasPreferences = {
  wireNumberSize: 9,
  componentTagSize: 12,
  commentTextSize: 10,
  wireThickness: 2,
  showCommentText: true,
  highContrastBadges: true,
  showTerminalPinsAlways: false,
  highlightCrossings: true,
};

function syncDocumentTheme(theme: "dark" | "light") {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    document.documentElement.style.backgroundColor = "#090b10";
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.backgroundColor = "#f8fafc";
    document.documentElement.style.colorScheme = "light";
  }
}

// Initial state is deterministic across both SSR and first client render
function getInitialState(): {
  projectTitle: string;
  theme: "dark" | "light";
  locale: "en" | "id";
  nodes: CircuitNode[];
  wires: CircuitWire[];
} {
  let theme: "dark" | "light" = "dark";
  let locale: "en" | "id" = "en";

  if (typeof window !== "undefined") {
    try {
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        theme = savedTheme;
      }
      const savedLocale = localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY);
      if (savedLocale === "en" || savedLocale === "id") {
        locale = savedLocale;
      }
    } catch (e) {}
  }

  return {
    projectTitle: "Simple Switch & Lamp Circuit",
    theme,
    locale,
    nodes: DEFAULT_SIMPLE_LAMP_PROJECT.nodes.map((n) => ({ ...n })),
    wires: DEFAULT_SIMPLE_LAMP_PROJECT.wires.map((w) => ({ ...w })),
  };
}

// Debounced autosave to localStorage
let autosaveTimeout: any = null;
let getStoreState: (() => any) | null = null;
function saveToLocalStorage(
  partial?: {
    projectTitle?: string;
    nodes?: CircuitNode[];
    wires?: CircuitWire[];
    currentProjectId?: string | null;
  },
  immediate = false
) {
  if (typeof window === "undefined") return;
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = null;
  }

  const persist = () => {
    try {
      const fullState = getStoreState ? getStoreState() : null;
      const title = partial?.projectTitle ?? fullState?.projectTitle ?? "My Circuit";
      const nodes = partial?.nodes ?? fullState?.nodes ?? [];
      const wires = partial?.wires ?? fullState?.wires ?? [];
      const currentProjectId =
        partial?.currentProjectId !== undefined
          ? partial.currentProjectId
          : fullState?.currentProjectId ?? null;

      const dataToSave = {
        format: "relayflow",
        version: "1.0.0",
        metadata: {
          id: currentProjectId || undefined,
          title,
          updatedAt: new Date().toISOString(),
        },
        currentProjectId: currentProjectId || null,
        nodes,
        wires,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Failed to autosave project to localStorage", e);
    }
  };

  if (immediate) {
    persist();
  } else {
    autosaveTimeout = setTimeout(persist, 500);
  }
}

function getNextTag(tag: string | null, existingNodes: CircuitNode[]): string | null {
  if (!tag) return null;
  const match = tag.match(/^(.*?)(\d+)$/);
  if (!match) return `${tag}_1`;
  const prefix = match[1];
  let maxNum = parseInt(match[2], 10);
  for (const n of existingNodes) {
    if (n.tag && n.tag.startsWith(prefix)) {
      const m = n.tag.match(/^(.*?)(\d+)$/);
      if (m && m[1] === prefix) {
        const val = parseInt(m[2], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  }
  return `${prefix}${maxNum + 1}`;
}

interface HistorySnapshot {
  nodes: CircuitNode[];
  wires: CircuitWire[];
}

interface CircuitStoreState {
  projectTitle: string;
  fileFormat: "rflow" | "smrl";
  nodes: CircuitNode[];
  wires: CircuitWire[];
  selectedNodeIds: Set<string | number>;
  selectedWireIds: Set<string | number>;
  wireRoutingMode: "orthogonal" | "bezier";
  theme: "dark" | "light";
  locale: "en" | "id";
  showGrid: boolean;
  showWireLabels: boolean;
  pageViewEnabled: boolean;

  // Simulation state
  isSimulating: boolean;
  shortCircuit: boolean;
  shortCircuitMessage: string | null;

  // History stack for Undo / Redo
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Clipboard for copy & paste
  clipboard: {
    nodes: CircuitNode[];
    wires: CircuitWire[];
  } | null;

  // Active wire drawing state
  wireDraft: {
    fromNodeId: string | number;
    fromPortId: number;
    startPos: { x: number; y: number };
    currentMousePos: { x: number; y: number };
  } | null;

  // Recent symbols used
  recentComponentIds: string[];

  // Cloud & Sharing state
  currentProjectId: string | null;
  isCloudSynced: boolean;
  isReadOnlyViewer: boolean;
  isHardwareSheetOpen: boolean;
  isPreferencesOpen: boolean;
  canvasPreferences: CanvasPreferences;

  // Actions
  hydrateFromLocalStorage: () => void;
  setCloudProjectId: (id: string | null) => void;
  setIsCloudSynced: (synced: boolean) => void;
  setIsReadOnlyViewer: (viewer: boolean) => void;
  setIsHardwareSheetOpen: (open: boolean) => void;
  toggleHardwareSheet: () => void;
  setIsPreferencesOpen: (open: boolean) => void;
  togglePreferences: () => void;
  updateCanvasPreferences: (patch: Partial<CanvasPreferences>) => void;
  resetCanvasPreferences: () => void;
  setProjectTitle: (title: string) => void;
  setWireRoutingMode: (mode: "orthogonal" | "bezier") => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setLocale: (locale: "en" | "id") => void;
  toggleLocale: () => void;
  toggleGrid: () => void;
  togglePageView: () => void;
  setPageViewEnabled: (enabled: boolean) => void;
  loadProject: (project: RelayFlowProject, format?: "rflow" | "smrl") => void;
  resetCanvas: () => void;
  autoLayout: () => void;

  // Selection
  selectNode: (id: string | number, multi?: boolean) => void;
  selectWire: (id: string | number, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Mutation
  addNode: (componentId: string, position: { x: number; y: number }) => void;
  updateNodeData: (
    nodeId: string | number,
    data: {
      tag?: string | null;
      comment?: string | null;
      valueTimeOn?: number;
      valueTimeOff?: number;
      lampColor?: "red" | "green" | "yellow" | "blue" | "white";
      buttonColor?: "red" | "green" | "yellow" | "blue" | "white" | "black";
    },
    commitToHistory?: boolean
  ) => void;
  moveSelectedNodes: (delta: { x: number; y: number }) => void;
  updateNodesPositions: (updates: Array<{ id: string | number; position: { x: number; y: number } }>, commitToHistory?: boolean) => void;
  rotateSelectedNodes: (direction?: "cw" | "ccw") => void;
  rotateNode: (nodeId: string | number, direction?: "cw" | "ccw") => void;
  deleteSelection: () => void;
  deleteNode: (nodeId: string | number) => void;
  deleteWire: (wireId: string | number) => void;
  bringToFront: (targetId?: string | number) => void;
  sendToBack: (targetId?: string | number) => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  pasteSelection: (targetPos?: { x: number; y: number }) => void;

  // Wire Connection
  startWireDraft: (nodeId: string | number, portId: number, startPos: { x: number; y: number }) => void;
  updateWireDraft: (mousePos: { x: number; y: number }) => void;
  completeWireDraft: (toNodeId: string | number, toPortId: number) => void;
  cancelWireDraft: () => void;

  // Interactive component toggling during simulation
  toggleComponentState: (nodeId: string | number) => void;
  setComponentPressed: (nodeId: string | number, pressed: boolean) => void;
  tickTimerSimulation: (deltaSeconds: number) => void;
  splitWireAtJunction: (wireId: string | number, clickPoint: { x: number; y: number }, startDraft?: boolean) => void;
  connectWireToWire: (targetWireId: string | number, tapPoint: { x: number; y: number }) => void;
  updateWireMargins: (wireId: string | number, margins: WireMargins, commit?: boolean) => void;
  updateWireTapPoint: (wireId: string | number, tapPoint: { x: number; y: number }, commit?: boolean) => void;
  updateWireLabel: (wireId: string | number, label: string | null) => void;
  toggleWireLabels: () => void;
  renumberWires: () => void;

  // Simulation controls
  startSimulation: () => void;
  stopSimulation: () => void;
  stepSimulation: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

export const useCircuitStore = create<CircuitStoreState>((set, get) => {
  getStoreState = get;
  const initial = getInitialState();

  const pushHistory = (state: CircuitStoreState): { undoStack: HistorySnapshot[]; redoStack: HistorySnapshot[]; isCloudSynced: boolean } => {
    const currentSnapshot: HistorySnapshot = {
      nodes: state.nodes.map((n) => ({ ...n })),
      wires: state.wires.map((w) => ({ ...w })),
    };
    const newUndo = [...state.undoStack.slice(-49), currentSnapshot];
    return { undoStack: newUndo, redoStack: [], isCloudSynced: false };
  };

  return {
    projectTitle: initial.projectTitle,
    fileFormat: "rflow",
    nodes: initial.nodes,
    wires: initial.wires,
    selectedNodeIds: new Set(),
    selectedWireIds: new Set(),
    wireRoutingMode: "orthogonal",
    theme: initial.theme,
    locale: initial.locale,
    showGrid: true,
    showWireLabels: true,
    pageViewEnabled: false,
    isSimulating: false,
    shortCircuit: false,
    shortCircuitMessage: null,
    undoStack: [],
    redoStack: [],
    clipboard: null,
    wireDraft: null,
    recentComponentIds: ["switchNO", "coil", "lamp", "motor3ph", "breaker3p", "sourcePlus", "sourceNegative"],

    currentProjectId: null,
    isCloudSynced: false,
    isReadOnlyViewer: false,
    isHardwareSheetOpen: false,
    isPreferencesOpen: false,
    canvasPreferences: DEFAULT_CANVAS_PREFERENCES,

    setCloudProjectId: (id) => {
      set({ currentProjectId: id });
      saveToLocalStorage({ currentProjectId: id }, true);
    },
    setIsCloudSynced: (synced) => set({ isCloudSynced: synced }),
    setIsReadOnlyViewer: (viewer) => set({ isReadOnlyViewer: viewer }),
    setIsHardwareSheetOpen: (open) =>
      set({
        isHardwareSheetOpen: open,
        // Mutual exclusion: close preferences sheet if opening hardware sheet
        ...(open ? { isPreferencesOpen: false } : {}),
      }),
    toggleHardwareSheet: () =>
      set((state) => {
        const next = !state.isHardwareSheetOpen;
        return {
          isHardwareSheetOpen: next,
          ...(next ? { isPreferencesOpen: false } : {}),
        };
      }),
    setIsPreferencesOpen: (open) =>
      set({
        isPreferencesOpen: open,
        // Mutual exclusion: close hardware sheet if opening preferences sheet
        ...(open ? { isHardwareSheetOpen: false } : {}),
      }),
    togglePreferences: () =>
      set((state) => {
        const next = !state.isPreferencesOpen;
        return {
          isPreferencesOpen: next,
          ...(next ? { isHardwareSheetOpen: false } : {}),
        };
      }),
    updateCanvasPreferences: (patch) => {
      set((state) => {
        const next = { ...state.canvasPreferences, ...patch };
        try {
          localStorage.setItem(LOCAL_STORAGE_PREFERENCES_KEY, JSON.stringify(next));
        } catch (e) {}

        // Auto-sync to Supabase if user is logged in
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id) {
          UserPreferencesService.savePreferences(currentUser.id, next, state.theme);
        }

        return { canvasPreferences: next };
      });
    },
    resetCanvasPreferences: () => {
      try {
        localStorage.removeItem(LOCAL_STORAGE_PREFERENCES_KEY);
      } catch (e) {}

      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id) {
        UserPreferencesService.savePreferences(currentUser.id, DEFAULT_CANVAS_PREFERENCES, undefined, true);
      }

      set({ canvasPreferences: DEFAULT_CANVAS_PREFERENCES });
    },

    hydrateFromLocalStorage: () => {
      if (typeof window === "undefined") return;

      let theme: "dark" | "light" | undefined;
      try {
        const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
        if (savedTheme === "dark" || savedTheme === "light") {
          theme = savedTheme;
        }
      } catch (e) {}

      let locale: "en" | "id" | undefined;
      try {
        const savedLocale = localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY);
        if (savedLocale === "en" || savedLocale === "id") {
          locale = savedLocale;
        }
      } catch (e) {}

      let savedPreferences: Partial<CanvasPreferences> | undefined;
      try {
        const rawPrefs = localStorage.getItem(LOCAL_STORAGE_PREFERENCES_KEY);
        if (rawPrefs) {
          savedPreferences = JSON.parse(rawPrefs);
        }
      } catch (e) {}

      let projectData: {
        projectTitle?: string;
        currentProjectId?: string | null;
        nodes?: CircuitNode[];
        wires?: CircuitWire[];
      } = {};
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.wires)) {
            projectData = {
              projectTitle: parsed.metadata?.title || "My Circuit",
              currentProjectId: parsed.currentProjectId || parsed.metadata?.id || null,
              nodes: parsed.nodes,
              wires: parsed.wires,
            };
          }
        }
      } catch (e) {}

      const updates: Partial<CircuitStoreState> = {};
      if (theme) {
        updates.theme = theme;
        syncDocumentTheme(theme);
      }
      if (locale) updates.locale = locale;
      if (savedPreferences) {
        // Sanitize numbers in case legacy string values existed in localStorage
        const wireNumberSize = typeof savedPreferences.wireNumberSize === "number" ? savedPreferences.wireNumberSize : DEFAULT_CANVAS_PREFERENCES.wireNumberSize;
        const componentTagSize = typeof savedPreferences.componentTagSize === "number" ? savedPreferences.componentTagSize : DEFAULT_CANVAS_PREFERENCES.componentTagSize;
        const wireThickness = typeof savedPreferences.wireThickness === "number" ? savedPreferences.wireThickness : DEFAULT_CANVAS_PREFERENCES.wireThickness;
        updates.canvasPreferences = {
          ...DEFAULT_CANVAS_PREFERENCES,
          ...savedPreferences,
          wireNumberSize,
          componentTagSize,
          wireThickness,
        };
      }
      if (projectData.nodes && projectData.wires) {
        updates.nodes = projectData.nodes;
        updates.wires = projectData.wires;
        if (projectData.projectTitle) updates.projectTitle = projectData.projectTitle;
        if (projectData.currentProjectId) {
          updates.currentProjectId = projectData.currentProjectId;
          updates.isCloudSynced = true;
        }
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    },

    setProjectTitle: (title) => {
      set({ projectTitle: title, isCloudSynced: false });
      saveToLocalStorage(get());
    },
    setWireRoutingMode: (mode) => set({ wireRoutingMode: mode }),
    setTheme: (theme) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
      } catch (e) {}
      syncDocumentTheme(theme);

      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id) {
        UserPreferencesService.savePreferences(currentUser.id, get().canvasPreferences, theme);
      }

      set({ theme });
    },
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(LOCAL_STORAGE_THEME_KEY, next);
        } catch (e) {}
        syncDocumentTheme(next);

        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id) {
          UserPreferencesService.savePreferences(currentUser.id, state.canvasPreferences, next);
        }

        return { theme: next };
      }),
    setLocale: (locale) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, locale);
      } catch (e) {}
      set({ locale });
    },
    toggleLocale: () =>
      set((state) => {
        const next = state.locale === "en" ? "id" : "en";
        try {
          localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, next);
        } catch (e) {}
        return { locale: next };
      }),
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    togglePageView: () => set((state) => ({ pageViewEnabled: !state.pageViewEnabled })),
    setPageViewEnabled: (enabled: boolean) => set({ pageViewEnabled: enabled }),
    toggleWireLabels: () => set((state) => ({ showWireLabels: !state.showWireLabels })),

    renumberWires: () => {
      set((state) => {
        const history = pushHistory(state);
        const renumbered = WireNetResolver.renumberAll(state.wires, state.nodes);
        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: state.nodes, wires: renumbered });
        return {
          wires: renumbered,
          ...history,
        };
      });
    },

    updateWireLabel: (wireId, label) => {
      set((state) => {
        const wireIndex = state.wires.findIndex((w) => w.id === wireId);
        if (wireIndex === -1) return {};
        const history = pushHistory(state);
        const nextWires = [...state.wires];
        nextWires[wireIndex] = {
          ...nextWires[wireIndex],
          label: label && label.trim() ? label.trim() : null,
        };
        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: state.nodes, wires: nextWires });
        return {
          wires: nextWires,
          ...history,
        };
      });
    },

    bringToFront: (targetId) => {
      set((state) => {
        let changed = false;
        let nextWires = state.wires;
        let nextNodes = state.nodes;

        if (targetId !== undefined) {
          const wireIdx = state.wires.findIndex((w) => w.id === targetId);
          if (wireIdx !== -1 && wireIdx !== state.wires.length - 1) {
            nextWires = [
              ...state.wires.slice(0, wireIdx),
              ...state.wires.slice(wireIdx + 1),
              state.wires[wireIdx],
            ];
            changed = true;
          }

          const nodeIdx = state.nodes.findIndex((n) => n.id === targetId);
          if (nodeIdx !== -1 && nodeIdx !== state.nodes.length - 1) {
            nextNodes = [
              ...state.nodes.slice(0, nodeIdx),
              ...state.nodes.slice(nodeIdx + 1),
              state.nodes[nodeIdx],
            ];
            changed = true;
          }
        } else {
          if (state.selectedWireIds.size > 0) {
            const unselected = state.wires.filter((w) => !state.selectedWireIds.has(w.id));
            const selected = state.wires.filter((w) => state.selectedWireIds.has(w.id));
            if (selected.length > 0 && unselected.length > 0) {
              nextWires = [...unselected, ...selected];
              changed = true;
            }
          }
          if (state.selectedNodeIds.size > 0) {
            const unselected = state.nodes.filter((n) => !state.selectedNodeIds.has(n.id));
            const selected = state.nodes.filter((n) => state.selectedNodeIds.has(n.id));
            if (selected.length > 0 && unselected.length > 0) {
              nextNodes = [...unselected, ...selected];
              changed = true;
            }
          }
        }

        if (!changed) return {};

        const history = pushHistory(state);
        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: nextNodes, wires: nextWires });
        return {
          wires: nextWires,
          nodes: nextNodes,
          ...history,
        };
      });
    },

    sendToBack: (targetId) => {
      set((state) => {
        let changed = false;
        let nextWires = state.wires;
        let nextNodes = state.nodes;

        if (targetId !== undefined) {
          const wireIdx = state.wires.findIndex((w) => w.id === targetId);
          if (wireIdx > 0) {
            nextWires = [
              state.wires[wireIdx],
              ...state.wires.slice(0, wireIdx),
              ...state.wires.slice(wireIdx + 1),
            ];
            changed = true;
          }

          const nodeIdx = state.nodes.findIndex((n) => n.id === targetId);
          if (nodeIdx > 0) {
            nextNodes = [
              state.nodes[nodeIdx],
              ...state.nodes.slice(0, nodeIdx),
              ...state.nodes.slice(nodeIdx + 1),
            ];
            changed = true;
          }
        } else {
          if (state.selectedWireIds.size > 0) {
            const unselected = state.wires.filter((w) => !state.selectedWireIds.has(w.id));
            const selected = state.wires.filter((w) => state.selectedWireIds.has(w.id));
            if (selected.length > 0 && unselected.length > 0) {
              nextWires = [...selected, ...unselected];
              changed = true;
            }
          }
          if (state.selectedNodeIds.size > 0) {
            const unselected = state.nodes.filter((n) => !state.selectedNodeIds.has(n.id));
            const selected = state.nodes.filter((n) => state.selectedNodeIds.has(n.id));
            if (selected.length > 0 && unselected.length > 0) {
              nextNodes = [...selected, ...unselected];
              changed = true;
            }
          }
        }

        if (!changed) return {};

        const history = pushHistory(state);
        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: nextNodes, wires: nextWires });
        return {
          wires: nextWires,
          nodes: nextNodes,
          ...history,
        };
      });
    },

    loadProject: (project, format = "rflow") => {
      const resolvedProjectId = (project.metadata as any)?.id || null;
      set({
        projectTitle: project.metadata.title,
        currentProjectId: resolvedProjectId,
        isCloudSynced: Boolean(resolvedProjectId),
        fileFormat: format,
        nodes: project.nodes,
        wires: project.wires,
        selectedNodeIds: new Set(),
        selectedWireIds: new Set(),
        undoStack: [],
        redoStack: [],
        isSimulating: false,
        shortCircuit: false,
        shortCircuitMessage: null,
      });
      saveToLocalStorage({
        projectTitle: project.metadata.title,
        nodes: project.nodes,
        wires: project.wires,
        currentProjectId: resolvedProjectId,
      }, true);
    },

    resetCanvas: () => {
      set({
        projectTitle: "My Circuit",
        currentProjectId: null,
        isCloudSynced: false,
        nodes: [],
        wires: [],
        selectedNodeIds: new Set(),
        selectedWireIds: new Set(),
        undoStack: [],
        redoStack: [],
        isSimulating: false,
        shortCircuit: false,
      });
      saveToLocalStorage({ projectTitle: "My Circuit", nodes: [], wires: [], currentProjectId: null }, true);
    },

    autoLayout: () => {
      set((state) => {
        if (state.nodes.length === 0) return {};
        const history = pushHistory(state);
        const { nodes, wires } = AutoLayoutEngine.layout(state.nodes, state.wires);

        // If currently simulating, evaluate circuit with newly aligned positions
        if (state.isSimulating) {
          const simRes = SimulationEngine.step(nodes, wires);
          return {
            nodes: simRes.nodes,
            wires: simRes.wires,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
            ...history,
          };
        }

        saveToLocalStorage({ projectTitle: state.projectTitle, nodes, wires });
        return {
          nodes,
          wires,
          ...history,
        };
      });
    },

    selectNode: (id, multi = false) => {
      set((state) => {
        const next = multi ? new Set(state.selectedNodeIds) : new Set<string | number>();
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedNodeIds: next, selectedWireIds: multi ? state.selectedWireIds : new Set<string | number>() };
      });
    },

    selectWire: (id, multi = false) => {
      set((state) => {
        const next = multi ? new Set(state.selectedWireIds) : new Set<string | number>();
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedWireIds: next, selectedNodeIds: multi ? state.selectedNodeIds : new Set<string | number>() };
      });
    },

    clearSelection: () => set({ selectedNodeIds: new Set(), selectedWireIds: new Set() }),

    selectAll: () => {
      set((state) => ({
        selectedNodeIds: new Set(state.nodes.map((n) => n.id)),
        selectedWireIds: new Set(state.wires.map((w) => w.id)),
      }));
    },

    addNode: (componentId, position) => {
      set((state) => {
        const history = pushHistory(state);
        const comp = catalog[componentId];
        const newId = Date.now() + Math.floor(Math.random() * 1000);

        // Snap to 30px grid
        const snappedX = Math.round(position.x / 30) * 30;
        const snappedY = Math.round(position.y / 30) * 30;

        // Auto-increment tag index for this component type
        let nodeTag: string | null = null;
        if (comp?.tagType) {
          const prefix = `-${comp.tagType.toUpperCase().slice(0, 2)}`;
          let maxIndex = 0;
          for (const n of state.nodes) {
            if (n.tag && n.tag.startsWith(prefix)) {
              const m = n.tag.match(/(\d+)$/);
              if (m) {
                const num = parseInt(m[1], 10);
                if (num > maxIndex) maxIndex = num;
              }
            }
          }
          nodeTag = `${prefix}${maxIndex + 1}`;
        }

        const newNode: CircuitNode = {
          id: newId,
          componentId,
          name: comp?.name || componentId,
          category: comp?.category || "general",
          tag: nodeTag,
          comment: null,
          position: { x: snappedX, y: snappedY },
          rotation: 0,
          frameIndex: 0,
          tagVisibility: true,
          lampColor: componentId === "panelLamp" ? "green" : undefined,
          buttonColor:
            componentId === "panelButtonMomentary"
              ? "green"
              : componentId === "panelButtonLatching"
              ? "black"
              : undefined,
        };

        const nextRecents = [
          componentId,
          ...state.recentComponentIds.filter((id) => id !== componentId),
        ].slice(0, 10);

        return {
          nodes: [...state.nodes, newNode],
          selectedNodeIds: new Set([newId]),
          recentComponentIds: nextRecents,
          ...history,
        };
      });
    },

    updateNodeData: (nodeId, data, commitToHistory = true) => {
      set((state) => {
        const history = commitToHistory ? pushHistory(state) : {};
        const updatedNodes = state.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            tag: data.tag !== undefined ? data.tag : n.tag,
            comment: data.comment !== undefined ? data.comment : n.comment,
            valueTimeOn: data.valueTimeOn !== undefined ? data.valueTimeOn : n.valueTimeOn,
            valueTimeOff: data.valueTimeOff !== undefined ? data.valueTimeOff : n.valueTimeOff,
            lampColor: data.lampColor !== undefined ? data.lampColor : n.lampColor,
            buttonColor: data.buttonColor !== undefined ? data.buttonColor : n.buttonColor,
          };
        });
        return { nodes: updatedNodes, ...history };
      });
    },

    moveSelectedNodes: (delta) => {
      set((state) => {
        if (state.selectedNodeIds.size === 0) return {};
        const history = pushHistory(state);

        const updatedNodes = state.nodes.map((n) => {
          if (!state.selectedNodeIds.has(n.id)) return n;
          return {
            ...n,
            position: {
              x: Math.round((n.position.x + delta.x) / 30) * 30,
              y: Math.round((n.position.y + delta.y) / 30) * 30,
            },
          };
        });

        return { nodes: updatedNodes, ...history };
      });
    },

    updateNodesPositions: (updates, commitToHistory = false) => {
      set((state) => {
        const history = commitToHistory ? pushHistory(state) : {};
        const updateMap = new Map(updates.map((u) => [u.id, u.position]));
        let hasChanged = false;
        const updatedNodes = state.nodes.map((n) => {
          const newPos = updateMap.get(n.id);
          if (!newPos) return n;
          const targetX = Math.round(newPos.x / 30) * 30;
          const targetY = Math.round(newPos.y / 30) * 30;
          if (n.position.x === targetX && n.position.y === targetY) {
            return n;
          }
          hasChanged = true;
          return {
            ...n,
            position: {
              x: targetX,
              y: targetY,
            },
          };
        });

        if (!hasChanged && !commitToHistory) {
          return state;
        }

        if (commitToHistory) {
          saveToLocalStorage({ projectTitle: state.projectTitle, nodes: updatedNodes, wires: state.wires });
        }

        if (state.isSimulating) {
          const simRes = SimulationEngine.step(updatedNodes, state.wires);
          return {
            nodes: updatedNodes,
            wires: simRes.wires,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
            ...history,
          };
        }

        return { nodes: updatedNodes, wires: state.wires, ...history };
      });
    },

    rotateSelectedNodes: (direction = "cw") => {
      set((state) => {
        if (state.selectedNodeIds.size === 0) return {};
        const history = pushHistory(state);
        const delta = direction === "ccw" ? 3 : 1;

        const selectedNodes = state.nodes.filter((n) => state.selectedNodeIds.has(n.id));

        if (selectedNodes.length === 1) {
          // Single node: rotate in place
          const updatedNodes = state.nodes.map((n) => {
            if (!state.selectedNodeIds.has(n.id)) return n;
            const nextRot = ((n.rotation + delta) % 4) as Rotation;
            return { ...n, rotation: nextRot };
          });
          return { nodes: updatedNodes, ...history };
        }

        // Multi-node block rotation around collective bounding box center
        const minX = Math.min(...selectedNodes.map((n) => n.position.x));
        const maxX = Math.max(...selectedNodes.map((n) => n.position.x));
        const minY = Math.min(...selectedNodes.map((n) => n.position.y));
        const maxY = Math.max(...selectedNodes.map((n) => n.position.y));

        const centerX = Math.round((minX + maxX) / 2 / 30) * 30;
        const centerY = Math.round((minY + maxY) / 2 / 30) * 30;

        const updatedNodes = state.nodes.map((n) => {
          if (!state.selectedNodeIds.has(n.id)) return n;
          const nextRot = ((n.rotation + delta) % 4) as Rotation;

          // Rotate position vector around (centerX, centerY)
          const rx = n.position.x - centerX;
          const ry = n.position.y - centerY;

          let newX: number;
          let newY: number;

          if (direction === "ccw") {
            // 90 deg CCW: (x, y) -> (y, -x)
            newX = centerX + ry;
            newY = centerY - rx;
          } else {
            // 90 deg CW: (x, y) -> (-y, x)
            newX = centerX - ry;
            newY = centerY + rx;
          }

          return {
            ...n,
            position: {
              x: Math.round(newX / 30) * 30,
              y: Math.round(newY / 30) * 30,
            },
            rotation: nextRot,
          };
        });

        return { nodes: updatedNodes, ...history };
      });
    },

    rotateNode: (nodeId, direction = "cw") => {
      set((state) => {
        const history = pushHistory(state);
        const delta = direction === "ccw" ? 3 : 1;

        const updatedNodes = state.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const nextRot = ((n.rotation + delta) % 4) as Rotation;
          return { ...n, rotation: nextRot };
        });

        return { nodes: updatedNodes, ...history };
      });
    },

    deleteSelection: () => {
      set((state) => {
        if (state.selectedNodeIds.size === 0 && state.selectedWireIds.size === 0) return {};
        const history = pushHistory(state);

        // Check if any deleted node was a junctionDot and heal split wires back together
        const healedWires: CircuitWire[] = [];
        for (const nodeId of state.selectedNodeIds) {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node && node.componentId === "junctionDot") {
            const connectedWires = state.wires.filter(
              (w) => w.fromNodeId === nodeId || w.toNodeId === nodeId
            );
            const wIn = connectedWires.find((w) => w.toNodeId === nodeId && w.toPortId === 0);
            const wOut = connectedWires.find((w) => w.fromNodeId === nodeId && w.fromPortId === 1);
            if (wIn && wOut && wIn.fromNodeId !== nodeId && wOut.toNodeId !== nodeId) {
              healedWires.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                fromNodeId: wIn.fromNodeId,
                fromPortId: wIn.fromPortId,
                toNodeId: wOut.toNodeId,
                toPortId: wOut.toPortId,
                margins: { start: wIn.margins?.start || 0, center: 0, end: wOut.margins?.end || 0 },
              });
            }
          }
        }

        // Filter out selected nodes
        const remainingNodes = state.nodes.filter((n) => !state.selectedNodeIds.has(n.id));

        // Filter out selected wires AND wires connected to deleted nodes OR tapped to deleted wires
        const remainingWires = state.wires.filter(
          (w) =>
            !state.selectedWireIds.has(w.id) &&
            !state.selectedNodeIds.has(w.fromNodeId) &&
            !state.selectedNodeIds.has(w.toNodeId) &&
            (!w.toWireId || !state.selectedWireIds.has(w.toWireId))
        );

        remainingWires.push(...healedWires);

        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: remainingNodes, wires: remainingWires });

        return {
          nodes: remainingNodes,
          wires: remainingWires,
          selectedNodeIds: new Set(),
          selectedWireIds: new Set(),
          ...history,
        };
      });
    },

    deleteNode: (nodeId) => {
      set((state) => {
        const history = pushHistory(state);

        const healedWires: CircuitWire[] = [];
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node && node.componentId === "junctionDot") {
          const connectedWires = state.wires.filter(
            (w) => w.fromNodeId === nodeId || w.toNodeId === nodeId
          );
          const wIn = connectedWires.find((w) => w.toNodeId === nodeId && w.toPortId === 0);
          const wOut = connectedWires.find((w) => w.fromNodeId === nodeId && w.fromPortId === 1);
          if (wIn && wOut && wIn.fromNodeId !== nodeId && wOut.toNodeId !== nodeId) {
            healedWires.push({
              id: Date.now() + Math.floor(Math.random() * 1000),
              fromNodeId: wIn.fromNodeId,
              fromPortId: wIn.fromPortId,
              toNodeId: wOut.toNodeId,
              toPortId: wOut.toPortId,
              margins: { start: wIn.margins?.start || 0, center: 0, end: wOut.margins?.end || 0 },
            });
          }
        }

        const remainingNodes = state.nodes.filter((n) => n.id !== nodeId);
        const remainingWires = state.wires.filter(
          (w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId
        );
        const remainingWireIds = new Set(remainingWires.map((w) => w.id));
        const finalWires = remainingWires.filter((w) => !w.toWireId || remainingWireIds.has(w.toWireId));
        finalWires.push(...healedWires);

        const nextSelected = new Set(state.selectedNodeIds);
        nextSelected.delete(nodeId);

        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: remainingNodes, wires: finalWires });

        return {
          nodes: remainingNodes,
          wires: finalWires,
          selectedNodeIds: nextSelected,
          ...history,
        };
      });
    },

    deleteWire: (wireId) => {
      set((state) => {
        const history = pushHistory(state);
        const remainingWires = state.wires.filter((w) => w.id !== wireId);
        const nextSelectedWires = new Set(state.selectedWireIds);
        nextSelectedWires.delete(wireId);

        return {
          wires: remainingWires,
          selectedWireIds: nextSelectedWires,
          ...history,
        };
      });
    },

    duplicateSelection: () => {
      set((state) => {
        if (state.selectedNodeIds.size === 0) return {};
        const history = pushHistory(state);

        const idMap = new Map<string | number, number>();
        const tagMap = new Map<string, string>();

        // Build smart tag increment mapping for all tags in the selection
        for (const node of state.nodes) {
          if (state.selectedNodeIds.has(node.id) && node.tag && !tagMap.has(node.tag)) {
            const nextTag = getNextTag(node.tag, state.nodes);
            if (nextTag) tagMap.set(node.tag, nextTag);
          }
        }

        const newNodes: CircuitNode[] = [];

        // Clone nodes with +30px offset and smart tag increment
        for (const node of state.nodes) {
          if (state.selectedNodeIds.has(node.id)) {
            const newId = Date.now() + Math.floor(Math.random() * 10000);
            idMap.set(node.id, newId);

            newNodes.push({
              ...node,
              id: newId,
              tag: node.tag ? (tagMap.get(node.tag) || node.tag) : null,
              position: { x: node.position.x + 30, y: node.position.y + 30 },
            });
          }
        }

        // Clone wires that connect between duplicated nodes
        const newWires: CircuitWire[] = [];
        for (const wire of state.wires) {
          if (idMap.has(wire.fromNodeId) && idMap.has(wire.toNodeId)) {
            newWires.push({
              ...wire,
              id: Date.now() + Math.floor(Math.random() * 10000),
              fromNodeId: idMap.get(wire.fromNodeId)!,
              toNodeId: idMap.get(wire.toNodeId)!,
            });
          }
        }

        return {
          nodes: [...state.nodes, ...newNodes],
          wires: [...state.wires, ...newWires],
          selectedNodeIds: new Set(newNodes.map((n) => n.id)),
          ...history,
        };
      });
    },

    copySelection: () => {
      const state = get();
      if (state.selectedNodeIds.size === 0) return;
      const selectedNodes = state.nodes.filter((n) => state.selectedNodeIds.has(n.id));
      const selectedIds = new Set(selectedNodes.map((n) => n.id));
      const selectedWires = state.wires.filter(
        (w) => selectedIds.has(w.fromNodeId) && selectedIds.has(w.toNodeId)
      );

      const clipboardData = {
        nodes: selectedNodes.map((n) => ({ ...n })),
        wires: selectedWires.map((w) => ({ ...w })),
      };

      set({ clipboard: clipboardData });
    },

    pasteSelection: (targetPos) => {
      set((state) => {
        if (!state.clipboard || state.clipboard.nodes.length === 0) return {};
        const history = pushHistory(state);

        let deltaX = 30;
        let deltaY = 30;

        if (targetPos && state.clipboard.nodes.length > 0) {
          const avgX =
            state.clipboard.nodes.reduce((acc, n) => acc + n.position.x, 0) /
            state.clipboard.nodes.length;
          const avgY =
            state.clipboard.nodes.reduce((acc, n) => acc + n.position.y, 0) /
            state.clipboard.nodes.length;

          deltaX = Math.round((targetPos.x - avgX) / 30) * 30;
          deltaY = Math.round((targetPos.y - avgY) / 30) * 30;

          if (deltaX === 0 && deltaY === 0) {
            deltaX = 30;
            deltaY = 30;
          }
        }

        const tagMap = new Map<string, string>();
        for (const node of state.clipboard.nodes) {
          if (node.tag && !tagMap.has(node.tag)) {
            const nextTag = getNextTag(node.tag, state.nodes);
            if (nextTag) tagMap.set(node.tag, nextTag);
          }
        }

        const idMap = new Map<string | number, number>();
        const newNodes: CircuitNode[] = state.clipboard.nodes.map((node, index) => {
          const newId = Date.now() + index + Math.floor(Math.random() * 10000);
          idMap.set(node.id, newId);
          return {
            ...node,
            id: newId,
            tag: node.tag ? (tagMap.get(node.tag) || node.tag) : null,
            position: {
              x: Math.round((node.position.x + deltaX) / 30) * 30,
              y: Math.round((node.position.y + deltaY) / 30) * 30,
            },
          };
        });

        const newWires: CircuitWire[] = state.clipboard.wires
          .filter((w) => idMap.has(w.fromNodeId) && idMap.has(w.toNodeId))
          .map((wire, index) => ({
            ...wire,
            id: Date.now() + 20000 + index + Math.floor(Math.random() * 10000),
            fromNodeId: idMap.get(wire.fromNodeId)!,
            toNodeId: idMap.get(wire.toNodeId)!,
          }));

        return {
          nodes: [...state.nodes, ...newNodes],
          wires: [...state.wires, ...newWires],
          selectedNodeIds: new Set(newNodes.map((n) => n.id)),
          selectedWireIds: new Set(),
          ...history,
        };
      });
    },

    startWireDraft: (nodeId, portId, startPos) => {
      set({
        wireDraft: {
          fromNodeId: nodeId,
          fromPortId: portId,
          startPos,
          currentMousePos: startPos,
        },
      });
    },

    updateWireDraft: (mousePos) => {
      set((state) => {
        if (!state.wireDraft) return {};
        return {
          wireDraft: {
            ...state.wireDraft,
            currentMousePos: mousePos,
          },
        };
      });
    },

    completeWireDraft: (toNodeId, toPortId) => {
      set((state) => {
        if (!state.wireDraft) return {};
        if (state.wireDraft.fromNodeId === toNodeId && state.wireDraft.fromPortId === toPortId) {
          return { wireDraft: null };
        }

        // Avoid duplicate wire between same two ports
        const exists = state.wires.some(
          (w) =>
            (w.fromNodeId === state.wireDraft!.fromNodeId &&
              w.fromPortId === state.wireDraft!.fromPortId &&
              w.toNodeId === toNodeId &&
              w.toPortId === toPortId) ||
            (w.fromNodeId === toNodeId &&
              w.fromPortId === toPortId &&
              w.toNodeId === state.wireDraft!.fromNodeId &&
              w.toPortId === state.wireDraft!.fromPortId)
        );

        if (exists) {
          return { wireDraft: null };
        }

        const history = pushHistory(state);
        let newWire: CircuitWire = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          fromNodeId: state.wireDraft.fromNodeId,
          fromPortId: state.wireDraft.fromPortId,
          toNodeId,
          toPortId,
          margins: { start: 0, center: 0, end: 0 },
        };

        // Auto-assign net number using Mazhab 2 Gap Recycling
        const candidateWires = [...state.wires, newWire];
        const nets = WireNetResolver.resolveWireNets(candidateWires, state.nodes);
        const assignedNet = nets.get(newWire.id);
        if (assignedNet) {
          newWire = { ...newWire, label: assignedNet.label };
        }

        const nextWires = [...state.wires, newWire];
        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: state.nodes, wires: nextWires });

        return {
          wires: nextWires,
          wireDraft: null,
          ...history,
        };
      });
    },

    cancelWireDraft: () => set({ wireDraft: null }),

    toggleComponentState: (nodeId) => {
      set((state) => {
        const targetNode = state.nodes.find((n) => n.id === nodeId);
        if (!targetNode) return {};

        const targetComp = catalog[targetNode.componentId];
        const isTargetOverload =
          targetNode.componentId.toLowerCase().startsWith("overload") ||
          targetComp?.name?.toLowerCase().includes("overload");

        const nextFrame = targetNode.frameIndex === 0 ? 1 : 0;

        const updatedNodes = state.nodes.map((n) => {
          if (n.id === nodeId) {
            const isNC = n.componentId.includes("NC") || targetComp?.type === "contactNC";
            const isClosed = isNC ? nextFrame === 0 : nextFrame === 1;
            return { ...n, frameIndex: nextFrame, isClosed };
          }

          // If target is a panel switch/button or circuit switch, couple by tag
          const isTargetPanel = targetNode.componentId.startsWith("panelButton");
          if (targetNode.tag && n.tag === targetNode.tag) {
            const nComp = catalog[n.componentId];
            if (isTargetPanel) {
              const isSwitchOrContact =
                nComp?.type === "switch" ||
                nComp?.type === "button" ||
                nComp?.type === "relayContact" ||
                n.componentId.toLowerCase().startsWith("switch") ||
                n.componentId.toLowerCase().startsWith("button") ||
                n.componentId.toLowerCase().includes("contact");
              if (isSwitchOrContact) {
                const isNC = n.componentId.includes("NC") || nComp?.type === "contactNC";
                const isClosed = isNC ? nextFrame === 0 : nextFrame === 1;
                return { ...n, frameIndex: nextFrame, isClosed };
              }
            } else if (n.componentId.startsWith("panelButton")) {
              // Target is a circuit switch, update matching panel switch
              return { ...n, frameIndex: nextFrame };
            }
          }

          // If target is an overload relay (TOR), couple auxiliary contacts sharing the same tag
          if (isTargetOverload && targetNode.tag && n.tag === targetNode.tag) {
            const nComp = catalog[n.componentId];
            const isContact =
              nComp?.type === "relayContact" ||
              nComp?.category === "auxiliaries" ||
              n.componentId.toLowerCase().includes("contact");
            if (isContact) {
              const contactNC = n.componentId.includes("NC") || nComp?.type === "contactNC";
              const contactClosed = contactNC ? nextFrame === 0 : nextFrame === 1;
              return { ...n, frameIndex: nextFrame, isClosed: contactClosed };
            }
          }

          return n;
        });

        // If simulation is running, evaluate step immediately
        if (state.isSimulating) {
          const simRes = SimulationEngine.step(updatedNodes, state.wires);
          return {
            nodes: simRes.nodes,
            wires: simRes.wires,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
          };
        }

        return { nodes: updatedNodes };
      });
    },

    setComponentPressed: (nodeId, pressed) => {
      set((state) => {
        const targetNode = state.nodes.find((n) => n.id === nodeId);
        const isTargetPanel = targetNode?.componentId.startsWith("panelButton");

        const updatedNodes = state.nodes.map((n) => {
          const isTarget = n.id === nodeId;
          const isCoupledByTag =
            targetNode?.tag &&
            n.tag === targetNode.tag &&
            (isTargetPanel || n.componentId.startsWith("panelButton"));

          if (!isTarget && !isCoupledByTag) return n;

          const comp = catalog[n.componentId];
          const isNC = n.componentId.includes("NC") || comp?.type === "contactNC";
          const nextFrame = pressed ? 1 : 0;
          const isClosed = isNC ? !pressed : pressed;
          return {
            ...n,
            frameIndex: nextFrame,
            isClosed,
            isPressed: pressed,
          };
        });

        if (state.isSimulating) {
          const simRes = SimulationEngine.step(updatedNodes, state.wires);
          return {
            nodes: simRes.nodes,
            wires: simRes.wires,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
          };
        }

        return { nodes: updatedNodes };
      });
    },

    startSimulation: () => {
      const state = get();
      const simRes = SimulationEngine.step(state.nodes, state.wires);
      set({
        isSimulating: !simRes.shortCircuit,
        nodes: simRes.nodes,
        wires: simRes.wires,
        shortCircuit: simRes.shortCircuit,
        shortCircuitMessage: simRes.shortCircuitMessage || null,
      });
    },

    stopSimulation: () => {
      set((state) => {
        // Reset hot wires and energized components
        const resetNodes = state.nodes.map((n) => ({
          ...n,
          isEnergized: false,
          timerElapsed: 0,
          motorDirection: "off" as const,
          frameIndex: n.componentId.includes("NC") ? 0 : 0,
        }));
        const resetWires = state.wires.map((w) => ({
          ...w,
          potential: null,
          isHot: false,
        }));
        return {
          isSimulating: false,
          shortCircuit: false,
          shortCircuitMessage: null,
          nodes: resetNodes,
          wires: resetWires,
        };
      });
    },

    tickTimerSimulation: (deltaSeconds: number) => {
      set((state) => {
        if (!state.isSimulating) return {};

        let hasTimerChange = false;
        const updatedNodes = state.nodes.map((node) => {
          const comp = catalog[node.componentId];
          const isTimerCoil =
            node.componentId.includes("Delay") ||
            comp?.tagType === "timerCoils" ||
            comp?.timerType !== undefined;

          if (!isTimerCoil) return node;

          const tType = comp?.timerType || (node.componentId.includes("DelayOn") ? "delayOn" : "delayOff");
          const preset = (tType === "delayOn" ? node.valueTimeOn : node.valueTimeOff) ?? 3;
          let elapsed = node.timerElapsed ?? 0;

          if (node.isEnergized) {
            if (elapsed < preset) {
              elapsed = Math.min(preset, elapsed + deltaSeconds);
              hasTimerChange = true;
            }
          } else {
            // De-energized
            if (tType === "delayOff") {
              if (elapsed > 0) {
                elapsed = Math.max(0, elapsed - deltaSeconds);
                hasTimerChange = true;
              }
            } else {
              // DelayOn resets immediately when de-energized
              if (elapsed > 0) {
                elapsed = 0;
                hasTimerChange = true;
              }
            }
          }

          if (elapsed !== node.timerElapsed) {
            return { ...node, timerElapsed: elapsed };
          }
          return node;
        });

        if (hasTimerChange) {
          const simRes = SimulationEngine.step(updatedNodes, state.wires);
          return {
            nodes: simRes.nodes,
            wires: simRes.wires,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
          };
        }

        return {};
      });
    },

    splitWireAtJunction: (wireId, clickPoint, startDraft = false) => {
      set((state) => {
        const wireToSplit = state.wires.find((w) => w.id === wireId);
        if (!wireToSplit) return {};

        const history = pushHistory(state);
        const snappedX = Math.round(clickPoint.x / 30) * 30;
        const snappedY = Math.round(clickPoint.y / 30) * 30;

        const junctionId = Date.now() + Math.floor(Math.random() * 1000);
        const junctionNode: CircuitNode = {
          id: junctionId,
          componentId: "junctionDot",
          name: "Connection Point",
          category: "others",
          tag: null,
          comment: null,
          position: { x: snappedX, y: snappedY },
          rotation: 0,
          frameIndex: 0,
          tagVisibility: false,
        };

        // Wire 1: from wireToSplit.fromNode -> junction (port 0)
        const wire1: CircuitWire = {
          id: Date.now() + 1,
          fromNodeId: wireToSplit.fromNodeId,
          fromPortId: wireToSplit.fromPortId,
          toNodeId: junctionId,
          toPortId: 0,
          margins: { start: wireToSplit.margins?.start || 0, center: 0, end: 0 },
        };

        // Wire 2: from junction (port 1) -> wireToSplit.toNode
        const wire2: CircuitWire = {
          id: Date.now() + 2,
          fromNodeId: junctionId,
          fromPortId: 1,
          toNodeId: wireToSplit.toNodeId,
          toPortId: wireToSplit.toPortId,
          margins: { start: 0, center: 0, end: wireToSplit.margins?.end || 0 },
        };

        const newWires = state.wires.filter((w) => w.id !== wireId);
        let nextWireDraft = state.wireDraft;

        if (state.wireDraft) {
          const branchWire: CircuitWire = {
            id: Date.now() + 3,
            fromNodeId: state.wireDraft.fromNodeId,
            fromPortId: state.wireDraft.fromPortId,
            toNodeId: junctionId,
            toPortId: 2,
            margins: { start: 0, center: 0, end: 0 },
          };
          newWires.push(wire1, wire2, branchWire);
          nextWireDraft = null;
        } else if (startDraft) {
          newWires.push(wire1, wire2);
          nextWireDraft = {
            fromNodeId: junctionId,
            fromPortId: 2,
            startPos: { x: snappedX, y: snappedY },
            currentMousePos: { x: snappedX, y: snappedY },
          };
        } else {
          newWires.push(wire1, wire2);
        }

        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: [...state.nodes, junctionNode], wires: newWires });

        if (state.isSimulating) {
          const simRes = SimulationEngine.step([...state.nodes, junctionNode], newWires);
          return {
            nodes: simRes.nodes,
            wires: simRes.wires,
            wireDraft: nextWireDraft,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
            ...history,
          };
        }

        return {
          nodes: [...state.nodes, junctionNode],
          wires: newWires,
          wireDraft: nextWireDraft,
          ...history,
        };
      });
    },

    connectWireToWire: (targetWireId, tapPoint) => {
      set((state) => {
        if (!state.wireDraft) return {};
        const targetWire = state.wires.find((w) => w.id === targetWireId);
        if (!targetWire) return {};

        const { fromNodeId, fromPortId } = state.wireDraft;

        // Prevent connecting wire to itself or same terminal
        if (
          (targetWire.fromNodeId === fromNodeId && targetWire.fromPortId === fromPortId) ||
          (targetWire.toNodeId === fromNodeId && targetWire.toPortId === fromPortId)
        ) {
          return { wireDraft: null };
        }

        const history = pushHistory(state);
        const snappedX = Math.round(tapPoint.x / 30) * 30;
        const snappedY = Math.round(tapPoint.y / 30) * 30;

        let branchWire: CircuitWire = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          fromNodeId,
          fromPortId,
          toNodeId: targetWire.fromNodeId,
          toPortId: targetWire.fromPortId,
          toWireId: targetWire.id,
          tapPoint: { x: snappedX, y: snappedY },
          margins: { start: 0, center: 0, end: 0 },
        };

        // Branch wires inherit the net label of the tapped wire or resolved net
        const candidateWires = [...state.wires, branchWire];
        const nets = WireNetResolver.resolveWireNets(candidateWires, state.nodes);
        const assignedNet = nets.get(branchWire.id);
        if (assignedNet) {
          branchWire = { ...branchWire, label: assignedNet.label };
        }

        const newWires = [...state.wires, branchWire];
        saveToLocalStorage({ projectTitle: state.projectTitle, nodes: state.nodes, wires: newWires });

        if (state.isSimulating) {
          const simRes = SimulationEngine.step(state.nodes, newWires);
          return {
            wires: simRes.wires,
            wireDraft: null,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
            ...history,
          };
        }

        return {
          wires: newWires,
          wireDraft: null,
          ...history,
        };
      });
    },

    updateWireMargins: (wireId, margins, commit = true) => {
      set((state) => {
        const wireIndex = state.wires.findIndex((w) => w.id === wireId);
        if (wireIndex === -1) return {};

        let history = {};
        if (commit) {
          history = pushHistory(state);
        }

        const nextWires = [...state.wires];
        nextWires[wireIndex] = {
          ...nextWires[wireIndex],
          margins: { ...nextWires[wireIndex].margins, ...margins },
        };

        if (commit) {
          saveToLocalStorage({ projectTitle: state.projectTitle, nodes: state.nodes, wires: nextWires });
        }

        return {
          wires: nextWires,
          ...history,
        };
      });
    },

    updateWireTapPoint: (wireId, tapPoint, commit = true) => {
      set((state) => {
        const wireIndex = state.wires.findIndex((w) => w.id === wireId);
        if (wireIndex === -1) return {};

        let history = {};
        if (commit) {
          history = pushHistory(state);
        }

        const nextWires = [...state.wires];
        nextWires[wireIndex] = {
          ...nextWires[wireIndex],
          tapPoint: {
            x: Math.round(tapPoint.x / 30) * 30,
            y: Math.round(tapPoint.y / 30) * 30,
          },
        };

        if (commit) {
          saveToLocalStorage({ projectTitle: state.projectTitle, nodes: state.nodes, wires: nextWires });
        }

        if (state.isSimulating) {
          const simRes = SimulationEngine.step(state.nodes, nextWires);
          return {
            nodes: simRes.nodes,
            wires: simRes.wires,
            isSimulating: !simRes.shortCircuit,
            shortCircuit: simRes.shortCircuit,
            shortCircuitMessage: simRes.shortCircuitMessage || null,
            ...history,
          };
        }

        return {
          wires: nextWires,
          ...history,
        };
      });
    },

    stepSimulation: () => {
      const state = get();
      const simRes = SimulationEngine.step(state.nodes, state.wires);
      set({
        nodes: simRes.nodes,
        wires: simRes.wires,
        shortCircuit: simRes.shortCircuit,
        shortCircuitMessage: simRes.shortCircuitMessage || null,
      });
    },

    undo: () => {
      set((state) => {
        if (state.undoStack.length === 0) return {};
        const previous = state.undoStack[state.undoStack.length - 1];
        const newUndo = state.undoStack.slice(0, -1);
        const currentSnapshot: HistorySnapshot = {
          nodes: state.nodes.map((n) => ({ ...n })),
          wires: state.wires.map((w) => ({ ...w })),
        };
        return {
          nodes: previous.nodes,
          wires: previous.wires,
          undoStack: newUndo,
          redoStack: [currentSnapshot, ...state.redoStack],
          isCloudSynced: false,
        };
      });
    },

    redo: () => {
      set((state) => {
        if (state.redoStack.length === 0) return {};
        const next = state.redoStack[0];
        const newRedo = state.redoStack.slice(1);
        const currentSnapshot: HistorySnapshot = {
          nodes: state.nodes.map((n) => ({ ...n })),
          wires: state.wires.map((w) => ({ ...w })),
        };
        return {
          nodes: next.nodes,
          wires: next.wires,
          undoStack: [...state.undoStack, currentSnapshot],
          redoStack: newRedo,
          isCloudSynced: false,
        };
      });
    },
  };
});

// Subscribe to store mutations to trigger debounced autosave
useCircuitStore.subscribe((state, prevState) => {
  if (state.nodes !== prevState.nodes || state.wires !== prevState.wires || state.projectTitle !== prevState.projectTitle) {
    saveToLocalStorage({
      projectTitle: state.projectTitle,
      nodes: state.nodes,
      wires: state.wires,
    });
  }
});
