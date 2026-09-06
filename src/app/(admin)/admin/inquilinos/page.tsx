import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { Inquilino } from "@/domain/entities";
import { formatarCpfCnpj, formatarData, formatarTelefone } from "@/lib/formatters";
import {
  Badge,
  Card,
  EmptyState,
  Table,
  TableWrapper,
  Td,
  Th,
  Tr,
  classesBotao,
} from "@/presentation/components/ui";
import { AcoesInquilino } from "@/presentation/features/inquilinos/acoes-inquilino";
import { BuscaSimples } from "@/presentation/features/busca-simples";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";

export const metadata: Metadata = { title: "Inquilinos" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PaginaInquilinos({ searchParams }: Props) {
  const params = await searchParams;
  const termo = texto(params.termo);
  const situacao = texto(params.situacao);

  const inquilinos = await casosDeUso.inquilinos.listar.executar({
    termo: termo || undefined,
    ativo: situacao === "ativos" ? true : situacao === "inativos" ? false : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {inquilinos.length} {inquilinos.length === 1 ? "inquilino" : "inquilinos"}
        </p>
        <Link href="/admin/inquilinos/novo" className={classesBotao("primario", "md")}>
          <Plus aria-hidden className="size-4" />
          Novo inquilino
        </Link>
      </div>

      <Card className="p-4 sm:p-5">
        <BuscaSimples
          base="/admin/inquilinos"
          termo={termo}
          placeholder="Buscar por nome, documento, e-mail ou telefone"
          filtro={{
            nome: "situacao",
            valor: situacao,
            rotulo: "Situação do cadastro",
            opcoes: [
              { valor: "", rotulo: "Todos" },
              { valor: "ativos", rotulo: "Ativos" },
              { valor: "inativos", rotulo: "Inativos" },
            ],
          }}
        />
      </Card>

      {inquilinos.length === 0 ? (
        <Card>
          <EmptyState
            icone={Users}
            titulo="Nenhum inquilino encontrado"
            descricao={
              termo || situacao
                ? "Nenhum cadastro corresponde aos filtros aplicados."
                : "Cadastre inquilinos para vinculá-los aos imóveis e controlar o financeiro."
            }
            acao={
              <Link href="/admin/inquilinos/novo" className={classesBotao("primario", "md")}>
                <Plus aria-hidden className="size-4" />
                Novo inquilino
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {inquilinos.map((inquilino) => (
              <li key={inquilino.id}>
                <Card>
                  <Link href={`/admin/inquilinos/${inquilino.id}`} className="flex gap-3 p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                      {Inquilino.iniciais(inquilino)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {inquilino.nome}
                        </span>
                        {!inquilino.ativo ? <Badge tom="neutro">Inativo</Badge> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {formatarCpfCnpj(inquilino.documento)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {formatarTelefone(inquilino.telefone)}
                      </span>
                    </span>
                  </Link>
                  <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2">
                    <BotaoWhatsApp
                      telefone={inquilino.telefone}
                      mensagem={`Olá, ${inquilino.nome.split(" ")[0]}!`}
                      rotulo="WhatsApp"
                      variante="suave"
                      tamanho="sm"
                    />
                    <AcoesInquilino id={inquilino.id} nome={inquilino.nome} compacto />
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Card className="hidden overflow-hidden lg:block">
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th scope="col">Inquilino</Th>
                    <Th scope="col">Documento</Th>
                    <Th scope="col">Contato</Th>
                    <Th scope="col">Cadastro</Th>
                    <Th scope="col"><span className="sr-only">Ações</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {inquilinos.map((inquilino) => (
                    <Tr key={inquilino.id}>
                      <Td>
                        <Link
                          href={`/admin/inquilinos/${inquilino.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                            {Inquilino.iniciais(inquilino)}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium text-slate-900">
                                {inquilino.nome}
                              </span>
                              {!inquilino.ativo ? <Badge tom="neutro">Inativo</Badge> : null}
                            </span>
                            {inquilino.profissao ? (
                              <span className="block truncate text-xs text-slate-500">
                                {inquilino.profissao}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">
                        {formatarCpfCnpj(inquilino.documento)}
                      </Td>
                      <Td>
                        <span className="block whitespace-nowrap">
                          {formatarTelefone(inquilino.telefone)}
                        </span>
                        {inquilino.email ? (
                          <span className="block truncate text-xs text-slate-500">
                            {inquilino.email}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {formatarData(inquilino.dataCadastro)}
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <BotaoWhatsApp
                            telefone={inquilino.telefone}
                            mensagem={`Olá, ${inquilino.nome.split(" ")[0]}!`}
                            rotulo="WhatsApp"
                            variante="suave"
                            tamanho="sm"
                          />
                          <AcoesInquilino id={inquilino.id} nome={inquilino.nome} compacto />
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          </Card>
        </>
      )}
    </div>
  );
}
