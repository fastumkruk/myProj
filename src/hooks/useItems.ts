import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { enqueueOfflineOp, subscribeOfflineApplied } from "@/lib/offlineQueue";
import { isLikelyOfflineError, isOfflineNow } from "@/lib/offlineUtils";
import { getCachedItems, setCachedItems } from "@/lib/localCache";
import type { ShoppingItem } from "@/types/models";
import { useToastStore } from "@/stores/toastStore";

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
  setItemPrice: (itemId: string, price: number | null) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  refetch: () => Promise<void>;
};

export function useItems(
  listId: string | null,
  opts?: {
    userId?: string;
    onRemoteChange?: () => void;
  },
): State {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = opts?.userId;
  const onRemoteChange = opts?.onRemoteChange;
  const pushToast = useToastStore((s) => s.push);

  const makeLocalId = useMemo(() => {
    return () => `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }, []);

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
        if (isLikelyOfflineError(error.message)) {
          setItems(getCachedItems(listId));
        }
        return;
      }
      const next = (data ?? []) as ShoppingItem[];
      setItems(next);
      setCachedItems(listId, next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setItems(getCachedItems(listId));
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    if (!listId) return;
    const cached = getCachedItems(listId);
    if (cached.length) setItems(cached);
  }, [listId]);

  useEffect(() => {
    if (!listId) return;
    setCachedItems(listId, items);
  }, [listId, items]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!supabase || !listId) return;
    const intervalId = window.setInterval(() => {
      if (!navigator.onLine) return;
      void refetch();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [listId, refetch]);

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

          if (userId && next?.updated_by && next.updated_by !== userId) {
            onRemoteChange?.();
          }
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [listId, userId, onRemoteChange]);

  useEffect(() => {
    if (!listId) return;
    return subscribeOfflineApplied((e) => {
      const r: any = e.result;
      if (!r || r.kind !== "items.add") return;
      if (r.listId !== listId) return;
      const tempId: string = r.tempId;
      const serverId: string = r.serverId;
      if (!tempId || !serverId) return;
      setItems((current) => current.map((i) => (i.id === tempId ? { ...i, id: serverId } : i)));
    });
  }, [listId]);

  const addItem = useCallback(
    async (title: string) => {
      if (!supabase || !listId) return null;
      setError(null);
      const position = items.filter((i) => !i.is_checked).length;
      const now = new Date().toISOString();
      if (isOfflineNow()) {
        const tempId = makeLocalId();
        const row: ShoppingItem = {
          id: tempId,
          list_id: listId,
          title: title.trim(),
          position,
          is_checked: false,
          price: null,
          updated_by: userId ?? null,
          created_at: now,
          updated_at: now,
        };
        setItems((current) => sortItems([...current, row]));
        enqueueOfflineOp("items.add", {
          tempId,
          listId,
          title: title.trim(),
          position,
          price: null,
          updatedAt: now,
          updatedBy: userId ?? null,
        });
        pushToast("Офлайн: добавил в очередь синхронизации");
        return row;
      }
      const { data, error } = await supabase
        .from("items")
        .insert({ list_id: listId, title: title.trim(), position, updated_at: now, updated_by: userId ?? null })
        .select("*")
        .single();

      if (error) {
        if (isLikelyOfflineError(error.message)) {
          const tempId = makeLocalId();
          const row: ShoppingItem = {
            id: tempId,
            list_id: listId,
            title: title.trim(),
            position,
            is_checked: false,
            price: null,
            updated_by: userId ?? null,
            created_at: now,
            updated_at: now,
          };
          setItems((current) => sortItems([...current, row]));
          enqueueOfflineOp("items.add", {
            tempId,
            listId,
            title: title.trim(),
            position,
            price: null,
            updatedAt: now,
            updatedBy: userId ?? null,
          });
          pushToast("Офлайн: добавил в очередь синхронизации");
          return row;
        }
        setError(error.message);
        return null;
      }

      const row = data as ShoppingItem;
      setItems((current) => sortItems([...current, row]));
      return row;
    },
    [listId, items, userId],
  );

  const setItemPrice = useCallback(
    async (itemId: string, price: number | null) => {
      if (!supabase || !listId) return;
      setError(null);
      const now = new Date().toISOString();
      setItems((current) =>
        current.map((i) =>
          i.id === itemId ? { ...i, price: price ?? null, updated_at: now, updated_by: userId ?? null } : i,
        ),
      );
      const { error } = await supabase
        .from("items")
        .update({ price: price ?? null, updated_at: now, updated_by: userId ?? null })
        .eq("id", itemId);
      if (error) {
        if (error.message.toLowerCase().includes("price") && error.message.toLowerCase().includes("does not exist")) {
          pushToast("Нужно добавить колонку price в Supabase (миграция)");
          setError(error.message);
          await refetch();
          return;
        }
        if (isLikelyOfflineError(error.message)) {
          enqueueOfflineOp("items.setPrice", {
            itemId,
            price: price ?? null,
            updatedAt: now,
            updatedBy: userId ?? null,
          });
          pushToast("Офлайн: сумму сохраню позже");
          return;
        }
        setError(error.message);
        await refetch();
      }
    },
    [listId, refetch, userId, pushToast],
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
      const { error } = await supabase
        .from("items")
        .update({ is_checked: isChecked, updated_at: now, updated_by: userId ?? null })
        .eq("id", itemId);
      if (error) {
        if (isLikelyOfflineError(error.message)) {
          enqueueOfflineOp("items.toggle", {
            itemId,
            isChecked,
            updatedAt: now,
            updatedBy: userId ?? null,
          });
          pushToast("Офлайн: сохраню изменение позже");
          return;
        }
        setError(error.message);
        await refetch();
      }
    },
    [listId, refetch, userId],
  );

  const renameItem = useCallback(
    async (itemId: string, title: string) => {
      if (!supabase || !listId) return;
      setError(null);
      const now = new Date().toISOString();
      setItems((current) =>
        current.map((i) => (i.id === itemId ? { ...i, title: title.trim(), updated_at: now, updated_by: userId ?? null } : i)),
      );
      const { error } = await supabase
        .from("items")
        .update({ title: title.trim(), updated_at: now, updated_by: userId ?? null })
        .eq("id", itemId);
      if (error) {
        if (isLikelyOfflineError(error.message)) {
          enqueueOfflineOp("items.rename", {
            itemId,
            title: title.trim(),
            updatedAt: now,
            updatedBy: userId ?? null,
          });
          pushToast("Офлайн: сохраню изменение позже");
          return;
        }
        setError(error.message);
        await refetch();
      }
    },
    [listId, userId, refetch],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!supabase || !listId) return;
      setError(null);
      setItems((current) => current.filter((i) => i.id !== itemId));
      const { error } = await supabase.from("items").delete().eq("id", itemId);
      if (error) {
        if (isLikelyOfflineError(error.message)) {
          enqueueOfflineOp("items.delete", { itemId });
          pushToast("Офлайн: удаление в очереди");
          return;
        }
        setError(error.message);
        await refetch();
      }
    },
    [listId, refetch],
  );

  const clearChecked = useCallback(async () => {
    if (!supabase || !listId) return;
    setError(null);
    setItems((current) => current.filter((i) => !i.is_checked));
    const { error } = await supabase.from("items").delete().eq("list_id", listId).eq("is_checked", true);
    if (error) {
      if (isLikelyOfflineError(error.message)) {
        enqueueOfflineOp("items.clearChecked", { listId });
        pushToast("Офлайн: очистка купленных в очереди");
        return;
      }
      setError(error.message);
      await refetch();
    }
  }, [listId, refetch, pushToast]);

  return {
    items,
    isLoading,
    error,
    addItem,
    toggleItem,
    renameItem,
    setItemPrice,
    deleteItem,
    clearChecked,
    refetch,
  };
}
