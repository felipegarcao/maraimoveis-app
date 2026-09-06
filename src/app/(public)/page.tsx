import { Suspense } from "react";
import { Home as HomeIcon, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import type { FiltroImoveis } from "@/domain/repositories";
import type { TipoImovel } from "@/domain/entities";
import { TIPOS_IMOVEL } from "@/domain/entities";
import { EmptyState } from "@/presentation/components/ui";
import { FiltrosVitrine, type ValoresFiltro } from "@/presentation/features/imoveis/filtros-vitrine";
import { PropertyCard } from "@/presentation/features/imoveis/property-card";
import { siteConfig } from "@/lib/config";

type ParametrosBusca = Promise<Record<string, string | string[] | undefined>>;

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export default async function PaginaHome({ searchParams }: { searchParams: ParametrosBusca }) {
  const params = await searchParams;

  const valores: ValoresFiltro = {
    termo: texto(params.termo),
    cidade: texto(params.cidade),
    bairro: texto(params.bairro),
    tipo: texto(params.tipo),
    precoMax: texto(params.precoMax),
    quartosMin: texto(params.quartosMin),
  };

  const tipoValido = TIPOS_IMOVEL.includes(valores.tipo as TipoImovel)
    ? (valores.tipo as TipoImovel)
    : undefined;

  const filtro: Omit<FiltroImoveis, "status"> = {
    termo: valores.termo || undefined,
    cidade: valores.cidade || undefined,
    bairro: valores.bairro || undefined,
    tipo: tipoValido,
    precoMax: valores.precoMax ? Number(valores.precoMax) : undefined,
    quartosMin: valores.quartosMin ? Number(valores.quartosMin) : undefined,
  };

  const [imoveis, localidades] = await Promise.all([
    casosDeUso.imoveis.listarDisponiveis.executar(filtro),
    casosDeUso.imoveis.listarLocalidades.executar(),
  ]);

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-brand-50/80 to-canvas">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
            <Sparkles aria-hidden className="size-3.5" />
            Imóveis selecionados e prontos para morar
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Encontre o imóvel certo para alugar, sem burocracia
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {siteConfig.descricao} Fale direto com a gente pelo WhatsApp e agende sua visita.
          </p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { icone: ShieldCheck, titulo: "Contrato transparente", texto: "Sem taxas escondidas." },
              { icone: MapPin, titulo: "Imóveis bem localizados", texto: "São Paulo e região do ABC." },
              { icone: HomeIcon, titulo: "Atendimento próximo", texto: "Resposta no mesmo dia." },
            ].map(({ icone: Icone, titulo, texto: descricao }) => (
              <li
                key={titulo}
                className="flex items-start gap-3 rounded-card border border-line bg-surface/70 p-3.5 backdrop-blur"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icone aria-hidden className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{titulo}</span>
                  <span className="block text-xs text-slate-600">{descricao}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<div className="h-40 rounded-card border border-line bg-surface" />}>
          <FiltrosVitrine
            cidades={localidades.cidades}
            bairros={localidades.bairros}
            valores={valores}
            totalResultados={imoveis.length}
          />
        </Suspense>

        {imoveis.length === 0 ? (
          <div className="mt-6 rounded-card border border-line bg-surface shadow-soft">
            <EmptyState
              icone={HomeIcon}
              titulo="Nenhum imóvel encontrado"
              descricao="Não encontramos imóveis com esses filtros. Tente ampliar a busca ou fale com a gente — podemos ter algo chegando."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {imoveis.map((imovel, indice) => (
              <PropertyCard key={imovel.id} imovel={imovel} prioridade={indice < 3} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
