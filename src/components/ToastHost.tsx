import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toastStore";

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-0 right-0 z-50 mx-auto flex max-w-md flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-[12px] font-medium tracking-tight text-zinc-900 shadow-[0_18px_40px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:bg-white/10 dark:text-white dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        >
          <div className="min-w-0 flex-1 truncate">{t.message}</div>
          <Button variant="ghost" className="h-8 w-8 rounded-xl px-0" onClick={() => remove(t.id)} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

