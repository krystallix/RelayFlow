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
});
