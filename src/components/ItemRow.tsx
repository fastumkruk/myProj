import { Check, Pencil, Trash2 } from "lucide-react";
import type { ShoppingItem } from "@/types/models";
import Button from "@/components/ui/Button";

export default function ItemRow({
  item,
  onToggle,
  onRename,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: (isChecked: boolean) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/5 dark:hover:bg-white/10">
      <button
        type="button"
        onClick={() => onToggle(!item.is_checked)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-xl transition",
          item.is_checked ? "bg-sky-500 text-white" : "bg-black/5 text-zinc-400 dark:bg-white/10 dark:text-white/35",
        ].join(" ")}
        aria-label={item.is_checked ? "Снять отметку" : "Отметить как куплено"}
      >
        <Check className={["h-4 w-4 transition", item.is_checked ? "opacity-100" : "opacity-0"].join(" ")} />
      </button>

      <button type="button" onClick={() => onToggle(!item.is_checked)} className="min-w-0 flex-1 text-left">
        <div
          className={[
            "truncate text-[15px] font-semibold tracking-tight",
            item.is_checked ? "text-zinc-400 line-through dark:text-white/35" : "",
          ].join(" ")}
        >
          {item.title}
        </div>
      </button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-9 w-9 rounded-xl px-0" onClick={onRename} aria-label="Редактировать">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" className="h-9 w-9 rounded-xl px-0" onClick={onDelete} aria-label="Удалить">
          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-300" />
        </Button>
      </div>
    </div>
  );
}

