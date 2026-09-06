"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button, Input, Select } from "@/presentation/components/ui";

export interface FiltroSelecao {
  nome: string;
  valor: string;
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
}

/**
 * Barra de busca + seletores reaproveitada nas listagens do admin.
 * Assim como na vitrine, o estado vive na URL.
 */
export function BuscaSimples({
  base,
  termo,
  placeholder,
  filtro,
  filtroSecundario,
}: {
  base: string;
  termo: string;
  placeholder: string;
  filtro?: FiltroSelecao;
  filtroSecundario?: FiltroSelecao;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();
  const [busca, setBusca] = useState(termo);

  function aplicar(alteracoes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(alteracoes)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    const query = params.toString();
    iniciarTransicao(() => router.push(query ? `${base}?${query}` : base));
  }

  const temFiltro = Boolean(termo || filtro?.valor || filtroSecundario?.valor);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          aplicar({ termo: busca });
        }}
        className="flex flex-1 gap-2"
      >
        <div className="relative flex-1">
          <label htmlFor={`busca-${base}`} className="sr-only">
            {placeholder}
          </label>
          <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id={`busca-${base}`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button type="submit" variante="secundario" carregando={pendente}>
          Buscar
        </Button>
      </form>

      <div className="flex gap-2">
        {[filtro, filtroSecundario].filter(Boolean).map((f) => (
          <div key={f!.nome} className="flex-1">
            <label htmlFor={`filtro-${f!.nome}`} className="sr-only">
              {f!.rotulo}
            </label>
            <Select
              id={`filtro-${f!.nome}`}
              value={f!.valor}
              onChange={(e) => aplicar({ [f!.nome]: e.target.value })}
              className="lg:w-48"
            >
              {f!.opcoes.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </Select>
          </div>
        ))}

        {temFiltro ? (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              iniciarTransicao(() => router.push(base));
            }}
            className="inline-flex shrink-0 items-center gap-1 px-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <X aria-hidden className="size-4" />
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}
