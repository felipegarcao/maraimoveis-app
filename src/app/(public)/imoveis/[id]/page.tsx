import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Car,
  Check,
  Dog,
  Maximize,
  Sofa,
  Building,
  MapPin,
} from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Imovel, ROTULOS_TIPO_IMOVEL } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { ehErroDominio } from "@/domain/errors";
import { formatarArea, formatarMoeda } from "@/lib/formatters";
import { mensagemInteresseImovel } from "@/lib/whatsapp";
import { Badge, Card, CardBody } from "@/presentation/components/ui";
import { GaleriaImovel } from "@/presentation/features/imoveis/galeria-imovel";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { FormularioContato } from "@/presentation/features/publico/formulario-contato";

type Props = { params: Promise<{ id: string }> };

async function carregar(id: string) {
  try {
    const imovel = await casosDeUso.imoveis.obter.executar(id);
    // A página pública só mostra imóveis anunciados.
    if (!Imovel.ehVisivelAoPublico(imovel)) return null;
    return imovel;
  } catch (erro) {
    if (ehErroDominio(erro)) return null;
    throw erro;
  }
}

/** Sem descrição cadastrada, o endereço é o melhor resumo disponível. */
function resumo(imovel: Imovel): string {
  return (imovel.descricao || Endereco.completo(imovel.endereco)).slice(0, 155);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const imovel = await carregar((await params).id);
  if (!imovel) return { title: "Imóvel não encontrado" };

  return {
    title: imovel.titulo,
    description: resumo(imovel),
    openGraph: {
      title: imovel.titulo,
      description: resumo(imovel),
      images: Imovel.fotoCapa(imovel) ? [{ url: Imovel.fotoCapa(imovel)!.url }] : undefined,
    },
  };
}

export default async function PaginaImovel({ params }: Props) {
  const imovel = await carregar((await params).id);
  if (!imovel) notFound();

  const { caracteristicas: c } = imovel;
  const custoTotal = Imovel.custoMensalTotal(imovel);
  const mensagem = mensagemInteresseImovel(imovel.titulo, Endereco.linha2(imovel.endereco));

  const atributos = [
    c.quartos > 0 && { icone: BedDouble, rotulo: "Quartos", valor: String(c.quartos) },
    c.suites > 0 && { icone: BedDouble, rotulo: "Suítes", valor: String(c.suites) },
    { icone: Bath, rotulo: "Banheiros", valor: String(c.banheiros) },
    c.vagas > 0 && { icone: Car, rotulo: "Vagas", valor: String(c.vagas) },
    { icone: Maximize, rotulo: "Área", valor: formatarArea(c.areaM2) },
    { icone: Building, rotulo: "Tipo", valor: ROTULOS_TIPO_IMOVEL[imovel.tipo] },
  ].filter(Boolean) as { icone: typeof BedDouble; rotulo: string; valor: string }[];

  const diferenciais = [
    c.mobiliado && { icone: Sofa, texto: "Mobiliado" },
    c.aceitaPet && { icone: Dog, texto: "Aceita pet" },
    c.condominio && { icone: Building, texto: "Condomínio com portaria" },
  ].filter(Boolean) as { icone: typeof Sofa; texto: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para os imóveis
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0">
          <GaleriaImovel fotos={Imovel.fotosOrdenadas(imovel)} titulo={imovel.titulo} />

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tom="marca">{ROTULOS_TIPO_IMOVEL[imovel.tipo]}</Badge>
              <Badge tom="sucesso" ponto>
                Disponível
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {imovel.titulo}
            </h1>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-400" />
              {Endereco.completo(imovel.endereco)}
            </p>
          </header>

          <section aria-labelledby="caracteristicas" className="mt-6">
            <h2 id="caracteristicas" className="sr-only">
              Características
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {atributos.map(({ icone: Icone, rotulo, valor }) => (
                <div key={rotulo} className="rounded-card border border-line bg-surface p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Icone aria-hidden className="size-3.5" />
                    {rotulo}
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">{valor}</dd>
                </div>
              ))}
            </dl>

            {diferenciais.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {diferenciais.map(({ icone: Icone, texto }) => (
                  <li key={texto}>
                    <Badge tom="info">
                      <Icone aria-hidden className="size-3.5" />
                      {texto}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {imovel.descricao ? (
            <section aria-labelledby="descricao" className="mt-8">
              <h2 id="descricao" className="text-lg font-semibold text-slate-900">
                Sobre o imóvel
              </h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">
                {imovel.descricao}
              </p>
            </section>
          ) : null}

          <section aria-labelledby="contato-imovel" className="mt-10 lg:hidden">
            <h2 id="contato-imovel" className="text-lg font-semibold text-slate-900">
              Tenho interesse
            </h2>
            <Card className="mt-3">
              <CardBody>
                <FormularioContato imovelId={imovel.id} imovelTitulo={imovel.titulo} />
              </CardBody>
            </Card>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Valor do aluguel
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-slate-900">
                  {formatarMoeda(imovel.valorAluguel)}
                </span>
                <span className="text-sm text-slate-500">/mês</span>
              </p>

              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                {imovel.valorCondominio > 0 ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">Condomínio</dt>
                    <dd className="font-medium text-slate-900">
                      {formatarMoeda(imovel.valorCondominio)}
                    </dd>
                  </div>
                ) : null}
                {imovel.valorIptu > 0 ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">IPTU (mensal)</dt>
                    <dd className="font-medium text-slate-900">{formatarMoeda(imovel.valorIptu)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                  <dt className="font-medium text-slate-900">Total mensal</dt>
                  <dd className="font-semibold text-brand-700">{formatarMoeda(custoTotal)}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2">
                <BotaoWhatsApp mensagem={mensagem} tamanho="lg" className="w-full" />
                <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Check aria-hidden className="size-3.5 text-emerald-600" />
                  Resposta rápida em horário comercial
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="mt-4 hidden lg:block">
            <CardBody>
              <h2 className="text-base font-semibold text-slate-900">Tenho interesse</h2>
              <p className="mt-1 text-sm text-slate-500">
                Preencha e retornamos por e-mail ou telefone.
              </p>
              <div className="mt-4">
                <FormularioContato imovelId={imovel.id} imovelTitulo={imovel.titulo} />
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
