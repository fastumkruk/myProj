import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, error, id, ...props }, ref) => {
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
          <div className="mb-2 px-1 text-[13px] font-medium tracking-tight text-zinc-700 dark:text-white/75">
            {label}
          </div>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-12 w-full rounded-2xl bg-black/5 px-4 text-[15px] tracking-tight text-zinc-900 placeholder:text-zinc-500",
            "shadow-[0_10px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl",
            "focus:outline-none focus:ring-2 focus:ring-sky-400/60",
            "dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:shadow-[0_10px_28px_rgba(0,0,0,0.35)]",
            error ? "ring-2 ring-rose-400/60" : null,
            className,
          )}
          {...props}
        />
        {error ? (
          <div id={`${inputId}-error`} className="mt-2 px-1 text-[12px] text-rose-600 dark:text-rose-300">
            {error}
          </div>
        ) : hint ? (
          <div id={`${inputId}-hint`} className="mt-2 px-1 text-[12px] text-zinc-500 dark:text-white/50">
            {hint}
          </div>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
