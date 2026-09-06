import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icone: Icone,
  titulo,
  descricao,
  acao,
  className,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icone aria-hidden className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{titulo}</h3>
      {descricao ? <p className="mt-1.5 max-w-sm text-sm text-slate-500">{descricao}</p> : null}
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}

export function ErrorState({
  titulo = "Não foi possível carregar",
  descricao,
  acao,
}: {
  titulo?: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <svg aria-hidden viewBox="0 0 24 24" fill="none" className="size-6">
          <path
            d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{titulo}</h3>
      {descricao ? <p className="mt-1.5 max-w-sm text-sm text-slate-500">{descricao}</p> : null}
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}
