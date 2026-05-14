import { ArrowLeft, Eraser, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Autocomplete from "@/components/Autocomplete";
import AppShell from "@/components/AppShell";
import ItemRow from "@/components/ItemRow";
import OnlineStatusPill from "@/components/OnlineStatusPill";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { useItems } from "@/hooks/useItems";
import { addToItemHistory, getItemSuggestions } from "@/lib/itemHistory";
import { subscribeOfflineApplied } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";

export default function ListDetails() {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const toast = useToastStore((s) => s.push);
  const lastRemoteAt = useRef<number>(0);

  const onRemoteChange = () => {
    const now = Date.now();
    if (now - lastRemoteAt.current < 1500) return;
    lastRemoteAt.current = now;
    toast("Список обновился");
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Список покупок", { body: "Список обновился" });
      } catch (e) {
        void e;
      }
    }
  };

  const { items, isLoading, error, addItem, toggleItem, renameItem, setItemPrice, deleteItem, clearChecked, refetch } = useItems(
    listId ?? null,
    { userId, onRemoteChange },
  );

  const [listTitle, setListTitle] = useState<string>("Список");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemQty, setNewItemQty] = useState<string>("1");
  const [isBusy, setIsBusy] = useState(false);

  const counts = useMemo(() => {
    const total = items.length;
    const checked = items.filter((i) => i.is_checked).length;
    return { total, checked };
  }, [items]);

  useEffect(() => {
    const run = async () => {
      if (!supabase || !listId) return;
      try {
        const { data } = await supabase.from("lists").select("title").eq("id", listId).maybeSingle();
        if (data?.title) setListTitle(data.title);
      } catch {
        void 0;
      }
    };
    void run();
  }, [listId]);

  useEffect(() => {
    if (!listId) return;
    return subscribeOfflineApplied((e) => {
      const r: any = e.result;
      if (!r || r.kind !== "lists.create") return;
      if (r.tempId !== listId) return;
      const serverId: string = r.serverId;
      if (!serverId) return;
      toast("Список синхронизирован");
      navigate(`/lists/${serverId}`, { replace: true });
    });
  }, [listId, navigate, toast]);

  const canAdd = useMemo(() => newItemTitle.trim().length >= 1, [newItemTitle]);
  const suggestions = useMemo(() => getItemSuggestions(newItemTitle), [newItemTitle]);

  const onAdd = async () => {
    if (!canAdd || isBusy) return;
    setIsBusy(true);
    try {
      const qty = Number(String(newItemQty).replace(",", "."));
      const title = newItemTitle.trim();
      const finalTitle = Number.isFinite(qty) && qty > 0 && qty !== 1 ? `${title} ×${qty}` : title;
      await addItem(finalTitle);
      addToItemHistory(finalTitle);
      setNewItemTitle("");
      setNewItemQty("1");
    } finally {
      setIsBusy(false);
    }
  };

  const onRename = async (itemId: string, currentTitle: string) => {
    const title = window.prompt("Название товара", currentTitle);
    if (!title) return;
    await renameItem(itemId, title);
  };

  const onDelete = async (itemId: string) => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;
    await deleteItem(itemId);
  };

  const onPrice = async (itemId: string, current: number | null | undefined) => {
    const raw = window.prompt("Сколько нужно на товар? (руб)", current == null ? "" : String(current));
    if (raw == null) return;
    const nextRaw = raw.trim();
    if (!nextRaw) {
      await setItemPrice(itemId, null);
      return;
    }
    const value = Number(nextRaw.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      toast("Некорректная сумма");
      return;
    }
    await setItemPrice(itemId, value);
  };

  const onClearChecked = async () => {
    const ok = window.confirm("Очистить купленное?");
    if (!ok) return;
    await clearChecked();
  };

  const groups = useMemo(() => {
    const unchecked = items.filter((i) => !i.is_checked);
    const checked = items.filter((i) => i.is_checked);
    return { unchecked, checked };
  }, [items]);

  return (
    <ProtectedRoute requireHousehold>
      <AppShell
        title={listTitle}
        left={
          <Button variant="ghost" className="h-9 w-9 rounded-2xl px-0" onClick={() => navigate("/lists")} aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
        right={<OnlineStatusPill />}
      >
        <Surface className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 dark:text-white/55">
              {counts.checked}/{counts.total} куплено
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-2xl px-0"
                onClick={() => void refetch()}
                aria-label="Обновить"
              >
                <RefreshCw className={["h-4 w-4", isLoading ? "animate-spin" : ""].join(" ")} />
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-2xl px-0"
                onClick={() => void onClearChecked()}
                aria-label="Очистить купленное"
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <Input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Добавить товар" />
              <Autocomplete items={suggestions} onPick={(x) => setNewItemTitle(x)} />
            </div>
            <div className="w-24">
              <Input
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                inputMode="decimal"
                placeholder="Кол-во"
              />
            </div>
            <Button className="h-12 w-12 rounded-2xl px-0" onClick={onAdd} disabled={!canAdd} isLoading={isBusy} aria-label="Добавить">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
              {error}
            </div>
          ) : null}
        </Surface>

        <Surface className="mt-4 p-2">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-zinc-500 dark:text-white/55">
              Пусто. Добавьте первый товар.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-3 pt-2 text-[11px] font-medium text-zinc-500 dark:text-white/50">
                Не куплено ({groups.unchecked.length})
              </div>
              <div className="divide-y divide-black/5 overflow-hidden rounded-2xl dark:divide-white/10">
                {groups.unchecked.length === 0 ? (
                  <div className="px-3 py-3 text-[12px] text-zinc-500 dark:text-white/55">Пока пусто.</div>
                ) : (
                  groups.unchecked.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={(checked) => void toggleItem(item.id, checked)}
                      onPrice={() => void onPrice(item.id, item.price)}
                      onRename={() => void onRename(item.id, item.title)}
                      onDelete={() => void onDelete(item.id)}
                    />
                  ))
                )}
              </div>

              <div className="px-3 pt-2 text-[11px] font-medium text-zinc-500 dark:text-white/50">
                Куплено ({groups.checked.length})
              </div>
              <div className="divide-y divide-black/5 overflow-hidden rounded-2xl dark:divide-white/10">
                {groups.checked.length === 0 ? (
                  <div className="px-3 py-3 text-[12px] text-zinc-500 dark:text-white/55">Пока пусто.</div>
                ) : (
                  groups.checked.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={(checked) => void toggleItem(item.id, checked)}
                      onPrice={() => void onPrice(item.id, item.price)}
                      onRename={() => void onRename(item.id, item.title)}
                      onDelete={() => void onDelete(item.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </Surface>
      </AppShell>
    </ProtectedRoute>
  );
}
