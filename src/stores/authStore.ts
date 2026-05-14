import type { User, Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type AuthStatus = "idle" | "loading" | "ready";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  householdId: string | null;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshHouseholdId: () => Promise<void>;
};

function householdCacheKey(userId: string) {
  return `auth_household_v1_${userId}`;
}

function loadSupabaseSessionFromStorage(): Session | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!k.startsWith("sb-")) continue;
      if (!k.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") continue;
      const session = parsed as Session;
      if (!session.access_token || !session.user) continue;
      return session;
    }
  } catch {
    return null;
  }
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  user: null,
  session: null,
  householdId: null,
  error: null,
  init: async () => {
    if (!supabase) {
      set({ status: "ready" });
      return;
    }

    if (get().status !== "idle") return;
    set({ status: "loading", error: null });

    try {
      const cachedSession = loadSupabaseSessionFromStorage();
      if (cachedSession) {
        set({ session: cachedSession, user: cachedSession.user });
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        set({ session: data.session, user: data.session.user ?? null });
      } else if (cachedSession) {
        set({ session: cachedSession, user: cachedSession.user });
      } else {
        set({ session: null, user: null });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
        void get().refreshHouseholdId();
      });

      await get().refreshHouseholdId();
    } catch (e) {
      const cachedSession = loadSupabaseSessionFromStorage();
      if (cachedSession) {
        set({ session: cachedSession, user: cachedSession.user });
        await get().refreshHouseholdId();
      }
      const msg = e instanceof Error ? e.message : String(e);
      set({ error: msg });
    } finally {
      set({ status: "ready" });
    }
  },
  signIn: async (email, password) => {
    if (!supabase) return;
    set({ error: null });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) set({ error: error.message });
  },
  signUp: async (email, password) => {
    if (!supabase) return;
    set({ error: null });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) set({ error: error.message });
  },
  signOut: async () => {
    if (!supabase) return;
    set({ error: null, householdId: null });
    const { error } = await supabase.auth.signOut();
    if (error) set({ error: error.message });
    const userId = get().user?.id;
    if (userId) localStorage.removeItem(householdCacheKey(userId));
  },
  refreshHouseholdId: async () => {
    if (!supabase) return;
    const user = get().user;
    if (!user) {
      set({ householdId: null });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        const cached = localStorage.getItem(householdCacheKey(user.id));
        set({ householdId: cached ?? null, error: error.message });
        return;
      }

      const householdId = data?.household_id ?? null;
      set({ householdId, error: null });
      if (householdId) localStorage.setItem(householdCacheKey(user.id), householdId);
    } catch (e) {
      const cached = localStorage.getItem(householdCacheKey(user.id));
      set({ householdId: cached ?? null, error: e instanceof Error ? e.message : String(e) });
    }
  },
}));
