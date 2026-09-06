import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn("rounded-card border border-line bg-surface shadow-soft", className)}
    />
  );
}

export function CardHeader({
  titulo,
  descricao,
  acoes,
  className,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-slate-900">{titulo}</h2>
        {descricao ? <p className="mt-0.5 text-sm text-slate-500">{descricao}</p> : null}
      </div>
      {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cn("p-4 sm:p-5", className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn("flex flex-wrap gap-2 border-t border-line px-4 py-3 sm:px-5", className)}
    />
  );
}
