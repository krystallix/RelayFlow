import { describe, it, expect, beforeEach } from "vitest";
import { ProjectsService } from "@/lib/projectsService";
import { useAuthStore } from "@/store/useAuthStore";
import { useCircuitStore } from "@/store/useCircuitStore";

describe("Cloud Persistence & ProjectsService", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    ProjectsService._resetMockStorage();
  });

  it("saves a new project and retrieves it by id", async () => {
    const mockNodes: any = [
      { id: "n1", componentId: "sourcePlus", position: { x: 100, y: 100 } },
    ];
    const mockWires: any = [];

    const saved = await ProjectsService.saveProject(
      "user_123",
      "Direct On Line Motor",
      mockNodes,
      mockWires
    );

    expect(saved.id).toBeDefined();
    expect(saved.title).toBe("Direct On Line Motor");
    expect(saved.owner_id).toBe("user_123");
    expect(saved.node_count).toBe(1);

    const fetched = await ProjectsService.getProjectById(saved.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe("Direct On Line Motor");
    expect(fetched?.data.nodes.length).toBe(1);
  });

  it("lists projects belonging to a user", async () => {
    await ProjectsService.saveProject("user_abc", "Project 1", [], []);
    await ProjectsService.saveProject("user_abc", "Project 2", [], []);
    await ProjectsService.saveProject("user_xyz", "Other User Project", [], []);

    const userProjects = await ProjectsService.listUserProjects("user_abc");
    expect(userProjects.length).toBe(2);
    expect(userProjects.map((p) => p.title)).toContain("Project 1");
    expect(userProjects.map((p) => p.title)).toContain("Project 2");
  });

  it("deletes a project by id", async () => {
    const saved = await ProjectsService.saveProject("user_abc", "To Delete", [], []);
    const deleted = await ProjectsService.deleteProject(saved.id);
    expect(deleted).toBe(true);

    const fetched = await ProjectsService.getProjectById(saved.id);
    expect(fetched).toBeNull();
  });

  it("overwrites existing project record on save instead of creating duplicates", async () => {
    const testUserId = "user_overwrite_test";

    // 1. Initial save
    const firstSave = await ProjectsService.saveProject(
      testUserId,
      "Conveyor Belt Circuit",
      [{ id: "n1", componentId: "sourcePlus", position: { x: 0, y: 0 } }] as any,
      []
    );
    expect(firstSave.id).toBeDefined();

    // 2. Second save with existingId: must OVERWRITE the same record
    const secondSave = await ProjectsService.saveProject(
      testUserId,
      "Conveyor Belt Circuit",
      [
        { id: "n1", componentId: "sourcePlus", position: { x: 0, y: 0 } },
        { id: "n2", componentId: "lamp", position: { x: 100, y: 0 } },
      ] as any,
      [],
      firstSave.id
    );
    expect(secondSave.id).toBe(firstSave.id);

    // Verify there is only 1 project in the database, not 2!
    const userProjects = await ProjectsService.listUserProjects(testUserId);
    expect(userProjects.length).toBe(1);
    expect(userProjects[0].id).toBe(firstSave.id);
    expect(userProjects[0].node_count).toBe(2);

    // 3. Third save without existingId but with matching title: must OVERWRITE the existing project!
    const thirdSave = await ProjectsService.saveProject(
      testUserId,
      "Conveyor Belt Circuit",
      [
        { id: "n1", componentId: "sourcePlus", position: { x: 0, y: 0 } },
        { id: "n2", componentId: "lamp", position: { x: 100, y: 0 } },
        { id: "n3", componentId: "switchNO", position: { x: 200, y: 0 } },
      ] as any,
      [],
      null
    );
    expect(thirdSave.id).toBe(firstSave.id);

    const finalProjects = await ProjectsService.listUserProjects(testUserId);
    expect(finalProjects.length).toBe(1);
    expect(finalProjects[0].node_count).toBe(3);
  });

  it("persists and hydrates currentProjectId across local storage sessions", async () => {
    const store = useCircuitStore.getState();
    store.resetCanvas();
    expect(useCircuitStore.getState().currentProjectId).toBeNull();

    // Set cloud project id
    store.setCloudProjectId("c_project_xyz");
    expect(useCircuitStore.getState().currentProjectId).toBe("c_project_xyz");

    // Re-hydrate (simulate page refresh)
    store.hydrateFromLocalStorage();
    expect(useCircuitStore.getState().currentProjectId).toBe("c_project_xyz");
  });
});

describe("Authentication Store (useAuthStore)", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("signs in with email and sets user session", async () => {
    const store = useAuthStore.getState();
    const result = await store.signInWithEmail("engineer@relayflow.app", "secretPass123");

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("engineer@relayflow.app");

    await store.signOut();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("signs in with OAuth mock fallback (GitHub / Google)", async () => {
    const store = useAuthStore.getState();
    const resGithub = await store.signInWithOAuth("github");
    expect(resGithub.success).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("engineer@github.local");

    const resGoogle = await store.signInWithOAuth("google");
    expect(resGoogle.success).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("engineer@google.local");
  });
});

describe("Viewer Mode State & Forking (useCircuitStore)", () => {
  it("manages viewer mode and cloud synchronization state", () => {
    const store = useCircuitStore.getState();

    store.setIsReadOnlyViewer(true);
    expect(useCircuitStore.getState().isReadOnlyViewer).toBe(true);

    store.setCloudProjectId("c_shared99");
    expect(useCircuitStore.getState().currentProjectId).toBe("c_shared99");

    store.setIsCloudSynced(true);
    expect(useCircuitStore.getState().isCloudSynced).toBe(true);

    // Forking resets read-only viewer and cloud ID to allow editing a new copy
    store.setIsReadOnlyViewer(false);
    store.setCloudProjectId(null);
    store.setIsCloudSynced(false);

    expect(useCircuitStore.getState().isReadOnlyViewer).toBe(false);
    expect(useCircuitStore.getState().currentProjectId).toBeNull();
    expect(useCircuitStore.getState().isCloudSynced).toBe(false);
  });

  it("marks isCloudSynced as false when node mutations or project renaming occurs", () => {
    const store = useCircuitStore.getState();
    store.setIsCloudSynced(true);
    expect(useCircuitStore.getState().isCloudSynced).toBe(true);

    // 1. Adding a node sets isCloudSynced to false
    store.addNode("lamp", { x: 100, y: 100 });
    expect(useCircuitStore.getState().isCloudSynced).toBe(false);

    // 2. Renaming project sets isCloudSynced to false
    store.setIsCloudSynced(true);
    expect(useCircuitStore.getState().isCloudSynced).toBe(true);
    store.setProjectTitle("New Title");
    expect(useCircuitStore.getState().isCloudSynced).toBe(false);
  });

  it("persists grid view settings in per-user canvasPreferences and resets to defaults", () => {
    const store = useCircuitStore.getState();
    expect(store.canvasPreferences.showGrid).toBe(true);
    expect(store.canvasPreferences.showMajorGrid).toBe(true);
    expect(store.canvasPreferences.showSubGrid).toBe(true);

    store.toggleGrid();
    store.toggleMajorGrid();
    store.toggleSubGrid();

    const updated = useCircuitStore.getState().canvasPreferences;
    expect(updated.showGrid).toBe(false);
    expect(updated.showMajorGrid).toBe(false);
    expect(updated.showSubGrid).toBe(false);

    store.resetCanvasPreferences();
    const reset = useCircuitStore.getState().canvasPreferences;
    expect(reset.showGrid).toBe(true);
    expect(reset.showMajorGrid).toBe(true);
    expect(reset.showSubGrid).toBe(true);
  });

  it("persists blueNeutralWires in per-user canvasPreferences and resets to default", () => {
    const store = useCircuitStore.getState();
    expect(store.canvasPreferences.blueNeutralWires).toBe(true);

    store.updateCanvasPreferences({ blueNeutralWires: false });
    expect(useCircuitStore.getState().canvasPreferences.blueNeutralWires).toBe(false);

    store.resetCanvasPreferences();
    expect(useCircuitStore.getState().canvasPreferences.blueNeutralWires).toBe(true);
  });

  it("supports multiple sheets per project with isolated nodes, undo stacks, rename, duplicate, and delete", () => {
    const store = useCircuitStore.getState();
    store.resetCanvas();

    const initialSheetId = useCircuitStore.getState().activeSheetId;
    expect(useCircuitStore.getState().sheets).toHaveLength(1);

    // Add node on Sheet 1
    store.addNode("lamp", { x: 90, y: 90 });
    expect(useCircuitStore.getState().nodes).toHaveLength(1);
    expect(useCircuitStore.getState().undoStack).toHaveLength(1);

    // Add Sheet 2 (empty canvas, isolated undoStack)
    store.addSheet("Power Circuit");
    const sheet2Id = useCircuitStore.getState().activeSheetId;
    expect(sheet2Id).not.toBe(initialSheetId);
    expect(useCircuitStore.getState().sheets).toHaveLength(2);
    expect(useCircuitStore.getState().nodes).toHaveLength(0);
    expect(useCircuitStore.getState().undoStack).toHaveLength(0);

    // Add 2 nodes on Sheet 2 and rename it
    store.addNode("switchNO", { x: 120, y: 120 });
    store.addNode("coil", { x: 180, y: 180 });
    store.renameSheet(sheet2Id, "Control Logic");
    expect(useCircuitStore.getState().sheets.find((s) => s.id === sheet2Id)?.name).toBe("Control Logic");

    // Switch back to Sheet 1 — its 1 node and 1 undoStack entry are preserved
    store.switchSheet(initialSheetId);
    expect(useCircuitStore.getState().activeSheetId).toBe(initialSheetId);
    expect(useCircuitStore.getState().nodes).toHaveLength(1);
    expect(useCircuitStore.getState().undoStack).toHaveLength(1);

    // Duplicate Sheet 1
    store.duplicateSheet(initialSheetId);
    expect(useCircuitStore.getState().sheets).toHaveLength(3);
    expect(useCircuitStore.getState().nodes).toHaveLength(1);

    // Delete duplicated sheet & Sheet 2, verify cannot delete the last remaining sheet
    const dupId = useCircuitStore.getState().activeSheetId;
    store.deleteSheet(dupId);
    expect(useCircuitStore.getState().sheets).toHaveLength(2);
    store.deleteSheet(sheet2Id);
    expect(useCircuitStore.getState().sheets).toHaveLength(1);
    store.deleteSheet(initialSheetId);
    expect(useCircuitStore.getState().sheets).toHaveLength(1);
  });

  it("blocks selection, copy/paste, duplicate, and mutations when isReadOnlyViewer is true", () => {
    const store = useCircuitStore.getState();
    store.setIsReadOnlyViewer(false);
    store.resetCanvas();

    store.addNode("lamp", { x: 90, y: 90 });
    store.addNode("coil", { x: 180, y: 90 });
    const [n1, n2] = useCircuitStore.getState().nodes;
    expect(useCircuitStore.getState().nodes).toHaveLength(2);

    // Select and copy before entering viewer mode
    store.selectNode(n1.id, false);
    store.copySelection();
    expect(useCircuitStore.getState().selectedNodeIds.size).toBe(1);
    expect(useCircuitStore.getState().clipboard?.nodes.length).toBe(1);

    // Enter Read-Only Viewer Mode — must immediately clear selection and clipboard
    store.setCurrentProjectOwnerId("owner_123");
    store.setIsReadOnlyViewer(true);
    expect(useCircuitStore.getState().currentProjectOwnerId).toBe("owner_123");
    expect(useCircuitStore.getState().selectedNodeIds.size).toBe(0);
    expect(useCircuitStore.getState().selectedWireIds.size).toBe(0);
    expect(useCircuitStore.getState().clipboard).toBeNull();

    // All selection, clipboard, and mutation actions must be no-ops
    store.selectNode(n1.id, false);
    expect(useCircuitStore.getState().selectedNodeIds.size).toBe(0);

    store.selectAll();
    expect(useCircuitStore.getState().selectedNodeIds.size).toBe(0);

    store.copySelection();
    expect(useCircuitStore.getState().clipboard).toBeNull();

    store.pasteSelection();
    expect(useCircuitStore.getState().nodes).toHaveLength(2);

    store.duplicateSelection();
    expect(useCircuitStore.getState().nodes).toHaveLength(2);

    store.addNode("switchNO", { x: 270, y: 90 });
    expect(useCircuitStore.getState().nodes).toHaveLength(2);

    store.rotateNode(n1.id, "cw");
    expect(useCircuitStore.getState().nodes.find((n) => n.id === n1.id)?.rotation).toBe(0);

    store.flipNode(n2.id, "x");
    expect(useCircuitStore.getState().nodes.find((n) => n.id === n2.id)?.flipX).toBeUndefined();

    store.deleteSelection();
    expect(useCircuitStore.getState().nodes).toHaveLength(2);

    // Clean up viewer mode for subsequent tests
    store.setIsReadOnlyViewer(false);
    store.setCurrentProjectOwnerId(null);
  });
});
