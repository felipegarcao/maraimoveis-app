"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ROTULOS_TIPO_IMOVEL, TIPOS_IMOVEL } from "@/domain/entities";
import { Button, Field, Input, Select } from "@/presentation/components/ui";
import { cn } from "@/lib/utils";

export interface ValoresFiltro {
  termo: string;
  cidade: string;
  bairro: string;
  tipo: string;
  precoMax: string;
  quartosMin: string;
}

/**
 * Os filtros vivem na URL (searchParams), não em estado do React:
 * a listagem continua sendo um Server Component e o link fica compartilhável.
 */
export function FiltrosVitrine({
  cidades,
  bairros,
  valores,
  totalResultados,
}: {
  cidades: string[];
  bairros: string[];
  valores: ValoresFiltro;
  totalResultados: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();
  const [expandido, setExpandido] = useState(false);
  const [termo, setTermo] = useState(valores.termo);

  const filtrosAtivos = Object.entries(valores).filter(([, v]) => v !== "").length;

  function aplicar(alteracoes: Partial<ValoresFiltro>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(alteracoes)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    iniciarTransicao(() => router.push(`/?${params.toString()}`, { scroll: false }));
  }

  function limpar() {
    setTermo("");
    iniciarTransicao(() => router.push("/", { scroll: false }));
  }

  return (
    <section aria-label="Filtros de busca" className="rounded-card border border-line bg-surface p-4 shadow-soft">
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          aplicar({ termo });
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="busca-termo" className="sr-only">
            Buscar por bairro, cidade ou característica
          </label>
          <Input
            id="busca-termo"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por bairro, cidade ou palavra-chave"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" carregando={pendente} className="flex-1 sm:flex-none">
            Buscar
          </Button>
          <Button
            type="button"
            variante="secundario"
            onClick={() => setExpandido((v) => !v)}
            aria-expanded={expandido}
            aria-controls="filtros-avancados"
            className="flex-1 sm:flex-none"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            Filtros
            {filtrosAtivos > 0 ? (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white tabular-nums">
                {filtrosAtivos}
              </span>
            ) : null}
          </Button>
        </div>
      </form>

      <div
        id="filtros-avancados"
        hidden={!expandido}
        className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Cidade" htmlFor="filtro-cidade">
          <Select
            id="filtro-cidade"
            value={valores.cidade}
            onChange={(e) => aplicar({ cidade: e.target.value, bairro: "" })}
          >
            <option value="">Todas</option>
            {cidades.map((cidade) => (
              <option key={cidade} value={cidade}>
                {cidade}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Bairro" htmlFor="filtro-bairro">
          <Select id="filtro-bairro" value={valores.bairro} onChange={(e) => aplicar({ bairro: e.target.value })}>
            <option value="">Todos</option>
            {bairros.map((bairro) => (
              <option key={bairro} value={bairro}>
                {bairro}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tipo de imóvel" htmlFor="filtro-tipo">
          <Select id="filtro-tipo" value={valores.tipo} onChange={(e) => aplicar({ tipo: e.target.value })}>
            <option value="">Todos</option>
            {TIPOS_IMOVEL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ROTULOS_TIPO_IMOVEL[tipo]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Aluguel até" htmlFor="filtro-preco">
          <Select id="filtro-preco" value={valores.precoMax} onChange={(e) => aplicar({ precoMax: e.target.value })}>
            <option value="">Sem limite</option>
            {[1500, 2500, 3500, 5000, 8000, 15000].map((valor) => (
              <option key={valor} value={String(valor)}>
                até R$ {valor.toLocaleString("pt-BR")}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm",
          pendente && "opacity-60",
        )}
      >
        <p aria-live="polite" className="text-slate-600">
          {totalResultados === 0
            ? "Nenhum imóvel encontrado"
            : `${totalResultados} ${totalResultados === 1 ? "imóvel disponível" : "imóveis disponíveis"}`}
        </p>
        {filtrosAtivos > 0 ? (
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <X aria-hidden className="size-4" />
            Limpar filtros
          </button>
        ) : null}
      </div>
    </section>
  );
}
