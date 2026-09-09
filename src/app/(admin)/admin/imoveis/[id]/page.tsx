import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Car,
  Dog,
  ExternalLink,
  KeyRound,
  Maximize,
  PieChart,
  Sofa,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Imovel, ROTULOS_MOTIVO_SAIDA, ROTULOS_TIPO_IMOVEL } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { ehErroDominio } from "@/domain/errors";
import { formatarArea, formatarData, formatarMoeda } from "@/lib/formatters";
import { ImagemImovel } from "@/presentation/components/imagem-imovel";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  classesBotao,
} from "@/presentation/components/ui";
import { AcoesImovel } from "@/presentation/features/imoveis/acoes-imovel";
import { SeletorStatusImovel } from "@/presentation/features/imoveis/seletor-status";
import { StatusImovelBadge } from "@/presentation/features/imoveis/status-imovel-badge";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const imovel = await casosDeUso.imoveis.obter.executar((await params).id);
    return { title: imovel.titulo };
  } catch {
    return { title: "Imóvel" };
  }
}

export default async function PaginaDetalheImovel({ params }: Props) {
  const { id } = await params;

  let imovel;
  try {
    imovel = await casosDeUso.imoveis.obter.executar(id);
  } catch (erro) {
    if (ehErroDominio(erro)) notFound();
    throw erro;
  }

  const ocupacoes = await casosDeUso.ocupacoes.listar.executar({ imovelId: id });
  const ativa = ocupacoes.find((o) => o.ocupacao.status === "ativa") ?? null;
  const encerradas = ocupacoes.filter((o) => o.ocupacao.status === "encerrada");
  const { caracteristicas: c } = imovel;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/imoveis"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para imóveis
        </Link>
        <div className="flex flex-wrap gap-2">
          {imovel.status === "disponivel" ? (
            <Link
              href={`/imoveis/${imovel.id}`}
              target="_blank"
              className={classesBotao("secundario", "md")}
            >
              <ExternalLink aria-hidden className="size-4" />
              Ver anúncio
            </Link>
          ) : null}
          <Link href={`/admin/relatorios/${imovel.id}`} className={classesBotao("secundario", "md")}>
            <PieChart aria-hidden className="size-4" />
            Relatório
          </Link>
          <AcoesImovel id={imovel.id} titulo={imovel.titulo} />
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              <ImagemImovel
                src={Imovel.fotoCapa(imovel)?.url ?? null}
                alt={Imovel.fotoCapa(imovel)?.descricao ?? imovel.titulo}
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>
            <CardBody>
              <div className="flex flex-wrap items-center gap-2">
                <StatusImovelBadge status={imovel.status} />
                <Badge tom="neutro">{ROTULOS_TIPO_IMOVEL[imovel.tipo]}</Badge>
                {c.mobiliado ? (
                  <Badge tom="info">
                    <Sofa aria-hidden className="size-3.5" />
                    Mobiliado
                  </Badge>
                ) : null}
                {c.aceitaPet ? (
                  <Badge tom="info">
                    <Dog aria-hidden className="size-3.5" />
                    Aceita pet
                  </Badge>
                ) : null}
              </div>

              <h2 className="mt-3 text-xl font-semibold text-slate-900">{imovel.titulo}</h2>
              <p className="mt-1 text-sm text-slate-600">{Endereco.completo(imovel.endereco)}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
                {[
                  { icone: BedDouble, rotulo: "Quartos", valor: `${c.quartos} (${c.suites} suíte${c.suites === 1 ? "" : "s"})` },
                  { icone: Bath, rotulo: "Banheiros", valor: String(c.banheiros) },
                  { icone: Car, rotulo: "Vagas", valor: String(c.vagas) },
                  { icone: Maximize, rotulo: "Área", valor: formatarArea(c.areaM2) },
                ].map(({ icone: Icone, rotulo, valor }) => (
                  <div key={rotulo}>
                    <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
                      <Icone aria-hidden className="size-3.5" />
                      {rotulo}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900">{valor}</dd>
                  </div>
                ))}
              </dl>

              {imovel.descricao ? (
                <p className="mt-4 whitespace-pre-line border-t border-line pt-4 text-sm leading-relaxed text-slate-600">
                  {imovel.descricao}
                </p>
              ) : null}

              {imovel.fotos.length > 1 ? (
                <ul className="no-scrollbar mt-4 flex gap-2 overflow-x-auto border-t border-line pt-4">
                  {Imovel.fotosOrdenadas(imovel).map((foto) => (
                    <li key={foto.id} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <ImagemImovel src={foto.url} alt={foto.descricao} sizes="96px" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              titulo="Histórico de ocupações"
              descricao={`${ocupacoes.length} ${ocupacoes.length === 1 ? "registro" : "registros"} neste imóvel`}
              acoes={
                !ativa ? (
                  <Link
                    href={`/admin/ocupacoes?novaOcupacao=${imovel.id}`}
                    className={classesBotao("primario", "sm")}
                  >
                    <KeyRound aria-hidden className="size-4" />
                    Registrar entrada
                  </Link>
                ) : undefined
              }
            />
            {ocupacoes.length === 0 ? (
              <EmptyState
                icone={KeyRound}
                titulo="Nenhuma ocupação registrada"
                descricao="Quando um inquilino entrar neste imóvel, o período aparecerá aqui com todo o financeiro."
              />
            ) : (
              <ul className="divide-y divide-line">
                {[ativa, ...encerradas].filter(Boolean).map((detalhe) => {
                  const d = detalhe!;
                  return (
                    <li key={d.ocupacao.id} className="px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/inquilinos/${d.inquilino.id}`}
                              className="text-sm font-medium text-slate-900 hover:text-brand-700"
                            >
                              {d.inquilino.nome}
                            </Link>
                            <Badge tom={d.ocupacao.status === "ativa" ? "sucesso" : "neutro"} ponto>
                              {d.ocupacao.status === "ativa" ? "Ativa" : "Encerrada"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatarData(d.ocupacao.dataEntrada)} —{" "}
                            {d.ocupacao.dataSaida ? formatarData(d.ocupacao.dataSaida) : "atual"} ·{" "}
                            {d.duracaoMeses} {d.duracaoMeses === 1 ? "mês" : "meses"}
                          </p>
                          {d.ocupacao.motivoSaida ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Saída: {ROTULOS_MOTIVO_SAIDA[d.ocupacao.motivoSaida]}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-slate-900">
                            {formatarMoeda(d.financeiro.totalRecebido)}
                          </p>
                          <p className="text-xs text-slate-500">recebido</p>
                          {d.financeiro.saldoDevedor > 0 ? (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              {formatarMoeda(d.financeiro.saldoDevedor)} em aberto
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <Link
                          href={`/admin/financeiro?ocupacaoId=${d.ocupacao.id}`}
                          className="font-medium text-brand-700 hover:text-brand-800"
                        >
                          Ver financeiro →
                        </Link>
                        {d.contrato ? (
                          <Link
                            href={`/admin/contratos?ocupacaoId=${d.ocupacao.id}`}
                            className="font-medium text-brand-700 hover:text-brand-800"
                          >
                            Ver contrato →
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Valores mensais
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Aluguel</dt>
                  <dd className="font-medium tabular-nums text-slate-900">
                    {formatarMoeda(imovel.valorAluguel)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Condomínio</dt>
                  <dd className="font-medium tabular-nums text-slate-900">
                    {formatarMoeda(imovel.valorCondominio)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">IPTU</dt>
                  <dd className="font-medium tabular-nums text-slate-900">
                    {formatarMoeda(imovel.valorIptu)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                  <dt className="font-medium text-slate-900">Total</dt>
                  <dd className="font-semibold tabular-nums text-brand-700">
                    {formatarMoeda(Imovel.custoMensalTotal(imovel))}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Situação
                </p>
                <SeletorStatusImovel id={imovel.id} status={imovel.status} />
              </div>
            </CardBody>
          </Card>

          {ativa ? (
            <Card>
              <CardBody>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ocupação atual
                </p>
                <Link
                  href={`/admin/inquilinos/${ativa.inquilino.id}`}
                  className="mt-2 block text-sm font-semibold text-slate-900 hover:text-brand-700"
                >
                  {ativa.inquilino.nome}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  Desde {formatarData(ativa.ocupacao.dataEntrada)}
                </p>
                <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">Aluguel combinado</dt>
                    <dd className="font-medium tabular-nums">
                      {formatarMoeda(ativa.ocupacao.valorAluguel)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">Vencimento</dt>
                    <dd className="font-medium">dia {ativa.ocupacao.diaVencimento}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">Adimplência</dt>
                    <dd className="font-medium tabular-nums">
                      {ativa.financeiro.taxaAdimplencia}%
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/admin/ocupacoes/${ativa.ocupacao.id}`}
                  className={classesBotao("secundario", "md", "mt-4 w-full")}
                >
                  Gerenciar ocupação
                </Link>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
