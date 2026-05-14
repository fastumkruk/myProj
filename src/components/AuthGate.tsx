import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (status !== "ready") {
    return (
      <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6">
          <div className="w-full rounded-3xl bg-white/70 p-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-white/5 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="text-sm font-medium tracking-tight">Загрузка</div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-black/50 dark:bg-white/60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
