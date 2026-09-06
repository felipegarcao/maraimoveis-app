import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Percent,
  User,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { ROTULOS_MOTIVO_SAIDA } from "@/domain/entities";
import { ehErroDominio } from "@/domain/errors";
import { formatarData, formatarMoeda, formatarTelefone } from "@/lib/formatters";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  StatCard,
  classesBotao,
} from "@/presentation/components/ui";
import { BotaoRegistrarSaida } from "@/presentation/features/ocupacoes/botao-registrar-saida";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { StatusContratoBadge } from "@/presentation/features/contratos/status-contrato-badge";

export const metadata: Metadata = { title: "Ocupação" };

export default async function PaginaDetalheOcupacao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detalhe;
  try {
    detalhe = await casosDeUso.ocupacoes.obter.executar(id);
  } catch (erro) {
    if (ehErroDominio(erro)) notFound();
    throw erro;
  }

  const { ocupacao, imovel, inquilino, contrato, financeiro } = detalhe;
  const ativa = ocupacao.status === "ativa";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/ocupacoes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para ocupações
        </Link>
        <div className="flex flex-wrap gap-2">
          <BotaoWhatsApp
            telefone={inquilino.telefone}
            mensagem={`Olá, ${inquilino.nome.split(" ")[0]}!`}
            variante="secundario"
          />
          <Link
            href={`/admin/financeiro?ocupacaoId=${ocupacao.id}`}
            className={classesBotao("secundario", "md")}
          >
            <CircleDollarSign aria-hidden className="size-4" />
            Financeiro
          </Link>
          {ativa ? (
            <BotaoRegistrarSaida ocupacaoId={ocupacao.id} saldoDevedor={financeiro.saldoDevedor} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <User aria-hidden className="size-3.5" />
              Inquilino
            </p>
            <Link
              href={`/admin/inquilinos/${inquilino.id}`}
              className="mt-1 block text-base font-semibold text-slate-900 hover:text-brand-700"
            >
              {inquilino.nome}
            </Link>
            <p className="mt-0.5 text-sm text-slate-600">{formatarTelefone(inquilino.telefone)}</p>
            {inquilino.email ? (
              <p className="text-sm text-slate-600">{inquilino.email}</p>
            ) : null}
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Building2 aria-hidden className="size-3.5" />
              Imóvel
            </p>
            <Link
              href={`/admin/imoveis/${imovel.id}`}
              className="mt-1 block text-base font-semibold text-slate-900 hover:text-brand-700"
            >
              {imovel.titulo}
            </Link>
            <p className="mt-0.5 text-sm text-slate-600">{imovel.enderecoResumo}</p>
          </div>

          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Badge tom={ativa ? "sucesso" : "neutro"} ponto>
                {ativa ? "Ocupação ativa" : "Ocupação encerrada"}
              </Badge>
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <CalendarDays aria-hidden className="size-4 text-slate-400" />
                {formatarData(ocupacao.dataEntrada)} —{" "}
                {ocupacao.dataSaida ? formatarData(ocupacao.dataSaida) : "atual"} ·{" "}
                {detalhe.duracaoMeses} {detalhe.duracaoMeses === 1 ? "mês" : "meses"}
              </p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">Aluguel combinado</dt>
                <dd className="text-sm font-semibold tabular-nums text-slate-900">
                  {formatarMoeda(ocupacao.valorAluguel)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Vencimento</dt>
                <dd className="text-sm font-semibold text-slate-900">dia {ocupacao.diaVencimento}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Caução</dt>
                <dd className="text-sm font-semibold tabular-nums text-slate-900">
                  {formatarMoeda(ocupacao.valorCaucao)}
                </dd>
              </div>
              {ocupacao.motivoSaida ? (
                <div>
                  <dt className="text-xs text-slate-500">Motivo da saída</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {ROTULOS_MOTIVO_SAIDA[ocupacao.motivoSaida]}
                  </dd>
                </div>
              ) : null}
            </dl>

            {ocupacao.observacoes ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-600">
                <strong className="font-medium text-slate-800">Observações:</strong>{" "}
                {ocupacao.observacoes}
              </p>
            ) : null}

            {ocupacao.condicoesEntrega ? (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-600">
                <strong className="font-medium text-slate-800">Condições de entrega:</strong>{" "}
                {ocupacao.condicoesEntrega}
              </p>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <section aria-label="Resumo financeiro" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          rotulo="Total cobrado"
          valor={formatarMoeda(financeiro.totalCobrado)}
          auxiliar={`${financeiro.mesesCobrados} meses lançados`}
          icone={CircleDollarSign}
        />
        <StatCard
          rotulo="Total recebido"
          valor={formatarMoeda(financeiro.totalRecebido)}
          icone={CircleDollarSign}
          tom="sucesso"
        />
        <StatCard
          rotulo="Em aberto"
          valor={formatarMoeda(financeiro.saldoDevedor)}
          auxiliar={`${financeiro.mesesEmAberto} meses pendentes`}
          icone={CircleDollarSign}
          tom={financeiro.saldoDevedor > 0 ? "perigo" : "sucesso"}
        />
        <StatCard
          rotulo="Adimplência"
          valor={`${financeiro.taxaAdimplencia}%`}
          icone={Percent}
          tom={financeiro.taxaAdimplencia >= 95 ? "sucesso" : "alerta"}
        />
      </section>

      <Card>
        <CardHeader
          titulo="Contrato"
          acoes={
            <Link
              href={`/admin/contratos?ocupacaoId=${ocupacao.id}`}
              className={classesBotao("secundario", "sm")}
            >
              <FileText aria-hidden className="size-4" />
              {contrato ? "Ver contrato" : "Gerar contrato"}
            </Link>
          }
        />
        <CardBody>
          {contrato ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  Contrato nº {contrato.numero}
                  <StatusContratoBadge status={contrato.status} />
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Vigência {formatarData(contrato.condicoes.dataInicio)} a{" "}
                  {formatarData(contrato.condicoes.dataFim)} · {contrato.condicoes.prazoMeses} meses
                  · reajuste {contrato.condicoes.indiceReajuste}
                </p>
              </div>
              {contrato.arquivoPdfUrl ? (
                <a
                  href={contrato.arquivoPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classesBotao("suave", "sm")}
                >
                  Abrir PDF
                </a>
              ) : (
                <Badge tom="alerta">PDF ainda não gerado</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Nenhum contrato vinculado a esta ocupação ainda.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
