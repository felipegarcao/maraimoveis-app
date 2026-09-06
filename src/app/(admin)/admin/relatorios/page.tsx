import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, PieChart } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Endereco } from "@/domain/value-objects";
import { formatarMoeda } from "@/lib/formatters";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Table,
  TableWrapper,
  Td,
  Th,
  Tr,
} from "@/presentation/components/ui";
import { GraficoReceitaMensal } from "@/presentation/features/relatorios/grafico-receita-mensal";
import { StatusImovelBadge } from "@/presentation/features/imoveis/status-imovel-badge";

export const metadata: Metadata = { title: "Relatórios" };

export default async function PaginaRelatorios() {
  const [imoveis, receitaMensal] = await Promise.all([
    casosDeUso.imoveis.listar.executar(),
    casosDeUso.relatorios.receitaMensal.executar(12),
  ]);

  // Um comparativo por imóvel, para ranquear a carteira inteira.
  const comparativos = await Promise.all(
    imoveis.map((imovel) => casosDeUso.relatorios.compararPeriodos.executar(imovel.id)),
  );

  const comHistorico = comparativos
    .filter((c) => c.periodos.length > 0)
    .sort((a, b) => b.receitaTotal - a.receitaTotal);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          titulo="Receita da carteira"
          descricao="Cobrado x recebido nos últimos 12 meses, somando todos os imóveis."
        />
        <CardBody>
          <GraficoReceitaMensal dados={receitaMensal} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          titulo="Desempenho por imóvel"
          descricao="Clique em um imóvel para comparar seus períodos de ocupação em detalhe."
        />
        {comHistorico.length === 0 ? (
          <EmptyState
            icone={PieChart}
            titulo="Ainda não há histórico para comparar"
            descricao="Assim que houver ocupações registradas, os comparativos por período aparecem aqui."
          />
        ) : (
          <>
            {/* Mobile: cartões. Desktop: tabela comparativa. */}
            <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
              {comHistorico.map((comparativo) => (
                <li key={comparativo.imovel.id} className="min-w-0">
                  <Link
                    href={`/admin/relatorios/${comparativo.imovel.id}`}
                    className="block min-w-0 rounded-card border border-line p-3.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                        {comparativo.imovel.titulo}
                      </p>
                      <StatusImovelBadge status={comparativo.imovel.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {Endereco.resumo(comparativo.imovel.endereco)}
                    </p>
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 text-xs">
                      <div>
                        <dt className="text-slate-500">Receita</dt>
                        <dd className="font-semibold tabular-nums text-slate-900">
                          {formatarMoeda(comparativo.receitaTotal)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Ocupação</dt>
                        <dd className="font-medium tabular-nums text-slate-900">
                          {comparativo.taxaOcupacao}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Dias vagos</dt>
                        <dd className="font-medium tabular-nums text-slate-900">
                          {comparativo.diasVagos}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Períodos</dt>
                        <dd className="font-medium tabular-nums text-slate-900">
                          {comparativo.periodos.length}
                        </dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden lg:block">
              <TableWrapper>
            <Table className="min-w-[760px]">
              <thead>
                <tr>
                  <Th scope="col">Imóvel</Th>
                  <Th scope="col">Situação</Th>
                  <Th scope="col" className="text-right">Ocupações</Th>
                  <Th scope="col" className="text-right">Receita total</Th>
                  <Th scope="col" className="text-right">Taxa de ocupação</Th>
                  <Th scope="col" className="text-right">Dias vagos</Th>
                  <Th scope="col"><span className="sr-only">Abrir</span></Th>
                </tr>
              </thead>
              <tbody>
                {comHistorico.map((comparativo) => (
                  <Tr key={comparativo.imovel.id}>
                    <Td>
                      <Link
                        href={`/admin/relatorios/${comparativo.imovel.id}`}
                        className="block max-w-[260px] truncate font-medium text-slate-900 hover:text-brand-700"
                      >
                        {comparativo.imovel.titulo}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {Endereco.resumo(comparativo.imovel.endereco)}
                      </span>
                    </Td>
                    <Td><StatusImovelBadge status={comparativo.imovel.status} /></Td>
                    <Td className="text-right tabular-nums">{comparativo.periodos.length}</Td>
                    <Td className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                      {formatarMoeda(comparativo.receitaTotal)}
                    </Td>
                    <Td className="text-right tabular-nums">{comparativo.taxaOcupacao}%</Td>
                    <Td className="text-right tabular-nums">
                      {comparativo.diasVagos > 0 ? (
                        <span className="font-medium text-amber-700">{comparativo.diasVagos}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/relatorios/${comparativo.imovel.id}`}
                        aria-label={`Abrir relatório de ${comparativo.imovel.titulo}`}
                        className="flex justify-end text-slate-400 hover:text-brand-700"
                      >
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
              </TableWrapper>
            </div>
          </>
        )}
      </Card>

      {imoveis.length > comHistorico.length ? (
        <Card>
          <CardHeader
            titulo="Imóveis sem histórico"
            descricao="Ainda não tiveram nenhuma ocupação registrada."
          />
          <CardBody>
            <ul className="flex flex-wrap gap-2">
              {imoveis
                .filter((imovel) => !comHistorico.some((c) => c.imovel.id === imovel.id))
                .map((imovel) => (
                  <li key={imovel.id}>
                    <Link
                      href={`/admin/imoveis/${imovel.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50"
                    >
                      <Building2 aria-hidden className="size-3.5 text-slate-400" />
                      {imovel.titulo}
                    </Link>
                  </li>
                ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
