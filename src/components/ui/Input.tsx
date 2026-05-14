import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  right?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, error, right, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? undefined;
    const describedBy = [
      error ? `${inputId}-error` : null,
      hint ? `${inputId}-hint` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <label className="block">
        {label ? (
          <div className="mb-2 px-1 text-[12px] font-medium tracking-tight text-zinc-700 dark:text-white/75">
            {label}
          </div>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              "h-12 w-full rounded-2xl bg-black/5 px-4 text-[16px] tracking-tight text-zinc-900 placeholder:text-zinc-500",
              "shadow-[0_10px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl",
              "focus:outline-none focus:ring-2 focus:ring-sky-400/60",
              "dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:shadow-[0_10px_28px_rgba(0,0,0,0.35)]",
              right ? "pr-11" : null,
              error ? "ring-2 ring-rose-400/60" : null,
              className,
            )}
            {...props}
          />
          {right ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div> : null}
        </div>
        {error ? (
          <div id={`${inputId}-error`} className="mt-2 px-1 text-[11px] text-rose-600 dark:text-rose-300">
            {error}
          </div>
        ) : hint ? (
          <div id={`${inputId}-hint`} className="mt-2 px-1 text-[11px] text-zinc-500 dark:text-white/50">
            {hint}
          </div>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
