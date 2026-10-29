import * as React from "react";
import { cn } from "../../utils/cn";

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
} = {}) {
  return cn(
    "inline-flex max-w-full select-none items-center justify-center gap-2 rounded-btn text-center font-semibold leading-snug sm:whitespace-nowrap transition-[background-color,border-color,color,box-shadow,translate] duration-200 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
      "bg-brand text-white shadow-[0_8px_20px_rgb(36_87_245/0.25)] hover:bg-brand-hover hover:-translate-y-0.5":
        variant === "default" || variant === "primary",
      "bg-[#25D366] text-white shadow-[0_8px_20px_rgb(37_211_102/0.25)] hover:bg-[#20bd5a] hover:-translate-y-0.5":
        variant === "whatsapp",
      "bg-night text-white hover:bg-ink hover:-translate-y-0.5":
        variant === "secondary",
      "border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 text-ink dark:text-slate-200 hover:border-brand/40 hover:bg-brand-soft dark:hover:bg-slate-800 hover:text-brand dark:hover:text-blue-400":
        variant === "outline",
      "bg-white text-brand shadow-[0_8px_20px_rgb(0_0_0/0.18)] hover:bg-brand-soft hover:-translate-y-0.5":
        variant === "inverse",
      "text-ink dark:text-slate-200 hover:bg-brand-soft dark:hover:bg-slate-800 hover:text-brand dark:hover:text-blue-400":
        variant === "ghost",
      "text-brand dark:text-blue-400 underline-offset-4 hover:underline":
        variant === "link",

      /* Dimensões adaptativas para evitar corte no celular */
      "min-h-11 px-4 py-2 text-sm sm:px-5 sm:text-[0.9375rem]":
        size === "default" || size === "md",
      "min-h-10 rounded-lg px-3.5 py-1.5 text-xs sm:px-4 sm:text-sm":
        size === "sm",
      "min-h-12 px-4 py-2.5 text-sm sm:px-6 sm:text-base": size === "lg",
      "size-11": size === "icon",
    },
    className
  );
}

export const Button = React.forwardRef(function Button(
  { className, variant = "default", size = "default", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
});

