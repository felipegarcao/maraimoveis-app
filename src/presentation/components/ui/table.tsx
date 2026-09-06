import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper com rolagem horizontal própria: em telas estreitas a tabela desliza
 * sem empurrar o body para o lado.
 */
export function TableWrapper({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cn("w-full min-w-0 overflow-x-auto", className)} />;
}

export function Table({ className, ...props }: ComponentPropsWithRef<"table">) {
  return <table {...props} className={cn("w-full min-w-[640px] border-collapse text-sm", className)} />;
}

export function Th({ className, ...props }: ComponentPropsWithRef<"th">) {
  return (
    <th
      {...props}
      className={cn(
        "whitespace-nowrap border-b border-line bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
    />
  );
}

export function Td({ className, ...props }: ComponentPropsWithRef<"td">) {
  return <td {...props} className={cn("border-b border-line px-4 py-3 align-middle text-slate-700", className)} />;
}

export function Tr({ className, ...props }: ComponentPropsWithRef<"tr">) {
  return <tr {...props} className={cn("transition-colors hover:bg-slate-50/70", className)} />;
}
