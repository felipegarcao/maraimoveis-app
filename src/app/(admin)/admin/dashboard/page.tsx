import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  FileWarning,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { formatarMesReferencia, formatarMoeda, formatarTempoRelativo } from "@/lib/formatters";
import { mensagemCobranca } from "@/lib/whatsapp";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
  classesBotao,
} from "@/presentation/components/ui";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { StatusPagamentoBadge } from "@/presentation/features/financeiro/status-pagamento-badge";
import { GraficoReceitaMensal } from "@/presentation/features/relatorios/grafico-receita-mensal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PaginaDashboard() {
  const [indicadores, leads] = await Promise.all([
    casosDeUso.relatorios.indicadores.executar(),
    casosDeUso.leads.listar.executar({ status: "novo" }),
  ]);

  const aReceber = Math.max(0, indicadores.receitaMesAtual - indicadores.recebidoMesAtual);

  return (
    <div className="space-y-5">
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          rotulo="Taxa de ocupação"
          valor={`${indicadores.taxaOcupacao}%`}
          auxiliar={`${indicadores.imoveisAlugados} de ${indicadores.totalImoveis} imóveis alugados`}
          icone={Building2}
          tom="marca"
        />
        <StatCard
          rotulo="Receita do mês"
          valor={formatarMoeda(indicadores.receitaMesAtual)}
          auxiliar={`${formatarMoeda(indicadores.recebidoMesAtual)} já recebidos`}
          icone={TrendingUp}
          tom="sucesso"
        />
        <StatCard
          rotulo="A receber no mês"
          valor={formatarMoeda(aReceber)}
          auxiliar={aReceber > 0 ? "Cobranças ainda em aberto" : "Mês totalmente quitado"}
          icone={CircleDollarSign}
          tom={aReceber > 0 ? "alerta" : "sucesso"}
        />
        <StatCard
          rotulo="Inadimplência total"
          valor={formatarMoeda(indicadores.inadimplenciaTotal)}
          auxiliar={`${indicadores.cobrancasEmAtraso} cobranças em atraso`}
          icone={AlertTriangle}
          tom={indicadores.cobrancasEmAtraso > 0 ? "perigo" : "neutro"}
        />
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader
            titulo="Receita dos últimos 12 meses"
            descricao="Quanto foi cobrado e quanto entrou de fato, mês a mês."
          />
          <CardBody>
            <GraficoReceitaMensal dados={indicadores.receitaPorMes} />
          </CardBody>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              titulo="Precisa de atenção"
              descricao="Cobranças vencidas com maior saldo em aberto."
              acoes={
                <Link href="/admin/financeiro?status=atrasado" className={classesBotao("secundario", "sm")}>
                  Ver todas
                </Link>
              }
            />
            {indicadores.cobrancasCriticas.length === 0 ? (
              <EmptyState
                icone={CircleDollarSign}
                titulo="Nenhuma cobrança em atraso"
                descricao="Todos os inquilinos estão em dia. Bom trabalho!"
              />
            ) : (
              <ul className="divide-y divide-line">
                {indicadores.cobrancasCriticas.map((cobranca) => (
                  <li key={cobranca.pagamento.id} className="flex flex-col gap-3 px-4 py-3.5 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {cobranca.inquilino.nome}
                        </p>
                        <p className="truncate text-xs text-slate-500">{cobranca.imovel.titulo}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatarMesReferencia(cobranca.pagamento.mesReferencia)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-red-600">
                          {formatarMoeda(cobranca.saldoDevedor)}
                        </p>
                        <div className="mt-1">
                          <StatusPagamentoBadge status={cobranca.status} />
                        </div>
                      </div>
                    </div>
                    <BotaoWhatsApp
                      telefone={cobranca.inquilino.telefone}
                      rotulo="Cobrar no WhatsApp"
                      tamanho="sm"
                      variante="suave"
                      mensagem={mensagemCobranca(
                        cobranca.inquilino.nome.split(" ")[0],
                        formatarMesReferencia(cobranca.pagamento.mesReferencia),
                        formatarMoeda(cobranca.saldoDevedor),
                      )}
                      className="self-start"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              titulo="Leads novos"
              descricao={`${indicadores.leadsNovos} contatos aguardando retorno`}
              acoes={
                <Link href="/admin/leads" className={classesBotao("secundario", "sm")}>
                  Ver todos
                </Link>
              }
            />
            {leads.length === 0 ? (
              <EmptyState
                icone={Inbox}
                titulo="Nenhum lead novo"
                descricao="Os contatos recebidos pelo site aparecem aqui."
              />
            ) : (
              <ul className="divide-y divide-line">
                {leads.slice(0, 4).map((lead) => (
                  <li key={lead.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-900">{lead.nome}</p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatarTempoRelativo(lead.criadoEm)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {lead.mensagem}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {indicadores.contratosVencendo > 0 ? (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardBody className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <FileWarning aria-hidden className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {indicadores.contratosVencendo}{" "}
                    {indicadores.contratosVencendo === 1 ? "contrato vence" : "contratos vencem"} em
                    até 2 meses
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Combine a renovação ou o encerramento com antecedência.
                  </p>
                  <Link
                    href="/admin/contratos?status=vigente"
                    className="mt-2 inline-block text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    Revisar contratos →
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
