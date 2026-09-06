import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarX2,
  Percent,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Endereco } from "@/domain/value-objects";
import { ehErroDominio } from "@/domain/errors";
import { formatarData, formatarMoeda } from "@/lib/formatters";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
  Table,
  TableWrapper,
  Td,
  Th,
  Tr,
  classesBotao,
} from "@/presentation/components/ui";
import { GraficoPeriodos } from "@/presentation/features/relatorios/grafico-periodos";
import { StatusImovelBadge } from "@/presentation/features/imoveis/status-imovel-badge";

type Props = { params: Promise<{ imovelId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const imovel = await casosDeUso.imoveis.obter.executar((await params).imovelId);
    return { title: `Relatório — ${imovel.titulo}` };
  } catch {
    return { title: "Relatório" };
  }
}

export default async function PaginaRelatorioImovel({ params }: Props) {
  const { imovelId } = await params;

  let comparativo;
  try {
    comparativo = await casosDeUso.relatorios.compararPeriodos.executar(imovelId);
  } catch (erro) {
    if (ehErroDominio(erro)) notFound();
    throw erro;
  }

  const { imovel, periodos } = comparativo;
  const mesesVagos = Math.round((comparativo.diasVagos / 30.44) * 10) / 10;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/relatorios"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para relatórios
        </Link>
        <Link href={`/admin/imoveis/${imovel.id}`} className={classesBotao("secundario", "md")}>
          <Building2 aria-hidden className="size-4" />
          Ver imóvel
        </Link>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <StatusImovelBadge status={imovel.status} />
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{imovel.titulo}</h2>
          <p className="mt-0.5 text-sm text-slate-600">{Endereco.completo(imovel.endereco)}</p>
        </CardBody>
      </Card>

      <section aria-label="Indicadores do imóvel" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          rotulo="Receita acumulada"
          valor={formatarMoeda(comparativo.receitaTotal)}
          auxiliar={`${periodos.length} ${periodos.length === 1 ? "ocupação" : "ocupações"}`}
          icone={TrendingUp}
          tom="sucesso"
        />
        <StatCard
          rotulo="Taxa de ocupação"
          valor={`${comparativo.taxaOcupacao}%`}
          auxiliar={`${comparativo.diasOcupados} dias ocupado`}
          icone={Percent}
          tom="marca"
        />
        <StatCard
          rotulo="Tempo vago"
          valor={`${comparativo.diasVagos} dias`}
          auxiliar={`≈ ${mesesVagos} meses sem receita`}
          icone={CalendarX2}
          tom={comparativo.diasVagos > 60 ? "alerta" : "neutro"}
        />
        <StatCard
          rotulo="Melhor período"
          valor={
            periodos.find((p) => p.ocupacao.id === comparativo.melhorPeriodoId)?.inquilino.nome.split(" ")[0] ??
            "—"
          }
          auxiliar="Maior receita média mensal"
          icone={Trophy}
          tom="marca"
        />
      </section>

      {periodos.length === 0 ? (
        <Card>
          <EmptyState
            icone={CalendarX2}
            titulo="Sem ocupações registradas"
            descricao="Este imóvel ainda não teve inquilinos, então não há períodos para comparar."
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              titulo="Receita média mensal por ocupação"
              descricao="Compara quanto cada período rendeu por mês, neutralizando durações diferentes."
            />
            <CardBody>
              <GraficoPeriodos periodos={periodos} melhorPeriodoId={comparativo.melhorPeriodoId} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              titulo="Comparativo detalhado"
              descricao="Cada linha é um período de ocupação, em ordem cronológica."
            />
            {/* Mobile: um cartão por período; desktop: tabela comparativa. */}
            <ol className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
              {periodos.map((periodo, indice) => (
                <li key={periodo.ocupacao.id} className="min-w-0 rounded-card border border-line p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Período {indice + 1}</p>
                      <Link
                        href={`/admin/inquilinos/${periodo.inquilino.id}`}
                        className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                      >
                        {periodo.inquilino.nome}
                      </Link>
                    </div>
                    {periodo.ocupacao.id === comparativo.melhorPeriodoId ? (
                      <Badge tom="marca">
                        <Trophy aria-hidden className="size-3" />
                        Melhor
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatarData(periodo.ocupacao.dataEntrada)} —{" "}
                    {periodo.ocupacao.dataSaida ? formatarData(periodo.ocupacao.dataSaida) : "atual"}{" "}
                    · {periodo.duracaoMeses} meses
                  </p>

                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Receita</dt>
                      <dd className="font-semibold tabular-nums text-slate-900">
                        {formatarMoeda(periodo.receitaTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Média/mês</dt>
                      <dd className="font-medium tabular-nums text-slate-900">
                        {formatarMoeda(periodo.receitaMediaMensal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Inadimplência</dt>
                      <dd
                        className={
                          periodo.inadimplencia > 0
                            ? "font-medium tabular-nums text-red-600"
                            : "font-medium tabular-nums text-slate-400"
                        }
                      >
                        {periodo.inadimplencia > 0 ? formatarMoeda(periodo.inadimplencia) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Vacância antes</dt>
                      <dd className="font-medium tabular-nums text-slate-900">
                        {periodo.vacanciaAnteriorDias === null
                          ? "—"
                          : `${periodo.vacanciaAnteriorDias} dias`}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>

            <div className="hidden lg:block">
              <TableWrapper>
                <Table className="min-w-[900px]">
                  <caption className="sr-only">
                    Comparativo de períodos de ocupação do imóvel {imovel.titulo}
                  </caption>
                  <thead>
                    <tr>
                      <Th scope="col">#</Th>
                      <Th scope="col">Inquilino</Th>
                      <Th scope="col">Período</Th>
                      <Th scope="col" className="text-right">Duração</Th>
                      <Th scope="col" className="text-right">Receita total</Th>
                      <Th scope="col" className="text-right">Média mensal</Th>
                      <Th scope="col" className="text-right">Inadimplência</Th>
                      <Th scope="col" className="text-right">Vacância antes</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.map((periodo, indice) => (
                      <Tr key={periodo.ocupacao.id}>
                        <Td className="tabular-nums text-slate-400">{indice + 1}</Td>
                        <Td>
                            <Link
                              href={`/admin/inquilinos/${periodo.inquilino.id}`}
                              className="font-medium text-slate-900 hover:text-brand-700"
                            >
                              {periodo.inquilino.nome}
                            </Link>
                            {periodo.ocupacao.id === comparativo.melhorPeriodoId ? (
                              <Badge tom="marca" className="ml-2">
                                <Trophy aria-hidden className="size-3" />
                                Melhor
                              </Badge>
                            ) : null}
                        </Td>
                        <Td className="whitespace-nowrap text-xs">
                            {formatarData(periodo.ocupacao.dataEntrada)} —{" "}
                            {periodo.ocupacao.dataSaida
                              ? formatarData(periodo.ocupacao.dataSaida)
                              : "atual"}
                        </Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                            {periodo.duracaoMeses} meses
                        </Td>
                        <Td className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                            {formatarMoeda(periodo.receitaTotal)}
                        </Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                            {formatarMoeda(periodo.receitaMediaMensal)}
                        </Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                            {periodo.inadimplencia > 0 ? (
                              <span className="font-medium text-red-600">
                                {formatarMoeda(periodo.inadimplencia)}
                                <span className="ml-1 text-xs font-normal text-slate-500">
                                  ({periodo.taxaInadimplencia}%)
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                        </Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                            {periodo.vacanciaAnteriorDias === null ? (
                              <span className="text-slate-400">—</span>
                            ) : periodo.vacanciaAnteriorDias > 0 ? (
                              <span className="font-medium text-amber-700">
                                {periodo.vacanciaAnteriorDias} dias
                              </span>
                            ) : (
                              <span className="text-emerald-700">sem vacância</span>
                            )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
