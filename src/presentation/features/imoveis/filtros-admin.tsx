"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import {
  ROTULOS_STATUS_IMOVEL,
  ROTULOS_TIPO_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
} from "@/domain/entities";
import { Button, Input, Select } from "@/presentation/components/ui";

/** Filtros do admin, também espelhados na URL para manter links compartilháveis. */
export function FiltrosAdminImoveis({
  termo,
  status,
  tipo,
}: {
  termo: string;
  status: string;
  tipo: string;
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
    iniciarTransicao(() => router.push(query ? `/admin/imoveis?${query}` : "/admin/imoveis"));
  }

  const temFiltro = Boolean(termo || status || tipo);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          aplicar({ termo: busca });
        }}
        className="flex flex-1 gap-2"
      >
        <div className="relative flex-1">
          <label htmlFor="admin-busca-imovel" className="sr-only">
            Buscar imóvel
          </label>
          <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="admin-busca-imovel"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, bairro ou rua"
            className="pl-9"
          />
        </div>
        <Button type="submit" variante="secundario" carregando={pendente}>
          Buscar
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-2 sm:w-auto sm:grid-cols-2">
        <div>
          <label htmlFor="filtro-status-admin" className="sr-only">
            Filtrar por situação
          </label>
          <Select
            id="filtro-status-admin"
            value={status}
            onChange={(e) => aplicar({ status: e.target.value })}
            className="sm:w-44"
          >
            <option value="">Todas as situações</option>
            {STATUS_IMOVEL.map((s) => (
              <option key={s} value={s}>
                {ROTULOS_STATUS_IMOVEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="filtro-tipo-admin" className="sr-only">
            Filtrar por tipo
          </label>
          <Select
            id="filtro-tipo-admin"
            value={tipo}
            onChange={(e) => aplicar({ tipo: e.target.value })}
            className="sm:w-44"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_IMOVEL.map((t) => (
              <option key={t} value={t}>
                {ROTULOS_TIPO_IMOVEL[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {temFiltro ? (
        <button
          type="button"
          onClick={() => {
            setBusca("");
            iniciarTransicao(() => router.push("/admin/imoveis"));
          }}
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-brand-700 hover:text-brand-800 lg:self-center"
        >
          <X aria-hidden className="size-4" />
          Limpar
        </button>
      ) : null}
    </div>
  );
}
