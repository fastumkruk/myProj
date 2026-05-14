import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl px-4 font-medium tracking-tight transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-0",
          size === "lg" ? "h-12 text-[15px]" : "h-10 text-[14px]",
          variant === "primary" &&
            "bg-sky-500 text-white shadow-[0_10px_28px_rgba(14,165,233,0.35)] hover:bg-sky-400",
          variant === "secondary" &&
            "bg-black/5 text-zinc-900 shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:bg-black/10 dark:bg-white/10 dark:text-white dark:shadow-[0_10px_28px_rgba(0,0,0,0.35)] dark:hover:bg-white/15",
          variant === "ghost" &&
            "bg-transparent text-zinc-900 hover:bg-black/5 dark:text-white/90 dark:hover:bg-white/10",
          variant === "danger" &&
            "bg-rose-500 text-white shadow-[0_10px_28px_rgba(244,63,94,0.35)] hover:bg-rose-400",
          className,
        )}
        {...props}
      >
        {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        {props.children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
