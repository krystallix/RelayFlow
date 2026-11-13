import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UserPreferencesService } from "@/lib/userPreferencesService";
import { useCircuitStore } from "./useCircuitStore";

export interface CloudProjectMeta {
  id: string;
  title: string;
  ownerId?: string;
  isPublic: boolean;
  nodeCount: number;
  wireCount: number;
  updatedAt: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;

  // Actions
  initAuth: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: "google" | "github" | "apple") => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const LOCAL_STORAGE_MOCK_USER = "relayflow_mock_user";

let isAuthInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured,
  error: null,

  initAuth: async () => {
    if (isAuthInitialized) return;
    isAuthInitialized = true;
    set({ isLoading: true, error: null });

    if (!supabase) {
      // Demo / Mock storage fallback if Supabase env is not configured yet
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_MOCK_USER);
          if (raw) {
            const parsed = JSON.parse(raw);
            set({ user: parsed, isLoading: false });
            return;
          }
        } catch (e) {}
      }
      set({ user: null, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const initialUser = data.session?.user ?? null;
      set({
        session: data.session,
        user: initialUser,
        isLoading: false,
      });

      if (initialUser?.id) {
        UserPreferencesService.loadPreferences(initialUser.id).then((saved) => {
          if (saved) {
            if (saved.canvasPreferences) {
              useCircuitStore.getState().updateCanvasPreferences(saved.canvasPreferences);
            }
            if (saved.theme) {
              useCircuitStore.getState().setTheme(saved.theme);
            }
          }
        });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        const nextUser = session?.user ?? null;
        set({
          session,
          user: nextUser,
          isLoading: false,
        });

        if (nextUser?.id) {
          UserPreferencesService.loadPreferences(nextUser.id).then((saved) => {
            if (saved) {
              if (saved.canvasPreferences) {
                useCircuitStore.getState().updateCanvasPreferences(saved.canvasPreferences);
              }
              if (saved.theme) {
                useCircuitStore.getState().setTheme(saved.theme);
              }
            }
          });
        }
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to initialize auth", isLoading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    if (!supabase) {
      // Mock login for UI testing when Supabase env is not set
      const mockUser: any = {
        id: "usr_mock_" + Math.random().toString(36).slice(2, 9),
        email,
        user_metadata: { full_name: email.split("@")[0] },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_MOCK_USER, JSON.stringify(mockUser));
      }
      set({ user: mockUser, isLoading: false });
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "Failed to sign in";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    if (!supabase) {
      const mockUser: any = {
        id: "usr_mock_" + Math.random().toString(36).slice(2, 9),
        email,
        user_metadata: { full_name: email.split("@")[0] },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_MOCK_USER, JSON.stringify(mockUser));
      }
      set({ user: mockUser, isLoading: false });
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "Failed to sign up";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  signInWithOAuth: async (provider: "google" | "github" | "apple") => {
    set({ isLoading: true, error: null });

    if (!supabase) {
      const mockUser: any = {
        id: `usr_${provider}_` + Math.random().toString(36).slice(2, 9),
        email: `engineer@${provider}.local`,
        user_metadata: {
          full_name: provider === "github" ? "GitHub Engineer" : provider === "apple" ? "Apple User" : "Google Engineer",
          avatar_url: "",
        },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_MOCK_USER, JSON.stringify(mockUser));
      }
      set({ user: mockUser, isLoading: false });
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      const msg = err.message || `Failed to sign in with ${provider}`;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  resetPasswordForEmail: async (email: string) => {
    set({ isLoading: true, error: null });

    if (!supabase) {
      await new Promise((res) => setTimeout(res, 600));
      set({ isLoading: false });
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}` : undefined,
      });
      if (error) throw error;
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "Failed to send reset link";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    if (!supabase) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_STORAGE_MOCK_USER);
      }
      set({ user: null, session: null, isLoading: false });
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {}
    set({ user: null, session: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
