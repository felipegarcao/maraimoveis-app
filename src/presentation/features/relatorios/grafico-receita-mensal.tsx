"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2 } from "lucide-react";
import type { PontoReceitaMensal } from "@/application/dtos";
import { formatarMesCurto, formatarMesReferencia, formatarMoeda, formatarMoedaCompacta } from "@/lib/formatters";
import { Table, TableWrapper, Td, Th, Tr } from "@/presentation/components/ui";
import { CORES_GRAFICO, COR_GRADE, ESTILO_EIXO } from "./paleta";

/**
 * Receita cobrada por mês, decomposta em recebido x em aberto.
 * Barras empilhadas somam o total cobrado, então dá para ler o volume do mês
 * e a inadimplência dele no mesmo lugar — um eixo só, sem escala dupla.
 */
export function GraficoReceitaMensal({ dados }: { dados: readonly PontoReceitaMensal[] }) {
  const [verTabela, setVerTabela] = useState(false);

  const series = dados.map((ponto) => ({
    mes: ponto.mes,
    rotulo: formatarMesCurto(ponto.mes),
    Recebido: ponto.recebido,
    "Em aberto": ponto.emAberto,
    total: ponto.cobrado,
  }));

  return (
    <div className="min-w-0">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setVerTabela((v) => !v)}
          aria-pressed={verTabela}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <Table2 aria-hidden className="size-3.5" />
          {verTabela ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>

      {verTabela ? (
        <TableWrapper>
          <Table className="min-w-[420px]">
            <caption className="sr-only">Receita cobrada, recebida e em aberto por mês</caption>
            <thead>
              <tr>
                <Th scope="col">Mês</Th>
                <Th scope="col" className="text-right">Cobrado</Th>
                <Th scope="col" className="text-right">Recebido</Th>
                <Th scope="col" className="text-right">Em aberto</Th>
              </tr>
            </thead>
            <tbody>
              {series.map((linha) => (
                <Tr key={linha.mes}>
                  <Td className="font-medium text-slate-900">{formatarMesReferencia(linha.mes)}</Td>
                  <Td className="text-right tabular-nums">{formatarMoeda(linha.total)}</Td>
                  <Td className="text-right tabular-nums">{formatarMoeda(linha.Recebido)}</Td>
                  <Td className="text-right tabular-nums">{formatarMoeda(linha["Em aberto"])}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      ) : (
        <div className="h-64 w-full min-w-0 overflow-hidden sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barCategoryGap="22%">
              <CartesianGrid stroke={COR_GRADE} vertical={false} />
              <XAxis dataKey="rotulo" {...ESTILO_EIXO} interval="preserveStartEnd" />
              <YAxis {...ESTILO_EIXO} width={62} tickFormatter={(v: number) => formatarMoedaCompacta(v)} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.12)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const ponto = payload[0].payload as (typeof series)[number];
                  return (
                    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lift">
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="mt-1 text-slate-500">
                        Cobrado {formatarMoeda(ponto.total)}
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {payload.map((item) => (
                          <li key={String(item.name)} className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ background: item.color }}
                            />
                            <span className="text-slate-600">{item.name}</span>
                            <span className="ml-auto font-medium tabular-nums text-slate-900">
                              {formatarMoeda(Number(item.value))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                iconSize={8}
                formatter={(valor) => <span className="text-xs text-slate-600">{valor}</span>}
              />
              {/* stroke branco de 2px cria o respiro entre os segmentos empilhados */}
              <Bar dataKey="Recebido" stackId="mes" fill={CORES_GRAFICO.recebido} stroke="#fff" strokeWidth={2} />
              <Bar
                dataKey="Em aberto"
                stackId="mes"
                fill={CORES_GRAFICO.emAberto}
                stroke="#fff"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
