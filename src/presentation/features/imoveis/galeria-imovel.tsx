"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { FotoImovel } from "@/domain/entities";
import { ImagemImovel } from "@/presentation/components/imagem-imovel";
import { cn } from "@/lib/utils";

/**
 * Galeria com miniaturas e lightbox.
 * No mobile o carrossel principal ocupa a largura toda; as miniaturas viram
 * uma faixa rolável horizontal.
 */
export function GaleriaImovel({ fotos, titulo }: { fotos: readonly FotoImovel[]; titulo: string }) {
  const [indice, setIndice] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const total = fotos.length;

  const avancar = useCallback(() => setIndice((i) => (i + 1) % total), [total]);
  const voltar = useCallback(() => setIndice((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (!ampliada) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAmpliada(false);
      if (evento.key === "ArrowRight") avancar();
      if (evento.key === "ArrowLeft") voltar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
    };
  }, [ampliada, avancar, voltar]);

  if (total === 0) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border border-line bg-slate-100">
        <ImagemImovel src={null} alt={titulo} className="absolute inset-0" />
      </div>
    );
  }

  const atual = fotos[indice];

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-line bg-slate-100 sm:aspect-[16/10]">
        <ImagemImovel
          src={atual.url}
          alt={atual.descricao}
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="absolute inset-0"
        />

        {total > 1 ? (
          <>
            <BotaoNavegacao lado="esquerda" aoClicar={voltar} />
            <BotaoNavegacao lado="direita" aoClicar={avancar} />
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setAmpliada(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-slate-900/85"
        >
          <Expand aria-hidden className="size-3.5" />
          Ampliar
        </button>

        <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur">
          {indice + 1} / {total}
        </span>
      </div>

      {total > 1 ? (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, i) => (
            <li key={foto.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}: ${foto.descricao}`}
                aria-current={i === indice}
                className={cn(
                  "relative block h-16 w-24 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-28",
                  i === indice ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <ImagemImovel src={foto.url} alt="" sizes="112px" className="absolute inset-0" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {ampliada ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria de fotos: ${titulo}`}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/95"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm tabular-nums">
              {indice + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setAmpliada(false)}
              aria-label="Fechar galeria"
              autoFocus
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div className="relative flex-1">
            <ImagemImovel
              src={atual.url}
              alt={atual.descricao}
              sizes="100vw"
              className="absolute inset-0 !object-contain"
            />
            {total > 1 ? (
              <>
                <BotaoNavegacao lado="esquerda" aoClicar={voltar} escuro />
                <BotaoNavegacao lado="direita" aoClicar={avancar} escuro />
              </>
            ) : null}
          </div>

          <p className="px-4 py-4 text-center text-sm text-slate-300">{atual.descricao}</p>
        </div>
      ) : null}
    </div>
  );
}

function BotaoNavegacao({
  lado,
  aoClicar,
  escuro = false,
}: {
  lado: "esquerda" | "direita";
  aoClicar: () => void;
  escuro?: boolean;
}) {
  const Icone = lado === "esquerda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={lado === "esquerda" ? "Foto anterior" : "Próxima foto"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full transition-colors sm:size-10",
        lado === "esquerda" ? "left-3" : "right-3",
        escuro
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-white/90 text-slate-700 shadow-sm hover:bg-white",
      )}
    >
      <Icone aria-hidden className="size-5" />
    </button>
  );
}
