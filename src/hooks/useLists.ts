import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ShoppingList } from "@/types/models";

type State = {
  lists: ShoppingList[];
  isLoading: boolean;
  error: string | null;
  createList: (title: string) => Promise<ShoppingList | null>;
  renameList: (listId: string, title: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useLists(householdId: string | null): State {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!supabase || !householdId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("household_id", householdId)
        .order("updated_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }
      setLists((data ?? []) as ShoppingList[]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!supabase || !householdId) return;

    const channel = supabase
      .channel(`lists:${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const next = payload.new as ShoppingList | undefined;
          const prev = payload.old as ShoppingList | undefined;

          setLists((current) => {
            if (payload.eventType === "DELETE") {
              return current.filter((l) => l.id !== prev?.id);
            }

            if (!next) return current;
            const without = current.filter((l) => l.id !== next.id);
            return [next, ...without].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [householdId]);

  const createList = useCallback(
    async (title: string) => {
      if (!supabase || !householdId) return null;
      setError(null);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("lists")
        .insert({ household_id: householdId, title: title.trim(), updated_at: now })
        .select("*")
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      const row = data as ShoppingList;
      setLists((current) => [row, ...current]);
      return row;
    },
    [householdId],
  );

  const renameList = useCallback(
    async (listId: string, title: string) => {
      if (!supabase || !householdId) return;
      setError(null);
      const now = new Date().toISOString();
      const { error } = await supabase.from("lists").update({ title: title.trim(), updated_at: now }).eq("id", listId);
      if (error) setError(error.message);
    },
    [householdId],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      if (!supabase || !householdId) return;
      setError(null);
      const { error } = await supabase.from("lists").delete().eq("id", listId);
      if (error) setError(error.message);
    },
    [householdId],
  );

  return {
    lists,
    isLoading,
    error,
    createList,
    renameList,
    deleteList,
    refetch,
  };
}
