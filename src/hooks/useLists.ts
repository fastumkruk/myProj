import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { enqueueOfflineOp } from "@/lib/offlineQueue";
import { isLikelyOfflineError, isOfflineNow } from "@/lib/offlineUtils";
import type { ShoppingList } from "@/types/models";
import { useToastStore } from "@/stores/toastStore";

type State = {
  lists: ShoppingList[];
  isLoading: boolean;
  error: string | null;
  createList: (title: string) => Promise<ShoppingList | null>;
  renameList: (listId: string, title: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useLists(
  householdId: string | null,
  opts?: {
    onRemoteChange?: () => void;
  },
): State {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLocalMutationAt = useRef<number>(0);
  const onRemoteChange = opts?.onRemoteChange;
  const pushToast = useToastStore((s) => s.push);

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
    const intervalId = window.setInterval(() => {
      if (!navigator.onLine) return;
      void refetch();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [householdId, refetch]);

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

          if (onRemoteChange && Date.now() - lastLocalMutationAt.current > 1500) {
            onRemoteChange();
          }
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [householdId, onRemoteChange]);

  const createList = useCallback(
    async (title: string) => {
      if (!supabase || !householdId) return null;
      setError(null);
      lastLocalMutationAt.current = Date.now();
      const now = new Date().toISOString();
      if (isOfflineNow()) {
        setError("Офлайн: создание списка недоступно без сети");
        pushToast("Офлайн: список можно создать только при сети");
        return null;
      }
      const { data, error } = await supabase
        .from("lists")
        .insert({ household_id: householdId, title: title.trim(), updated_at: now })
        .select("*")
        .single();

      if (error) {
        if (isLikelyOfflineError(error.message)) {
          setError("Офлайн: создание списка недоступно без сети");
          pushToast("Офлайн: список можно создать только при сети");
          return null;
        }
        setError(error.message);
        return null;
      }

      const row = data as ShoppingList;
      setLists((current) => [row, ...current]);
      return row;
    },
    [householdId, pushToast],
  );

  const renameList = useCallback(
    async (listId: string, title: string) => {
      if (!supabase || !householdId) return;
      setError(null);
      lastLocalMutationAt.current = Date.now();
      const now = new Date().toISOString();
      setLists((current) => current.map((l) => (l.id === listId ? { ...l, title: title.trim(), updated_at: now } : l)));
      const { error } = await supabase.from("lists").update({ title: title.trim(), updated_at: now }).eq("id", listId);
      if (error) {
        if (isLikelyOfflineError(error.message)) {
          enqueueOfflineOp("lists.rename", { listId, title: title.trim(), updatedAt: now });
          pushToast("Офлайн: переименование в очереди");
          return;
        }
        setError(error.message);
        await refetch();
      }
    },
    [householdId, pushToast, refetch],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      if (!supabase || !householdId) return;
      setError(null);
      lastLocalMutationAt.current = Date.now();
      setLists((current) => current.filter((l) => l.id !== listId));
      const { error } = await supabase.from("lists").delete().eq("id", listId);
      if (error) {
        if (isLikelyOfflineError(error.message)) {
          enqueueOfflineOp("lists.delete", { listId });
          pushToast("Офлайн: удаление списка в очереди");
          return;
        }
        setError(error.message);
        await refetch();
      }
    },
    [householdId, pushToast, refetch],
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
