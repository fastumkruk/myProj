import { Bell, LogOut, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ListRow from "@/components/ListRow";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { useLists } from "@/hooks/useLists";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";

export default function Lists() {
  const navigate = useNavigate();
  const householdId = useAuthStore((s) => s.householdId);
  const signOut = useAuthStore((s) => s.signOut);
  const toast = useToastStore((s) => s.push);
  const { lists, isLoading, error, createList, renameList, deleteList, refetch } = useLists(householdId);

  const [newTitle, setNewTitle] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const canAdd = useMemo(() => newTitle.trim().length >= 2, [newTitle]);

  const onAdd = async () => {
    if (!canAdd || isBusy) return;
    setIsBusy(true);
    try {
      const row = await createList(newTitle.trim());
      setNewTitle("");
      if (row) navigate(`/lists/${row.id}`);
    } finally {
      setIsBusy(false);
    }
  };

  const onRename = async (listId: string, currentTitle: string) => {
    const title = window.prompt("Новое название", currentTitle);
    if (!title) return;
    await renameList(listId, title);
  };

  const onDelete = async (listId: string) => {
    const ok = window.confirm("Удалить список? Товары тоже удалятся.");
    if (!ok) return;
    await deleteList(listId);
  };

  const onEnableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast("Уведомления не поддерживаются");
      return;
    }
    if (Notification.permission === "granted") {
      toast("Уведомления уже включены");
      return;
    }
    const res = await Notification.requestPermission();
    toast(res === "granted" ? "Уведомления включены" : "Уведомления отключены");
  };

  return (
    <ProtectedRoute requireHousehold>
      <AppShell
        title="Списки"
        right={
          <>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-2xl px-0"
              onClick={() => void onEnableNotifications()}
              aria-label="Уведомления"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-2xl px-0"
              onClick={() => void refetch()}
              aria-label="Обновить"
            >
              <RefreshCw className={["h-4 w-4", isLoading ? "animate-spin" : ""].join(" ")} />
            </Button>
            <Button variant="ghost" className="h-9 w-9 rounded-2xl px-0" onClick={() => void signOut()} aria-label="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <Surface className="p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Новый список"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Например: Продукты"
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

        <Surface className="mt-4 divide-y divide-black/5 p-2 dark:divide-white/10">
          {lists.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-zinc-500 dark:text-white/55">
              Пока нет списков. Создайте первый.
            </div>
          ) : (
            lists.map((list) => (
              <ListRow
                key={list.id}
                list={list}
                onOpen={() => navigate(`/lists/${list.id}`)}
                onRename={() => void onRename(list.id, list.title)}
                onDelete={() => void onDelete(list.id)}
              />
            ))
          )}
        </Surface>
      </AppShell>
    </ProtectedRoute>
  );
}
