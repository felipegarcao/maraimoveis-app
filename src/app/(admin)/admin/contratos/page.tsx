import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileText } from "lucide-react";
import { casosDeUso } from "@/casos-de-uso";
import { STATUS_CONTRATO, type StatusContrato } from "@/domain/entities";
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
import { AcoesContrato } from "@/presentation/features/contratos/acoes-contrato";
import { BotaoNovoContrato } from "@/presentation/features/contratos/botao-novo-contrato";
import { StatusContratoBadge } from "@/presentation/features/contratos/status-contrato-badge";
import { StatusAssinaturaBadge } from "@/presentation/features/contratos/status-assinatura-badge";

export const metadata: Metadata = { title: "Contratos" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PaginaContratos({ searchParams }: Props) {
  const params = await searchParams;
  const status = texto(params.status);
  const ocupacaoId = texto(params.ocupacaoId);
  const imovelId = texto(params.imovelId);
  const inquilinoId = texto(params.inquilinoId);

  const [contratos, ocupacoes] = await Promise.all([
    casosDeUso.contratos.listar.executar({
      status: STATUS_CONTRATO.includes(status as StatusContrato)
        ? (status as StatusContrato)
        : undefined,
      ocupacaoId: ocupacaoId || undefined,
      imovelId: imovelId || undefined,
      inquilinoId: inquilinoId || undefined,
    }),
    casosDeUso.ocupacoes.listar.executar(),
  ]);

  const envioDisponivel = casosDeUso.contratos.envioDisponivel();

  const semContrato = ocupacoes.filter(
    (o) => o.ocupacao.status === "ativa" && o.contrato === null,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {contratos.length} {contratos.length === 1 ? "contrato" : "contratos"}
          {ocupacaoId ? " nesta ocupação" : ""}
        </p>
        <Suspense fallback={<Skeleton className="h-10 w-40" />}>
          <BotaoNovoContrato ocupacoes={ocupacoes} />
        </Suspense>
      </div>

      {semContrato.length > 0 && !ocupacaoId ? (
        <Card className="border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-medium text-slate-900">
            {semContrato.length}{" "}
            {semContrato.length === 1
              ? "ocupação ativa está sem contrato"
              : "ocupações ativas estão sem contrato"}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {semContrato.map((o) => (
              <li key={o.ocupacao.id}>
                <Link
                  href={`/admin/contratos?ocupacaoId=${o.ocupacao.id}`}
                  className="font-medium text-brand-700 hover:text-brand-800"
                >
                  {o.inquilino.nome} — {o.imovel.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-3 sm:p-4">
        <nav aria-label="Filtrar contratos" className="flex flex-wrap gap-2">
          {[{ valor: "", rotulo: "Todos" }, ...STATUS_CONTRATO.map((s) => ({ valor: s, rotulo: s }))].map(
            (opcao) => (
              <Link
                key={opcao.valor || "todos"}
                href={opcao.valor ? `/admin/contratos?status=${opcao.valor}` : "/admin/contratos"}
                aria-current={status === opcao.valor ? "page" : undefined}
                className={classesBotao(status === opcao.valor ? "suave" : "fantasma", "sm", "capitalize")}
              >
                {opcao.rotulo}
              </Link>
            ),
          )}
        </nav>
      </Card>

      {contratos.length === 0 ? (
        <Card>
          <EmptyState
            icone={FileText}
            titulo="Nenhum contrato encontrado"
            descricao="Crie um contrato a partir de uma ocupação para gerar o PDF preenchido automaticamente."
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {contratos.map(({ contrato, imovel, inquilino }) => (
              <li key={contrato.id}>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-medium text-slate-900">{contrato.numero}</p>
                    <StatusContratoBadge status={contrato.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-900">{inquilino.nome}</p>
                  <p className="truncate text-xs text-slate-500">{imovel.titulo}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {formatarData(contrato.condicoes.dataInicio)} —{" "}
                    {formatarData(contrato.condicoes.dataFim)}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                    {formatarMoeda(contrato.condicoes.valorAluguel)}
                  </p>
                  <div className="mt-2">
                    <StatusAssinaturaBadge status={contrato.statusAssinatura} />
                  </div>
                  <div className="mt-3 border-t border-line pt-3">
                    <AcoesContrato
                      contrato={contrato}
                      ocupacoes={ocupacoes}
                      inquilino={inquilino}
                      envioDisponivel={envioDisponivel}
                      compacto
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Card className="hidden overflow-hidden lg:block">
            <TableWrapper>
              <Table className="min-w-[960px]">
                <thead>
                  <tr>
                    <Th scope="col">Número</Th>
                    <Th scope="col">Inquilino / Imóvel</Th>
                    <Th scope="col">Vigência</Th>
                    <Th scope="col" className="text-right">Aluguel</Th>
                    <Th scope="col">PDF</Th>
                    <Th scope="col">Assinatura</Th>
                    <Th scope="col">Situação</Th>
                    <Th scope="col"><span className="sr-only">Ações</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map(({ contrato, imovel, inquilino }) => (
                    <Tr key={contrato.id}>
                      <Td className="whitespace-nowrap font-mono font-medium text-slate-900">
                        {contrato.numero}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/inquilinos/${inquilino.id}`}
                          className="block font-medium text-slate-900 hover:text-brand-700"
                        >
                          {inquilino.nome}
                        </Link>
                        <span className="block max-w-[220px] truncate text-xs text-slate-500">
                          {imovel.titulo}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-xs">
                        {formatarData(contrato.condicoes.dataInicio)} —{" "}
                        {formatarData(contrato.condicoes.dataFim)}
                        <span className="block text-slate-500">
                          {contrato.condicoes.prazoMeses} meses · {contrato.condicoes.indiceReajuste}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-right font-medium tabular-nums">
                        {formatarMoeda(contrato.condicoes.valorAluguel)}
                      </Td>
                      <Td>
                        {contrato.arquivoPdfUrl && contrato.dataGeracao ? (
                          <Badge tom="sucesso">Gerado {formatarData(contrato.dataGeracao)}</Badge>
                        ) : (
                          <Badge tom="alerta">Pendente</Badge>
                        )}
                      </Td>
                      <Td><StatusAssinaturaBadge status={contrato.statusAssinatura} /></Td>
                      <Td><StatusContratoBadge status={contrato.status} /></Td>
                      <Td>
                        <div className="flex justify-end">
                          <AcoesContrato
                            contrato={contrato}
                            ocupacoes={ocupacoes}
                            inquilino={inquilino}
                            envioDisponivel={envioDisponivel}
                            compacto
                          />
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
