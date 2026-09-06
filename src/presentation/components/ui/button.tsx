import type { ComponentPropsWithRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTES = {
  primario: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secundario: "bg-white text-slate-700 border border-line hover:bg-slate-50 active:bg-slate-100",
  suave: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  perigo: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  perigoSuave: "bg-red-50 text-red-700 hover:bg-red-100",
} as const;

const TAMANHOS = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icone: "h-9 w-9 justify-center",
} as const;

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variante?: keyof typeof VARIANTES;
  tamanho?: keyof typeof TAMANHOS;
  carregando?: boolean;
  larguraTotal?: boolean;
  children?: ReactNode;
}

export function Button({
  variante = "primario",
  tamanho = "md",
  carregando = false,
  larguraTotal = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        larguraTotal && "w-full",
        className,
      )}
    >
      {carregando ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Mesmo visual do Button aplicado a `<a>` ou `<Link>`. */
export function classesBotao(
  variante: keyof typeof VARIANTES = "primario",
  tamanho: keyof typeof TAMANHOS = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className,
  );
}
