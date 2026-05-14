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

    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      void get().refreshHouseholdId();
    });

    await get().refreshHouseholdId();
    set({ status: "ready" });
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
  },
  refreshHouseholdId: async () => {
    if (!supabase) return;
    const user = get().user;
    if (!user) {
      set({ householdId: null });
      return;
    }

    const { data, error } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      set({ householdId: null, error: error.message });
      return;
    }

    set({ householdId: data?.household_id ?? null });
  },
}));

