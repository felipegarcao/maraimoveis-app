import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bath,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileText,
  History,
  Home,
  KeyRound,
  Maximize,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Imovel, Inquilino, ROTULOS_FORMA_PAGAMENTO } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import type { CobrancaMensal } from "@/application/dtos";
import {
  formatarArea,
  formatarData,
  formatarMesReferencia,
  formatarMoeda,
} from "@/lib/formatters";
import { siteConfig } from "@/lib/config";
import { ImagemImovel } from "@/presentation/components/imagem-imovel";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
  classesBotao,
} from "@/presentation/components/ui";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { StatusPagamentoBadge } from "@/presentation/features/financeiro/status-pagamento-badge";

export const metadata: Metadata = { title: "Meu portal" };

export default async function PaginaPortal() {
  const sessao = await casosDeUso.portal.sessaoAtual.executar();
  if (!sessao) redirect("/portal/login");

  const painel = await casosDeUso.portal.painel.executar(sessao.id);
  const { inquilino, ocupacaoAtual, imovelAtual, contratoAtual } = painel;

  const mensagemSuporte = `Olá! Aqui é ${inquilino.nome}. Estou falando pelo portal do inquilino e gostaria de ajuda.`;

  // Os 12 meses mais recentes ficam abertos; o resto vai para o recolhível.
  const MESES_VISIVEIS = 12;
  const recentes = painel.cobrancasPagas.slice(0, MESES_VISIVEIS);
  const anteriores = painel.cobrancasPagas.slice(MESES_VISIVEIS);

  return (
    <div className="space-y-5">
      {painel.usandoSenhaPadrao ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ShieldAlert aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Você ainda está usando a senha padrão
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                Sua senha é o seu documento, que outras pessoas podem saber. Defina uma senha só
                sua para proteger seus dados.
              </p>
            </div>
            <Link href="/portal/senha" className={classesBotao("primario", "md", "shrink-0")}>
              <KeyRound aria-hidden className="size-4" />
              Criar minha senha
            </Link>
          </CardBody>
        </Card>
      ) : null}

      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Olá, {Inquilino.primeiroNome(inquilino)}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Aqui você acompanha seu imóvel, seu contrato e a situação dos pagamentos.
        </p>
      </header>

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          rotulo="Em aberto"
          valor={formatarMoeda(painel.totalEmAberto)}
          auxiliar={
            painel.cobrancasPendentes.length > 0
              ? `${painel.cobrancasPendentes.length} ${painel.cobrancasPendentes.length === 1 ? "cobrança pendente" : "cobranças pendentes"}`
              : "Tudo em dia"
          }
          icone={painel.totalEmAberto > 0 ? TriangleAlert : CheckCircle2}
          tom={painel.totalEmAberto > 0 ? "perigo" : "sucesso"}
        />
        <StatCard
          rotulo="Próximo vencimento"
          valor={
            painel.proximaCobranca
              ? formatarData(painel.proximaCobranca.pagamento.dataVencimento)
              : "—"
          }
          auxiliar={
            painel.proximaCobranca
              ? formatarMoeda(painel.proximaCobranca.saldoDevedor)
              : "Nenhuma cobrança aberta"
          }
          icone={CalendarDays}
          tom={painel.proximaCobranca ? "alerta" : "neutro"}
        />
        <StatCard
          rotulo="Total já pago"
          valor={formatarMoeda(painel.totalPago)}
          auxiliar={`${painel.cobrancasPagas.length} ${painel.cobrancasPagas.length === 1 ? "mês quitado" : "meses quitados"}`}
          icone={CircleDollarSign}
          tom="sucesso"
          className="col-span-2 lg:col-span-1"
        />
      </section>

      {/* ---------------------------------------------------------------- imóvel */}
      <Card>
        <CardHeader titulo="Seu imóvel" />
        {ocupacaoAtual && imovelAtual ? (
          <>
            <div className="relative aspect-[16/9] bg-slate-100 sm:aspect-[21/9]">
              <ImagemImovel
                src={Imovel.fotoCapa(imovelAtual)?.url ?? null}
                alt={Imovel.fotoCapa(imovelAtual)?.descricao ?? imovelAtual.titulo}
                sizes="(max-width: 896px) 100vw, 896px"
                priority
              />
            </div>
            <CardBody>
              <h2 className="text-base font-semibold text-slate-900">{imovelAtual.titulo}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {Endereco.completo(imovelAtual.endereco)}
              </p>

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-slate-700">
                {imovelAtual.caracteristicas.quartos > 0 ? (
                  <li className="flex items-center gap-1.5">
                    <BedDouble aria-hidden className="size-4 text-slate-400" />
                    {imovelAtual.caracteristicas.quartos} quartos
                  </li>
                ) : null}
                <li className="flex items-center gap-1.5">
                  <Bath aria-hidden className="size-4 text-slate-400" />
                  {imovelAtual.caracteristicas.banheiros} banheiros
                </li>
                {imovelAtual.caracteristicas.vagas > 0 ? (
                  <li className="flex items-center gap-1.5">
                    <Car aria-hidden className="size-4 text-slate-400" />
                    {imovelAtual.caracteristicas.vagas} vagas
                  </li>
                ) : null}
                <li className="flex items-center gap-1.5">
                  <Maximize aria-hidden className="size-4 text-slate-400" />
                  {formatarArea(imovelAtual.caracteristicas.areaM2)}
                </li>
              </ul>

              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-500">Aluguel combinado</dt>
                  <dd className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatarMoeda(ocupacaoAtual.ocupacao.valorAluguel)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Vencimento</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    todo dia {ocupacaoAtual.ocupacao.diaVencimento}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Morando desde</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {formatarData(ocupacaoAtual.ocupacao.dataEntrada)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Caução</dt>
                  <dd className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatarMoeda(ocupacaoAtual.ocupacao.valorCaucao)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </>
        ) : (
          <EmptyState
            icone={Home}
            titulo="Nenhum imóvel ativo no momento"
            descricao="Você não tem uma ocupação ativa. Seu histórico continua disponível mais abaixo."
          />
        )}
      </Card>

      {/* -------------------------------------------------------------- contrato */}
      <Card>
        <CardHeader titulo="Contrato" />
        {contratoAtual ? (
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-slate-900">
                  Nº {contratoAtual.numero}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Vigência de {formatarData(contratoAtual.condicoes.dataInicio)} a{" "}
                  {formatarData(contratoAtual.condicoes.dataFim)}
                </p>
              </div>
              <a
                href={`/api/contratos/${contratoAtual.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBotao("secundario", "md")}
              >
                <Download aria-hidden className="size-4" />
                Baixar contrato
              </a>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">Prazo</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {contratoAtual.condicoes.prazoMeses} meses
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Reajuste</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {contratoAtual.condicoes.indiceReajuste}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Aluguel</dt>
                <dd className="text-sm font-semibold tabular-nums text-slate-900">
                  {formatarMoeda(contratoAtual.condicoes.valorAluguel)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Caução</dt>
                <dd className="text-sm font-semibold tabular-nums text-slate-900">
                  {formatarMoeda(contratoAtual.condicoes.valorCaucao)}
                </dd>
              </div>
            </dl>

            {contratoAtual.condicoes.clausulasAdicionais ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-600">
                <strong className="font-medium text-slate-800">Cláusulas específicas:</strong>{" "}
                {contratoAtual.condicoes.clausulasAdicionais}
              </p>
            ) : null}
          </CardBody>
        ) : (
          <EmptyState
            icone={FileText}
            titulo="Nenhum contrato disponível"
            descricao="Assim que o contrato desta ocupação for emitido, ele aparece aqui para download."
          />
        )}
      </Card>

      {/* ------------------------------------------------------------ pendências */}
      <Card>
        <CardHeader
          titulo="Pendências"
          descricao={
            painel.totalEmAberto > 0
              ? `Você tem ${formatarMoeda(painel.totalEmAberto)} em aberto.`
              : "Nenhum valor em aberto."
          }
        />
        {painel.cobrancasPendentes.length === 0 ? (
          <EmptyState
            icone={CheckCircle2}
            titulo="Você está em dia"
            descricao="Não há cobranças em aberto no seu nome. Obrigado pela pontualidade!"
          />
        ) : (
          <ul className="divide-y divide-line">
            {painel.cobrancasPendentes.map((cobranca) => (
              <li key={cobranca.pagamento.id} className="px-4 py-4 sm:px-5">
                <LinhaCobranca cobranca={cobranca} />
                <div className="mt-3">
                  <BotaoWhatsApp
                    variante="suave"
                    tamanho="sm"
                    rotulo="Falar sobre esta cobrança"
                    mensagem={`Olá! Aqui é ${inquilino.nome}. Gostaria de falar sobre a cobrança de ${formatarMesReferencia(cobranca.pagamento.mesReferencia)}, no valor de ${formatarMoeda(cobranca.saldoDevedor)}.`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* -------------------------------------------------------- já pago */}
      <Card>
        <CardHeader
          titulo="Pagamentos realizados"
          descricao={`${formatarMoeda(painel.totalPago)} pagos até hoje.`}
        />
        {painel.cobrancasPagas.length === 0 ? (
          <EmptyState
            icone={CircleDollarSign}
            titulo="Nenhum pagamento registrado ainda"
            descricao="Assim que um pagamento for lançado, ele aparece aqui com data e forma."
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {recentes.map((cobranca) => (
                <li key={cobranca.pagamento.id} className="px-4 py-4 sm:px-5">
                  <LinhaCobranca cobranca={cobranca} />
                </li>
              ))}
            </ul>

            {/* Locações longas acumulam dezenas de meses: os antigos ficam
                recolhidos num <details> nativo, sem JavaScript. */}
            {anteriores.length > 0 ? (
              <details className="group border-t border-line">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50/50 sm:px-5">
                  <span className="group-open:hidden">
                    Ver {anteriores.length} meses anteriores
                  </span>
                  <span className="hidden group-open:inline">Recolher meses anteriores</span>
                </summary>
                <ul className="divide-y divide-line border-t border-line">
                  {anteriores.map((cobranca) => (
                    <li key={cobranca.pagamento.id} className="px-4 py-4 sm:px-5">
                      <LinhaCobranca cobranca={cobranca} />
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </Card>

      {/* ------------------------------------------------------------- histórico */}
      {painel.ocupacoesAnteriores.length > 0 ? (
        <Card>
          <CardHeader
            titulo="Imóveis anteriores"
            descricao="Seu histórico de locações continua disponível."
          />
          <ul className="divide-y divide-line">
            {painel.ocupacoesAnteriores.map((detalhe) => (
              <li key={detalhe.ocupacao.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{detalhe.imovel.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{detalhe.imovel.enderecoResumo}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                    <History aria-hidden className="size-3.5 text-slate-400" />
                    {formatarData(detalhe.ocupacao.dataEntrada)} —{" "}
                    {detalhe.ocupacao.dataSaida ? formatarData(detalhe.ocupacao.dataSaida) : "—"} ·{" "}
                    {detalhe.duracaoMeses} meses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatarMoeda(detalhe.financeiro.totalRecebido)}
                  </p>
                  <p className="text-xs text-slate-500">pagos no período</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Precisa de ajuda?</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Fale com a administração da {siteConfig.nome}.
            </p>
          </div>
          <BotaoWhatsApp mensagem={mensagemSuporte} className="shrink-0" />
        </CardBody>
      </Card>
    </div>
  );
}

/** Uma cobrança com a composição do valor e os recebimentos já lançados. */
function LinhaCobranca({ cobranca }: { cobranca: CobrancaMensal }) {
  const { pagamento } = cobranca;
  const itens = [
    { rotulo: "Aluguel", valor: pagamento.valorAluguel },
    { rotulo: "Água", valor: pagamento.valorAgua },
    { rotulo: "Luz", valor: pagamento.valorLuz },
    { rotulo: pagamento.descricaoOutros || "Outros", valor: pagamento.outrosValores },
  ].filter((item) => item.valor > 0);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {formatarMesReferencia(pagamento.mesReferencia)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Vencimento em {formatarData(pagamento.dataVencimento)}
          </p>
        </div>
        <div className="text-right">
          <StatusPagamentoBadge status={cobranca.status} />
          {cobranca.saldoDevedor > 0 ? (
            <p className="mt-1 text-sm font-semibold tabular-nums text-red-600">
              {formatarMoeda(cobranca.saldoDevedor)} em aberto
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700">
              {formatarMoeda(cobranca.valorPago)} pagos
            </p>
          )}
        </div>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {itens.map((item) => (
          <div key={item.rotulo} className="flex gap-1.5">
            <dt className="text-slate-500">{item.rotulo}</dt>
            <dd className="font-medium tabular-nums text-slate-800">{formatarMoeda(item.valor)}</dd>
          </div>
        ))}
        <div className="flex gap-1.5">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {formatarMoeda(cobranca.valorTotal)}
          </dd>
        </div>
      </dl>

      {pagamento.recebimentos.length > 0 ? (
        <ul className="mt-2.5 space-y-1 border-t border-dashed border-line pt-2.5">
          {[...pagamento.recebimentos]
            .sort((a, b) => (a.data > b.data ? -1 : 1))
            .map((recebimento) => (
              <li key={recebimento.id} className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600">
                <CheckCircle2 aria-hidden className="size-3.5 shrink-0 text-emerald-600" />
                <span className="font-medium tabular-nums text-slate-800">
                  {formatarMoeda(recebimento.valor)}
                </span>
                <span>em {formatarData(recebimento.data)}</span>
                <Badge tom="neutro">{ROTULOS_FORMA_PAGAMENTO[recebimento.forma]}</Badge>
              </li>
            ))}
        </ul>
      ) : null}
    </>
  );
}
