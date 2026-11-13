import { supabase } from "@/lib/supabase";
import { CanvasPreferences, DEFAULT_CANVAS_PREFERENCES } from "@/store/useCircuitStore";

export interface UserVisualPreferences {
  canvasPreferences: CanvasPreferences;
  theme?: "dark" | "light";
  updated_at?: string;
}

const LOCAL_STORAGE_USER_PREFS_KEY = "relayflow_user_preferences";
let syncTimeout: any = null;

export const UserPreferencesService = {
  /**
   * Load user visual preferences from Supabase (relayflow.user_preferences)
   * Falls back to localStorage or default if offline/not configured/not found.
   */
  async loadPreferences(userId: string): Promise<UserVisualPreferences | null> {
    if (!supabase) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_USER_PREFS_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .schema("relayflow")
        .from("user_preferences")
        .select("preferences, updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.warn("[UserPreferencesService] Error fetching preferences:", error.message);
        return null;
      }

      if (!data || !data.preferences) {
        return null;
      }

      const prefs = data.preferences as any;
      const canvasPreferences: CanvasPreferences = {
        ...DEFAULT_CANVAS_PREFERENCES,
        ...(prefs.canvasPreferences || prefs),
      };

      const result: UserVisualPreferences = {
        canvasPreferences,
        theme: prefs.theme === "light" || prefs.theme === "dark" ? prefs.theme : undefined,
        updated_at: data.updated_at,
      };

      // Cache locally
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_USER_PREFS_KEY, JSON.stringify(result));
        } catch (e) {}
      }

      return result;
    } catch (err) {
      console.warn("[UserPreferencesService] Failed to load preferences:", err);
      return null;
    }
  },

  /**
   * Save user visual preferences to Supabase (relayflow.user_preferences)
   * Debounced by default to prevent spamming DB on slider / stepper adjustments.
   */
  savePreferences(
    userId: string,
    canvasPreferences: CanvasPreferences,
    theme?: "dark" | "light",
    immediate = false
  ): void {
    const payload = {
      canvasPreferences,
      ...(theme ? { theme } : {}),
    };

    // Cache to localStorage immediately
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_USER_PREFS_KEY,
          JSON.stringify({
            ...payload,
            updated_at: new Date().toISOString(),
          })
        );
      } catch (e) {}
    }

    if (!supabase) return;
    const client = supabase;

    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }

    const performSync = async () => {
      try {
        const { error } = await client
          .schema("relayflow")
          .from("user_preferences")
          .upsert(
            {
              user_id: userId,
              preferences: payload,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.warn("[UserPreferencesService] Error saving preferences to DB:", error.message);
        }
      } catch (err) {
        console.warn("[UserPreferencesService] Failed to save preferences:", err);
      }
    };

    if (immediate) {
      performSync();
    } else {
      syncTimeout = setTimeout(performSync, 600);
    }
  },
};
