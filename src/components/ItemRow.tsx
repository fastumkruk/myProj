import { Pencil, Trash2 } from "lucide-react";
import type { ShoppingItem } from "@/types/models";
import Button from "@/components/ui/Button";

export default function ItemRow({
  item,
  onToggle,
  onRename,
  onPrice,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: (isChecked: boolean) => void;
  onRename: () => void;
  onPrice: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/5 dark:hover:bg-white/10">
      <button type="button" onClick={() => onToggle(!item.is_checked)} className="min-w-0 flex-1 text-left">
        <div
          className={[
            "truncate text-[14px] font-semibold tracking-tight",
            item.is_checked ? "text-zinc-400 line-through dark:text-white/35" : "text-zinc-900 dark:text-zinc-100",
          ].join(" ")}
        >
          {item.title}
        </div>
      </button>

      <div className="flex items-center gap-2">
        {typeof item.price === "number" ? (
          <div className="rounded-xl bg-emerald-500/10 px-2.5 py-1 text-[12px] font-semibold tracking-tight text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
            ₽{item.price}
          </div>
        ) : null}
        <Button variant="ghost" className="h-9 w-9 rounded-xl px-0" onClick={onPrice} aria-label="Сумма">
          <span className="text-[16px] leading-none">💰</span>
        </Button>
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
