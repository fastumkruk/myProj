import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { enqueueOfflineOp } from "@/lib/offlineQueue";
import { isLikelyOfflineError, isOfflineNow } from "@/lib/offlineUtils";
import { getCachedLists, setCachedLists, migrateItemsCache } from "@/lib/localCache";
import type { ShoppingList } from "@/types/models";
import { useToastStore } from "@/stores/toastStore";
import { subscribeOfflineApplied, setOfflineIdMap } from "@/lib/offlineQueue";

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
        if (isLikelyOfflineError(error.message)) {
          setLists(getCachedLists(householdId));
        }
        return;
      }
      const next = (data ?? []) as ShoppingList[];
      setLists(next);
      setCachedLists(householdId, next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setLists(getCachedLists(householdId));
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    const cached = getCachedLists(householdId);
    if (cached.length) setLists(cached);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;
    setCachedLists(householdId, lists);
  }, [householdId, lists]);

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
        const tempId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const row: ShoppingList = {
          id: tempId,
          household_id: householdId,
          title: title.trim(),
          created_at: now,
          updated_at: now,
        };
        setLists((current) => [row, ...current]);
        enqueueOfflineOp("lists.create", {
          tempId,
          householdId,
          title: title.trim(),
          createdAt: now,
          updatedAt: now,
        });
        pushToast("Офлайн: список добавлен в очередь синхронизации");
        return row;
      }
      const { data, error } = await supabase
        .from("lists")
        .insert({ household_id: householdId, title: title.trim(), updated_at: now })
        .select("*")
        .single();

      if (error) {
        if (isLikelyOfflineError(error.message)) {
          const tempId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          const row: ShoppingList = {
            id: tempId,
            household_id: householdId,
            title: title.trim(),
            created_at: now,
            updated_at: now,
          };
          setLists((current) => [row, ...current]);
          enqueueOfflineOp("lists.create", {
            tempId,
            householdId,
            title: title.trim(),
            createdAt: now,
            updatedAt: now,
          });
          pushToast("Офлайн: список добавлен в очередь синхронизации");
          return row;
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

  useEffect(() => {
    if (!householdId) return;
    return subscribeOfflineApplied((e) => {
      const r: any = e.result;
      if (!r || r.kind !== "lists.create") return;
      if (r.householdId !== householdId) return;
      const tempId: string = r.tempId;
      const serverId: string = r.serverId;
      if (!tempId || !serverId) return;
      setOfflineIdMap(tempId, serverId);
      setLists((current) => current.map((l) => (l.id === tempId ? { ...l, id: serverId } : l)));
      migrateItemsCache(tempId, serverId);
    });
  }, [householdId]);

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
