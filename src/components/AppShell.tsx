import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AppShell({
  title,
  right,
  children,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100",
      )}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-[28rem] -translate-x-1/2 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.06),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto min-h-dvh max-w-md px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))]">
        {title ? (
          <div className="sticky top-[max(12px,env(safe-area-inset-top))] z-10 mb-4">
            <div className="flex items-center justify-between rounded-3xl bg-white/70 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:bg-white/5 dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              <div className="text-[15px] font-semibold tracking-tight">{title}</div>
              <div className="flex items-center gap-2">{right}</div>
            </div>
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
