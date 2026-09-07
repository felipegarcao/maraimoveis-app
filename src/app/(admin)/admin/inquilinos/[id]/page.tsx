import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileText,
  History,
  Mail,
  Phone,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Inquilino, ROTULOS_MOTIVO_SAIDA } from "@/domain/entities";
import { ehErroDominio } from "@/domain/errors";
import {
  formatarCpfCnpj,
  formatarData,
  formatarMoeda,
  formatarTelefone,
} from "@/lib/formatters";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
  classesBotao,
} from "@/presentation/components/ui";
import { AcessoPortalInquilino } from "@/presentation/features/inquilinos/acesso-portal";
import { AcoesInquilino } from "@/presentation/features/inquilinos/acoes-inquilino";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const inquilino = await casosDeUso.inquilinos.obter.executar((await params).id);
    return { title: inquilino.nome };
  } catch {
    return { title: "Inquilino" };
  }
}

export default async function PaginaDetalheInquilino({ params }: Props) {
  const { id } = await params;

  let historico;
  try {
    historico = await casosDeUso.inquilinos.historico.executar(id);
  } catch (erro) {
    if (ehErroDominio(erro)) notFound();
    throw erro;
  }

  const acessoPortal = await casosDeUso.portal.consultarAcesso.executar(id);

  const { inquilino, ocupacoes, ocupacaoAtual } = historico;
  const anteriores = ocupacoes.filter((o) => o.ocupacao.status === "encerrada");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/inquilinos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para inquilinos
        </Link>
        <div className="flex flex-wrap gap-2">
          <BotaoWhatsApp
            telefone={inquilino.telefone}
            mensagem={`Olá, ${Inquilino.primeiroNome(inquilino)}!`}
          />
          <AcoesInquilino id={inquilino.id} nome={inquilino.nome} />
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700">
            {Inquilino.iniciais(inquilino)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{inquilino.nome}</h2>
              <Badge tom={inquilino.ativo ? "sucesso" : "neutro"} ponto>
                {inquilino.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Documento</dt>
                <dd className="tabular-nums">{formatarCpfCnpj(inquilino.documento)}</dd>
              </div>
              {inquilino.rg ? (
                <div className="flex items-center gap-1.5">
                  <dt className="text-slate-400">RG</dt>
                  <dd className="tabular-nums">{inquilino.rg}</dd>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <dt><Phone aria-hidden className="size-3.5 text-slate-400" /><span className="sr-only">Telefone</span></dt>
                <dd>{formatarTelefone(inquilino.telefone)}</dd>
              </div>
              {inquilino.email ? (
                <div className="flex items-center gap-1.5">
                  <dt><Mail aria-hidden className="size-3.5 text-slate-400" /><span className="sr-only">E-mail</span></dt>
                  <dd className="break-all">{inquilino.email}</dd>
                </div>
              ) : null}
              {inquilino.profissao ? (
                <div>
                  <dt className="sr-only">Profissão</dt>
                  <dd>{inquilino.profissao}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </CardBody>
      </Card>

      <section aria-label="Resumo do histórico" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          rotulo="Imóveis ocupados"
          valor={String(ocupacoes.length)}
          auxiliar={ocupacaoAtual ? "1 ocupação ativa" : "Nenhuma ocupação ativa"}
          icone={Building2}
          tom="marca"
        />
        <StatCard
          rotulo="Tempo como inquilino"
          valor={`${historico.mesesComoInquilino} meses`}
          auxiliar="Somando todos os períodos"
          icone={CalendarClock}
        />
        <StatCard
          rotulo="Total pago"
          valor={formatarMoeda(historico.totalPago)}
          auxiliar="Aluguel, água, luz e extras"
          icone={CircleDollarSign}
          tom="sucesso"
        />
        <StatCard
          rotulo="Em aberto"
          valor={formatarMoeda(historico.saldoDevedorTotal)}
          auxiliar={historico.saldoDevedorTotal > 0 ? "Requer cobrança" : "Tudo quitado"}
          icone={CircleDollarSign}
          tom={historico.saldoDevedorTotal > 0 ? "perigo" : "sucesso"}
        />
      </section>

      <Card>
        <AcessoPortalInquilino
          inquilinoId={inquilino.id}
          nome={inquilino.nome}
          documento={inquilino.documento}
          definiuSenha={acessoPortal.definiuSenha}
          atualizadoEm={acessoPortal.atualizadoEm}
        />
      </Card>

      {inquilino.observacoes ? (
        <Card>
          <CardHeader titulo="Observações internas" />
          <CardBody>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {inquilino.observacoes}
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          titulo="Histórico de imóveis"
          descricao="Todos os períodos em que este inquilino ocupou um imóvel, inclusive os encerrados."
        />
        {ocupacoes.length === 0 ? (
          <EmptyState
            icone={History}
            titulo="Nenhuma ocupação registrada"
            descricao="Vincule este inquilino a um imóvel para começar o histórico."
            acao={
              <Link href="/admin/ocupacoes" className={classesBotao("primario", "md")}>
                Registrar entrada
              </Link>
            }
          />
        ) : (
          <ol className="divide-y divide-line">
            {[...(ocupacaoAtual ? [ocupacaoAtual] : []), ...anteriores].map((detalhe) => (
              <li key={detalhe.ocupacao.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/imoveis/${detalhe.imovel.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-brand-700"
                      >
                        {detalhe.imovel.titulo}
                      </Link>
                      <Badge tom={detalhe.ocupacao.status === "ativa" ? "sucesso" : "neutro"} ponto>
                        {detalhe.ocupacao.status === "ativa" ? "Ocupação ativa" : "Encerrada"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{detalhe.imovel.enderecoResumo}</p>
                    <p className="mt-1.5 text-xs text-slate-600">
                      {formatarData(detalhe.ocupacao.dataEntrada)} —{" "}
                      {detalhe.ocupacao.dataSaida
                        ? formatarData(detalhe.ocupacao.dataSaida)
                        : "atual"}{" "}
                      · {detalhe.duracaoMeses} {detalhe.duracaoMeses === 1 ? "mês" : "meses"} ·
                      aluguel {formatarMoeda(detalhe.ocupacao.valorAluguel)}
                    </p>
                    {detalhe.ocupacao.motivoSaida ? (
                      <p className="mt-1 text-xs text-slate-500">
                        <strong className="font-medium">Motivo da saída:</strong>{" "}
                        {ROTULOS_MOTIVO_SAIDA[detalhe.ocupacao.motivoSaida]}
                      </p>
                    ) : null}
                    {detalhe.ocupacao.condicoesEntrega ? (
                      <p className="mt-1 max-w-prose text-xs leading-relaxed text-slate-500">
                        <strong className="font-medium">Condições de entrega:</strong>{" "}
                        {detalhe.ocupacao.condicoesEntrega}
                      </p>
                    ) : null}
                  </div>

                  <dl className="shrink-0 space-y-0.5 text-right">
                    <div>
                      <dt className="text-xs text-slate-500">Recebido</dt>
                      <dd className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatarMoeda(detalhe.financeiro.totalRecebido)}
                      </dd>
                    </div>
                    {detalhe.financeiro.saldoDevedor > 0 ? (
                      <div>
                        <dt className="text-xs text-slate-500">Em aberto</dt>
                        <dd className="text-sm font-semibold tabular-nums text-red-600">
                          {formatarMoeda(detalhe.financeiro.saldoDevedor)}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs text-slate-500">Adimplência</dt>
                      <dd className="text-sm font-medium tabular-nums text-slate-700">
                        {detalhe.financeiro.taxaAdimplencia}%
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/financeiro?ocupacaoId=${detalhe.ocupacao.id}`}
                    className={classesBotao("secundario", "sm")}
                  >
                    <CircleDollarSign aria-hidden className="size-4" />
                    Financeiro do período
                  </Link>
                  {detalhe.contrato ? (
                    <Link
                      href={`/admin/contratos?ocupacaoId=${detalhe.ocupacao.id}`}
                      className={classesBotao("secundario", "sm")}
                    >
                      <FileText aria-hidden className="size-4" />
                      Contrato {detalhe.contrato.numero}
                    </Link>
                  ) : null}
                  <Link
                    href={`/admin/ocupacoes/${detalhe.ocupacao.id}`}
                    className={classesBotao("fantasma", "sm")}
                  >
                    Detalhes da ocupação →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
