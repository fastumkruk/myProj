import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ShoppingItem } from "@/types/models";

function sortItems(next: ShoppingItem[]) {
  return next.sort((a, b) => {
    if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
    if (a.position !== b.position) return a.position - b.position;
    return a.updated_at < b.updated_at ? 1 : -1;
  });
}

type State = {
  items: ShoppingItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (title: string) => Promise<ShoppingItem | null>;
  toggleItem: (itemId: string, isChecked: boolean) => Promise<void>;
  renameItem: (itemId: string, title: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  refetch: () => Promise<void>;
};

export function useItems(listId: string | null): State {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!supabase || !listId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", listId)
        .order("is_checked", { ascending: true })
        .order("position", { ascending: true })
        .order("updated_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }
      setItems((data ?? []) as ShoppingItem[]);
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!supabase || !listId) return;

    const channel = supabase
      .channel(`items:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          const next = payload.new as ShoppingItem | undefined;
          const prev = payload.old as ShoppingItem | undefined;

          setItems((current) => {
            if (payload.eventType === "DELETE") {
              return current.filter((i) => i.id !== prev?.id);
            }
            if (!next) return current;
            const without = current.filter((i) => i.id !== next.id);
            const merged = [...without, next];
            return merged.sort((a, b) => {
              if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
              if (a.position !== b.position) return a.position - b.position;
              return a.updated_at < b.updated_at ? 1 : -1;
            });
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [listId]);

  const addItem = useCallback(
    async (title: string) => {
      if (!supabase || !listId) return null;
      setError(null);
      const position = items.filter((i) => !i.is_checked).length;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("items")
        .insert({ list_id: listId, title: title.trim(), position, updated_at: now })
        .select("*")
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      const row = data as ShoppingItem;
      setItems((current) => [...current, row]);
      return row;
    },
    [listId, items],
  );

  const toggleItem = useCallback(
    async (itemId: string, isChecked: boolean) => {
      if (!supabase || !listId) return;
      setError(null);
      const now = new Date().toISOString();
      setItems((current) => {
        const next = current.map((i) => (i.id === itemId ? { ...i, is_checked: isChecked, updated_at: now } : i));
        return sortItems(next);
      });
      const { error } = await supabase.from("items").update({ is_checked: isChecked, updated_at: now }).eq("id", itemId);
      if (error) {
        setError(error.message);
        await refetch();
      }
    },
    [listId, refetch],
  );

  const renameItem = useCallback(
    async (itemId: string, title: string) => {
      if (!supabase || !listId) return;
      setError(null);
      const now = new Date().toISOString();
      const { error } = await supabase.from("items").update({ title: title.trim(), updated_at: now }).eq("id", itemId);
      if (error) setError(error.message);
    },
    [listId],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!supabase || !listId) return;
      setError(null);
      const { error } = await supabase.from("items").delete().eq("id", itemId);
      if (error) setError(error.message);
    },
    [listId],
  );

  const clearChecked = useCallback(async () => {
    if (!supabase || !listId) return;
    setError(null);
    const { error } = await supabase.from("items").delete().eq("list_id", listId).eq("is_checked", true);
    if (error) setError(error.message);
  }, [listId]);

  return {
    items,
    isLoading,
    error,
    addItem,
    toggleItem,
    renameItem,
    deleteItem,
    clearChecked,
    refetch,
  };
}
