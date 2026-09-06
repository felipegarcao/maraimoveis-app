"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const LARGURAS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

/**
 * Modal acessível: fecha no Escape e no clique fora, trava o scroll do body,
 * devolve o foco ao elemento que o abriu e mantém o foco preso enquanto aberto.
 * No mobile vira uma folha ancorada na base da tela.
 */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  descricao,
  largura = "md",
  children,
  rodape,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  largura?: keyof typeof LARGURAS;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  const painel = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    focoAnterior.current = document.activeElement as HTMLElement | null;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focaveis = () =>
      Array.from(
        painel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focaveis()[0]?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        aoFechar();
        return;
      }
      if (evento.key !== "Tab") return;

      const elementos = focaveis();
      if (elementos.length === 0) return;
      const primeiro = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowOriginal;
      focoAnterior.current?.focus();
    };
  }, [aberto, aoFechar]);

  if (!aberto || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        aria-hidden
        onClick={aoFechar}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
      />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-lift",
          "sm:max-h-[88vh] sm:rounded-card",
          LARGURAS[largura],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="titulo-modal" className="text-base font-semibold text-slate-900">
              {titulo}
            </h2>
            {descricao ? <p className="mt-0.5 text-sm text-slate-500">{descricao}</p> : null}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-mr-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {rodape ? (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            {rodape}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
