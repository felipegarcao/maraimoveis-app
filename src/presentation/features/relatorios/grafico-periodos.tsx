"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeriodoDoImovel } from "@/application/dtos";
import { formatarData, formatarMoeda, formatarMoedaCompacta } from "@/lib/formatters";
import { CORES_GRAFICO, COR_GRADE, ESTILO_EIXO } from "./paleta";

/**
 * Receita média mensal por ocupação do mesmo imóvel.
 *
 * Série única — o título já nomeia a medida, então não há legenda. A ocupação
 * de melhor desempenho recebe cor de destaque e rótulo direto.
 */
export function GraficoPeriodos({
  periodos,
  melhorPeriodoId,
}: {
  periodos: readonly PeriodoDoImovel[];
  melhorPeriodoId: string | null;
}) {
  const dados = periodos.map((periodo, indice) => ({
    id: periodo.ocupacao.id,
    rotulo: `${indice + 1}. ${periodo.inquilino.nome.split(" ")[0]}`,
    inquilino: periodo.inquilino.nome,
    media: periodo.receitaMediaMensal,
    total: periodo.receitaTotal,
    meses: periodo.duracaoMeses,
    inicio: periodo.ocupacao.dataEntrada,
    fim: periodo.ocupacao.dataSaida,
  }));

  return (
    <div className="h-72 w-full min-w-0 overflow-hidden sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 22, right: 8, bottom: 0, left: -8 }} barCategoryGap="28%">
          <CartesianGrid stroke={COR_GRADE} vertical={false} />
          <XAxis dataKey="rotulo" {...ESTILO_EIXO} />
          <YAxis {...ESTILO_EIXO} width={62} tickFormatter={(v: number) => formatarMoedaCompacta(v)} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.12)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const ponto = payload[0].payload as (typeof dados)[number];
              return (
                <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lift">
                  <p className="font-semibold text-slate-900">{ponto.inquilino}</p>
                  <p className="mt-0.5 text-slate-500">
                    {formatarData(ponto.inicio)} — {ponto.fim ? formatarData(ponto.fim) : "atual"}
                  </p>
                  <dl className="mt-1.5 space-y-0.5">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Média mensal</dt>
                      <dd className="font-medium tabular-nums text-slate-900">
                        {formatarMoeda(ponto.media)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Total no período</dt>
                      <dd className="font-medium tabular-nums text-slate-900">
                        {formatarMoeda(ponto.total)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Duração</dt>
                      <dd className="font-medium tabular-nums text-slate-900">
                        {ponto.meses} meses
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            }}
          />
          <Bar dataKey="media" radius={[4, 4, 0, 0]} stroke="#fff" strokeWidth={2}>
            <LabelList
              dataKey="media"
              position="top"
              offset={8}
              className="fill-slate-500"
              fontSize={11}
              formatter={(valor) => formatarMoedaCompacta(Number(valor ?? 0))}
            />
            {dados.map((ponto) => (
              <Cell
                key={ponto.id}
                fill={ponto.id === melhorPeriodoId ? CORES_GRAFICO.recebido : CORES_GRAFICO.ocupado}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
