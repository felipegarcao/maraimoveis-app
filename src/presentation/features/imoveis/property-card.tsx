import Link from "next/link";
import { Bath, BedDouble, Car, Maximize } from "lucide-react";
import { Imovel, ROTULOS_TIPO_IMOVEL } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { formatarArea, formatarMoeda } from "@/lib/formatters";
import { ImagemImovel } from "@/presentation/components/imagem-imovel";
import { Badge } from "@/presentation/components/ui";

/** Card da vitrine pública. Mobile: 1 coluna; a partir de sm, grid. */
export function PropertyCard({ imovel, prioridade = false }: { imovel: Imovel; prioridade?: boolean }) {
  const capa = Imovel.fotoCapa(imovel);
  const { caracteristicas: c } = imovel;

  return (
    <article className="group overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-shadow hover:shadow-lift">
      <Link href={`/imoveis/${imovel.id}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <ImagemImovel
            src={capa?.url ?? null}
            alt={capa?.descricao ?? imovel.titulo}
            priority={prioridade}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge tom="marca" className="bg-white/95 shadow-sm ring-white/60">
              {ROTULOS_TIPO_IMOVEL[imovel.tipo]}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {Endereco.resumo(imovel.endereco)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
            {imovel.titulo}
          </h3>

          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-lg font-semibold text-slate-900">
              {formatarMoeda(imovel.valorAluguel)}
            </span>
            <span className="text-sm text-slate-500">/mês</span>
          </p>
          {imovel.valorCondominio > 0 ? (
            <p className="text-xs text-slate-500">
              + {formatarMoeda(imovel.valorCondominio)} de condomínio
            </p>
          ) : null}

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs text-slate-600">
            {c.quartos > 0 ? (
              <li className="flex items-center gap-1.5">
                <BedDouble aria-hidden className="size-4 text-slate-400" />
                {c.quartos} <span className="sr-only">quartos</span>
              </li>
            ) : null}
            <li className="flex items-center gap-1.5">
              <Bath aria-hidden className="size-4 text-slate-400" />
              {c.banheiros} <span className="sr-only">banheiros</span>
            </li>
            {c.vagas > 0 ? (
              <li className="flex items-center gap-1.5">
                <Car aria-hidden className="size-4 text-slate-400" />
                {c.vagas} <span className="sr-only">vagas</span>
              </li>
            ) : null}
            <li className="flex items-center gap-1.5">
              <Maximize aria-hidden className="size-4 text-slate-400" />
              {formatarArea(c.areaM2)}
            </li>
          </ul>
        </div>
      </Link>
    </article>
  );
}
