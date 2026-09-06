import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONS = {
  neutro: "bg-slate-100 text-slate-700 ring-slate-200",
  marca: "bg-brand-50 text-brand-700 ring-brand-200",
  sucesso: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  alerta: "bg-amber-50 text-amber-700 ring-amber-200",
  perigo: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
} as const;

export type TomBadge = keyof typeof TONS;

export function Badge({
  tom = "neutro",
  children,
  className,
  ponto = false,
}: {
  tom?: TomBadge;
  children: ReactNode;
  className?: string;
  ponto?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONS[tom],
        className,
      )}
    >
      {ponto ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
