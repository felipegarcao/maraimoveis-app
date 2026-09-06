import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import type { StatusOcupacao } from "@/domain/entities";
import { formatarData, formatarMoeda } from "@/lib/formatters";
import {
  Badge,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableWrapper,
  Td,
  Th,
  Tr,
  classesBotao,
} from "@/presentation/components/ui";
import { BotaoNovaEntrada } from "@/presentation/features/ocupacoes/botao-nova-entrada";
import { BotaoRegistrarSaida } from "@/presentation/features/ocupacoes/botao-registrar-saida";

export const metadata: Metadata = { title: "Ocupações" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PaginaOcupacoes({ searchParams }: Props) {
  const params = await searchParams;
  const status = texto(params.status);

  const [ocupacoes, imoveis, inquilinos] = await Promise.all([
    casosDeUso.ocupacoes.listar.executar({
      status: status === "ativa" || status === "encerrada" ? (status as StatusOcupacao) : undefined,
    }),
    casosDeUso.imoveis.listar.executar(),
    casosDeUso.inquilinos.listar.executar({ ativo: true }),
  ]);

  const disponiveis = imoveis.filter((i) => i.status === "disponivel");
  const ativas = ocupacoes.filter((o) => o.ocupacao.status === "ativa");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {ativas.length} {ativas.length === 1 ? "ocupação ativa" : "ocupações ativas"} ·{" "}
          {ocupacoes.length} no total
        </p>
        <Suspense fallback={<Skeleton className="h-10 w-44" />}>
          <BotaoNovaEntrada imoveisDisponiveis={disponiveis} inquilinos={inquilinos} />
        </Suspense>
      </div>

      <Card className="p-3 sm:p-4">
        <nav aria-label="Filtrar ocupações" className="flex flex-wrap gap-2">
          {[
            { valor: "", rotulo: "Todas" },
            { valor: "ativa", rotulo: "Ativas" },
            { valor: "encerrada", rotulo: "Encerradas" },
          ].map((opcao) => (
            <Link
              key={opcao.valor || "todas"}
              href={opcao.valor ? `/admin/ocupacoes?status=${opcao.valor}` : "/admin/ocupacoes"}
              aria-current={status === opcao.valor ? "page" : undefined}
              className={classesBotao(status === opcao.valor ? "suave" : "fantasma", "sm")}
            >
              {opcao.rotulo}
            </Link>
          ))}
        </nav>
      </Card>

      {ocupacoes.length === 0 ? (
        <Card>
          <EmptyState
            icone={KeyRound}
            titulo="Nenhuma ocupação registrada"
            descricao="Vincule um inquilino a um imóvel disponível para começar a controlar aluguel, contas e contratos."
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {ocupacoes.map((d) => (
              <li key={d.ocupacao.id}>
                <Card>
                  <Link href={`/admin/ocupacoes/${d.ocupacao.id}`} className="block p-4">
                    <Badge tom={d.ocupacao.status === "ativa" ? "sucesso" : "neutro"} ponto>
                      {d.ocupacao.status === "ativa" ? "Ativa" : "Encerrada"}
                    </Badge>
                    <p className="mt-2 text-sm font-medium text-slate-900">{d.inquilino.nome}</p>
                    <p className="truncate text-xs text-slate-500">{d.imovel.titulo}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {formatarData(d.ocupacao.dataEntrada)} —{" "}
                      {d.ocupacao.dataSaida ? formatarData(d.ocupacao.dataSaida) : "atual"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatarMoeda(d.ocupacao.valorAluguel)}
                      <span className="text-xs font-normal text-slate-500">/mês</span>
                    </p>
                    {d.financeiro.saldoDevedor > 0 ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {formatarMoeda(d.financeiro.saldoDevedor)} em aberto
                      </p>
                    ) : null}
                  </Link>
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
                    <Th scope="col">Imóvel</Th>
                    <Th scope="col">Período</Th>
                    <Th scope="col" className="text-right">Aluguel</Th>
                    <Th scope="col" className="text-right">Em aberto</Th>
                    <Th scope="col">Situação</Th>
                    <Th scope="col"><span className="sr-only">Ações</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {ocupacoes.map((d) => (
                    <Tr key={d.ocupacao.id}>
                      <Td>
                        <Link
                          href={`/admin/ocupacoes/${d.ocupacao.id}`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {d.inquilino.nome}
                        </Link>
                      </Td>
                      <Td>
                        <span className="block max-w-[220px] truncate">{d.imovel.titulo}</span>
                        <span className="block text-xs text-slate-500">{d.imovel.enderecoResumo}</span>
                      </Td>
                      <Td className="whitespace-nowrap text-xs">
                        {formatarData(d.ocupacao.dataEntrada)} —{" "}
                        {d.ocupacao.dataSaida ? formatarData(d.ocupacao.dataSaida) : "atual"}
                        <span className="block text-slate-500">{d.duracaoMeses} meses</span>
                      </Td>
                      <Td className="whitespace-nowrap text-right font-medium tabular-nums">
                        {formatarMoeda(d.ocupacao.valorAluguel)}
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {d.financeiro.saldoDevedor > 0 ? (
                          <span className="font-medium text-red-600">
                            {formatarMoeda(d.financeiro.saldoDevedor)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td>
                        <Badge tom={d.ocupacao.status === "ativa" ? "sucesso" : "neutro"} ponto>
                          {d.ocupacao.status === "ativa" ? "Ativa" : "Encerrada"}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          {d.ocupacao.status === "ativa" ? (
                            <BotaoRegistrarSaida
                              ocupacaoId={d.ocupacao.id}
                              saldoDevedor={d.financeiro.saldoDevedor}
                              tamanho="sm"
                            />
                          ) : null}
                          <Link
                            href={`/admin/ocupacoes/${d.ocupacao.id}`}
                            className={classesBotao("fantasma", "sm")}
                          >
                            Detalhes
                          </Link>
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
