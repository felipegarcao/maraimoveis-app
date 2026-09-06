"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import type { OcupacaoDetalhada } from "@/application/dtos";
import { ROTULOS_STATUS_PAGAMENTO, STATUS_PAGAMENTO } from "@/domain/entities";
import { Field, Input, Select } from "@/presentation/components/ui";
import { cn } from "@/lib/utils";

export function FiltrosFinanceiro({
  status,
  ocupacaoId,
  mesDe,
  mesAte,
  ocupacoes,
}: {
  status: string;
  ocupacaoId: string;
  mesDe: string;
  mesAte: string;
  ocupacoes: OcupacaoDetalhada[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();

  function aplicar(alteracoes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(alteracoes)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    const query = params.toString();
    iniciarTransicao(() => router.push(query ? `/admin/financeiro?${query}` : "/admin/financeiro"));
  }

  const temFiltro = Boolean(status || ocupacaoId || mesDe || mesAte);

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", pendente && "opacity-70")}>
      <Field label="Ocupação" htmlFor="fin-ocupacao" className="sm:col-span-2 lg:col-span-1">
        <Select
          id="fin-ocupacao"
          value={ocupacaoId}
          onChange={(e) => aplicar({ ocupacaoId: e.target.value })}
        >
          <option value="">Todas as ocupações</option>
          {ocupacoes.map((o) => (
            <option key={o.ocupacao.id} value={o.ocupacao.id}>
              {o.inquilino.nome} — {o.imovel.titulo}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Situação" htmlFor="fin-status">
        <Select id="fin-status" value={status} onChange={(e) => aplicar({ status: e.target.value })}>
          <option value="">Todas</option>
          {STATUS_PAGAMENTO.map((s) => (
            <option key={s} value={s}>
              {ROTULOS_STATUS_PAGAMENTO[s]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="De" htmlFor="fin-mes-de">
        <Input
          id="fin-mes-de"
          type="month"
          value={mesDe}
          onChange={(e) => aplicar({ mesDe: e.target.value })}
        />
      </Field>

      <Field label="Até" htmlFor="fin-mes-ate">
        <div className="flex items-center gap-2">
          <Input
            id="fin-mes-ate"
            type="month"
            value={mesAte}
            onChange={(e) => aplicar({ mesAte: e.target.value })}
          />
          {temFiltro ? (
            <button
              type="button"
              onClick={() => iniciarTransicao(() => router.push("/admin/financeiro"))}
              aria-label="Limpar filtros"
              className="shrink-0 rounded-lg p-2 text-brand-700 transition-colors hover:bg-brand-50"
            >
              <X aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
      </Field>
    </div>
  );
}
