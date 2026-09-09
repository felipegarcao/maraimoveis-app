import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

const BASE =
  "w-full rounded-lg border bg-surface px-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const NORMAL = "border-line hover:border-slate-300 focus:border-brand-500";
const INVALIDO = "border-red-400 focus:border-red-500";

export function Input({
  className,
  invalido,
  ...props
}: ComponentPropsWithRef<"input"> & { invalido?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalido || undefined}
      className={cn(BASE, "h-10", invalido ? INVALIDO : NORMAL, className)}
    />
  );
}

export function Textarea({
  className,
  invalido,
  ...props
}: ComponentPropsWithRef<"textarea"> & { invalido?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalido || undefined}
      className={cn(BASE, "min-h-24 py-2.5 leading-relaxed", invalido ? INVALIDO : NORMAL, className)}
    />
  );
}

export function Select({
  className,
  invalido,
  children,
  ...props
}: ComponentPropsWithRef<"select"> & { invalido?: boolean }) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={invalido || undefined}
        className={cn(
          BASE,
          "h-10 appearance-none pr-9",
          invalido ? INVALIDO : NORMAL,
          className,
        )}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      >
        <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentPropsWithRef<"input"> & { label: string }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm text-slate-700", className)}>
      <input
        type="checkbox"
        {...props}
        className="size-4 rounded border-slate-300 text-brand-600 accent-brand-600"
      />
      {label}
    </label>
  );
}

/** Input numérico com prefixo R$ — usado em todos os campos monetários. */
export function InputMoeda({
  className,
  invalido,
  ...props
}: ComponentPropsWithRef<"input"> & { invalido?: boolean }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
        R$
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        {...props}
        aria-invalid={invalido || undefined}
        className={cn(BASE, "h-10 pl-9", invalido ? INVALIDO : NORMAL, className)}
      />
    </div>
  );
}
