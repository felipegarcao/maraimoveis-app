import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONS = {
  neutro: "bg-slate-100 text-slate-600",
  marca: "bg-brand-50 text-brand-600",
  sucesso: "bg-emerald-50 text-emerald-600",
  alerta: "bg-amber-50 text-amber-600",
  perigo: "bg-red-50 text-red-600",
} as const;

export function StatCard({
  rotulo,
  valor,
  auxiliar,
  icone: Icone,
  tom = "neutro",
  className,
}: {
  rotulo: string;
  valor: string;
  auxiliar?: string;
  icone: LucideIcon;
  tom?: keyof typeof TONS;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-line bg-surface p-4 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</p>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", TONS[tom])}>
          <Icone aria-hidden className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">{valor}</p>
      {auxiliar ? <p className="mt-1 text-xs text-slate-500">{auxiliar}</p> : null}
    </div>
  );
}
