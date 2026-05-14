import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { ShoppingList } from "@/types/models";
import Button from "@/components/ui/Button";

export default function ListRow({
  list,
  onOpen,
  onRename,
  onDelete,
}: {
  list: ShoppingList;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/5 dark:hover:bg-white/10">
      <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold tracking-tight">{list.title}</div>
          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-white/50">
            Обновлено {new Date(list.updated_at).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-white/35" />
      </button>

      <div className="flex items-center gap-2 opacity-100 transition group-hover:opacity-100">
        <Button variant="ghost" className="h-9 w-9 rounded-xl px-0" onClick={onRename} aria-label="Переименовать">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" className="h-9 w-9 rounded-xl px-0" onClick={onDelete} aria-label="Удалить">
          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-300" />
        </Button>
      </div>
    </div>
  );
}
