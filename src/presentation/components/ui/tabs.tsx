"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Aba {
  id: string;
  rotulo: string;
  contador?: number;
  conteudo: ReactNode;
}

export function Tabs({ abas, inicial }: { abas: Aba[]; inicial?: string }) {
  const [ativa, setAtiva] = useState(inicial ?? abas[0]?.id);
  const idBase = useId();

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções"
        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0"
      >
        {abas.map((aba) => {
          const selecionada = aba.id === ativa;
          return (
            <button
              key={aba.id}
              role="tab"
              id={`${idBase}-${aba.id}`}
              aria-selected={selecionada}
              aria-controls={`${idBase}-${aba.id}-painel`}
              onClick={() => setAtiva(aba.id)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                selecionada
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
              )}
            >
              {aba.rotulo}
              {aba.contador !== undefined ? (
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    selecionada ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {aba.contador}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {abas.map((aba) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={`${idBase}-${aba.id}-painel`}
          aria-labelledby={`${idBase}-${aba.id}`}
          hidden={aba.id !== ativa}
          className="pt-5"
        >
          {aba.id === ativa ? aba.conteudo : null}
        </div>
      ))}
    </div>
  );
}
