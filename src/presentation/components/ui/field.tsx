import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  erro,
  dica,
  obrigatorio,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {obrigatorio ? (
          <span aria-hidden className="ml-0.5 text-red-500">
            *
          </span>
        ) : null}
      </label>
      {children}
      {erro ? (
        <p id={`${htmlFor}-erro`} role="alert" className="text-xs font-medium text-red-600">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${htmlFor}-dica`} className="text-xs text-slate-500">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
