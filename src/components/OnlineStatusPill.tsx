import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export default function OnlineStatusPill() {
  const { isOnline } = useOnlineStatus();
  const { pendingCount, isFlushing } = useOfflineQueue();

  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight",
        isOnline
          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
          : "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
      ].join(" ")}
    >
      {isOnline ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      {isFlushing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
      {isOnline ? "Онлайн" : "Офлайн"}
      {pendingCount > 0 ? `· ${isFlushing ? "синк" : pendingCount} в очереди` : null}
    </div>
  );
}
