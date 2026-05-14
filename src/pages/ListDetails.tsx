import { ArrowLeft, Eraser, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import ItemRow from "@/components/ItemRow";
import OnlineStatusPill from "@/components/OnlineStatusPill";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { useItems } from "@/hooks/useItems";
import { supabase } from "@/lib/supabase";

export default function ListDetails() {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const { items, isLoading, error, addItem, toggleItem, renameItem, deleteItem, clearChecked, refetch } = useItems(
    listId ?? null,
  );

  const [listTitle, setListTitle] = useState<string>("Список");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const counts = useMemo(() => {
    const total = items.length;
    const checked = items.filter((i) => i.is_checked).length;
    return { total, checked };
  }, [items]);

  useEffect(() => {
    const run = async () => {
      if (!supabase || !listId) return;
      const { data } = await supabase.from("lists").select("title").eq("id", listId).maybeSingle();
      if (data?.title) setListTitle(data.title);
    };
    void run();
  }, [listId]);

  const canAdd = useMemo(() => newItemTitle.trim().length >= 1, [newItemTitle]);

  const onAdd = async () => {
    if (!canAdd || isBusy) return;
    setIsBusy(true);
    try {
      await addItem(newItemTitle.trim());
      setNewItemTitle("");
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

  const onClearChecked = async () => {
    const ok = window.confirm("Очистить купленное?");
    if (!ok) return;
    await clearChecked();
  };

  return (
    <ProtectedRoute requireHousehold>
      <AppShell
        title={listTitle}
        right={
          <>
            <OnlineStatusPill />
            <Button variant="ghost" className="h-9 w-9 rounded-2xl px-0" onClick={() => navigate("/lists")} aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <Surface className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-zinc-500 dark:text-white/55">
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

        <Surface className="mt-4 divide-y divide-black/5 p-2 dark:divide-white/10">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-zinc-500 dark:text-white/55">
              Пусто. Добавьте первый товар.
            </div>
          ) : (
            items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={(checked) => void toggleItem(item.id, checked)}
                onRename={() => void onRename(item.id, item.title)}
                onDelete={() => void onDelete(item.id)}
              />
            ))
          )}
        </Surface>
      </AppShell>
    </ProtectedRoute>
  );
}
