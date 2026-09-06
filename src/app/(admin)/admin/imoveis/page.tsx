import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import {
  Imovel,
  ROTULOS_TIPO_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  type StatusImovel,
  type TipoImovel,
} from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { formatarArea, formatarMoeda } from "@/lib/formatters";
import { ImagemImovel } from "@/presentation/components/imagem-imovel";
import {
  Card,
  EmptyState,
  Table,
  TableWrapper,
  Td,
  Th,
  Tr,
  classesBotao,
} from "@/presentation/components/ui";
import { AcoesImovel } from "@/presentation/features/imoveis/acoes-imovel";
import { FiltrosAdminImoveis } from "@/presentation/features/imoveis/filtros-admin";
import { StatusImovelBadge } from "@/presentation/features/imoveis/status-imovel-badge";

export const metadata: Metadata = { title: "Imóveis" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PaginaImoveis({ searchParams }: Props) {
  const params = await searchParams;
  const termo = texto(params.termo);
  const status = texto(params.status);
  const tipo = texto(params.tipo);

  const imoveis = await casosDeUso.imoveis.listar.executar({
    termo: termo || undefined,
    status: STATUS_IMOVEL.includes(status as StatusImovel) ? (status as StatusImovel) : undefined,
    tipo: TIPOS_IMOVEL.includes(tipo as TipoImovel) ? (tipo as TipoImovel) : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {imoveis.length} {imoveis.length === 1 ? "imóvel cadastrado" : "imóveis cadastrados"}
        </p>
        <Link href="/admin/imoveis/novo" className={classesBotao("primario", "md")}>
          <Plus aria-hidden className="size-4" />
          Novo imóvel
        </Link>
      </div>

      <Card className="p-4 sm:p-5">
        <FiltrosAdminImoveis termo={termo} status={status} tipo={tipo} />
      </Card>

      {imoveis.length === 0 ? (
        <Card>
          <EmptyState
            icone={Building2}
            titulo="Nenhum imóvel encontrado"
            descricao={
              termo || status || tipo
                ? "Nenhum imóvel corresponde aos filtros aplicados. Tente ampliar a busca."
                : "Cadastre o primeiro imóvel para começar a anunciar e gerenciar ocupações."
            }
            acao={
              <Link href="/admin/imoveis/novo" className={classesBotao("primario", "md")}>
                <Plus aria-hidden className="size-4" />
                Novo imóvel
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cartões. Desktop: tabela. */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {imoveis.map((imovel) => {
              const capa = Imovel.fotoCapa(imovel);
              return (
                <li key={imovel.id}>
                  <Card className="overflow-hidden">
                    <Link href={`/admin/imoveis/${imovel.id}`} className="flex gap-3 p-3">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <ImagemImovel src={capa?.url ?? null} alt="" sizes="80px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <StatusImovelBadge status={imovel.status} />
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium text-slate-900">
                          {imovel.titulo}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {Endereco.resumo(imovel.endereco)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatarMoeda(imovel.valorAluguel)}
                          <span className="text-xs font-normal text-slate-500">/mês</span>
                        </p>
                      </div>
                    </Link>
                    <div className="border-t border-line px-3 py-2">
                      <AcoesImovel id={imovel.id} titulo={imovel.titulo} compacto />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Card className="hidden overflow-hidden lg:block">
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th scope="col">Imóvel</Th>
                    <Th scope="col">Tipo</Th>
                    <Th scope="col">Situação</Th>
                    <Th scope="col" className="text-right">Aluguel</Th>
                    <Th scope="col" className="text-right">Área</Th>
                    <Th scope="col"><span className="sr-only">Ações</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {imoveis.map((imovel) => {
                    const capa = Imovel.fotoCapa(imovel);
                    return (
                      <Tr key={imovel.id}>
                        <Td>
                          <Link href={`/admin/imoveis/${imovel.id}`} className="flex items-center gap-3">
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <ImagemImovel src={capa?.url ?? null} alt="" sizes="44px" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">
                                {imovel.titulo}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {Endereco.linha2(imovel.endereco)}
                              </span>
                            </span>
                          </Link>
                        </Td>
                        <Td className="whitespace-nowrap">{ROTULOS_TIPO_IMOVEL[imovel.tipo]}</Td>
                        <Td><StatusImovelBadge status={imovel.status} /></Td>
                        <Td className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                          {formatarMoeda(imovel.valorAluguel)}
                        </Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                          {formatarArea(imovel.caracteristicas.areaM2)}
                        </Td>
                        <Td>
                          <div className="flex justify-end">
                            <AcoesImovel id={imovel.id} titulo={imovel.titulo} compacto />
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrapper>
          </Card>
        </>
      )}
    </div>
  );
}
