import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-xl",
        "dark:bg-white/5 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
        className,
      )}
      {...props}
    />
  );
}
