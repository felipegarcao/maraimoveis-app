"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, CircleDollarSign, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { CobrancaMensal, OcupacaoDetalhada } from "@/application/dtos";
import { formatarData, formatarMesReferencia, formatarMoeda } from "@/lib/formatters";
import { mensagemCobranca } from "@/lib/whatsapp";
import { excluirCobranca, gerarCobrancasDoMes } from "@/app/_actions/financeiro";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Table,
  TableWrapper,
  Td,
  Th,
  Tr,
} from "@/presentation/components/ui";
import { BotaoWhatsApp } from "@/presentation/features/publico/botao-whatsapp";
import { DetalheCobranca } from "./detalhe-cobranca";
import { FormularioCobranca } from "./formulario-cobranca";
import { StatusPagamentoBadge } from "./status-pagamento-badge";

/**
 * Painel de cobranças: concentra os modais de lançamento, extrato e recebimento
 * para que a página continue sendo um Server Component que só busca dados.
 */
export function PainelCobrancas({
  cobrancas,
  ocupacoesAtivas,
  ocupacaoPreSelecionada,
}: {
  cobrancas: CobrancaMensal[];
  ocupacoesAtivas: OcupacaoDetalhada[];
  ocupacaoPreSelecionada?: string;
}) {
  const router = useRouter();
  const [nova, setNova] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CobrancaMensal | null>(null);
  const [emDetalhe, setEmDetalhe] = useState<CobrancaMensal | null>(null);
  const [aExcluir, setAExcluir] = useState<CobrancaMensal | null>(null);
  const [gerando, setGerando] = useState(false);

  async function gerarDoMes() {
    setGerando(true);
    const resultado = await gerarCobrancasDoMes(format(new Date(), "yyyy-MM"));
    setGerando(false);

    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    const { criadas, jaExistiam } = resultado.dados;
    toast.success(
      criadas === 0
        ? "Todas as ocupações ativas já tinham cobrança neste mês."
        : `${criadas} ${criadas === 1 ? "cobrança criada" : "cobranças criadas"}${jaExistiam > 0 ? ` (${jaExistiam} já existiam)` : ""}. Lance água e luz de cada uma.`,
    );
    router.refresh();
  }

  async function confirmarExclusao() {
    if (!aExcluir) return;
    const resultado = await excluirCobranca(aExcluir.pagamento.id);
    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Cobrança excluída.");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setNova(true)}>
          <Plus aria-hidden className="size-4" />
          Lançar cobrança
        </Button>
        <Button variante="secundario" onClick={gerarDoMes} carregando={gerando}>
          <CalendarPlus aria-hidden className="size-4" />
          Gerar cobranças do mês
        </Button>
      </div>

      {cobrancas.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icone={Receipt}
            titulo="Nenhuma cobrança encontrada"
            descricao="Lance a cobrança de um mês ou use 'Gerar cobranças do mês' para abrir todas as ocupações ativas de uma vez."
            acao={
              <Button onClick={() => setNova(true)}>
                <Plus aria-hidden className="size-4" />
                Lançar cobrança
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cartões clicáveis. */}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:hidden">
            {cobrancas.map((cobranca) => (
              <li key={cobranca.pagamento.id} className="min-w-0">
                <Card className="min-w-0 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {formatarMesReferencia(cobranca.pagamento.mesReferencia)}
                      </p>
                      <p className="truncate text-xs text-slate-500">{cobranca.inquilino.nome}</p>
                      <p className="truncate text-xs text-slate-500">{cobranca.imovel.titulo}</p>
                    </div>
                    <StatusPagamentoBadge status={cobranca.status} />
                  </div>

                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Cobrado</dt>
                      <dd className="font-medium tabular-nums text-slate-900">
                        {formatarMoeda(cobranca.valorTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Pago</dt>
                      <dd className="font-medium tabular-nums text-emerald-700">
                        {formatarMoeda(cobranca.valorPago)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Falta</dt>
                      <dd
                        className={
                          cobranca.saldoDevedor > 0
                            ? "font-semibold tabular-nums text-red-600"
                            : "font-medium tabular-nums text-slate-400"
                        }
                      >
                        {formatarMoeda(cobranca.saldoDevedor)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    <Button tamanho="sm" variante="suave" onClick={() => setEmDetalhe(cobranca)}>
                      <CircleDollarSign aria-hidden className="size-4" />
                      Extrato
                    </Button>
                    {cobranca.saldoDevedor > 0 ? (
                      <BotaoWhatsApp
                        telefone={cobranca.inquilino.telefone}
                        rotulo="Cobrar"
                        tamanho="sm"
                        variante="secundario"
                        mensagem={mensagemCobranca(
                          cobranca.inquilino.nome.split(" ")[0],
                          formatarMesReferencia(cobranca.pagamento.mesReferencia),
                          formatarMoeda(cobranca.saldoDevedor),
                        )}
                      />
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Card className="mt-4 hidden overflow-hidden lg:block">
            <TableWrapper>
              <Table className="min-w-[940px]">
                <thead>
                  <tr>
                    <Th scope="col">Mês</Th>
                    <Th scope="col">Inquilino / Imóvel</Th>
                    <Th scope="col">Vencimento</Th>
                    <Th scope="col" className="text-right">Cobrado</Th>
                    <Th scope="col" className="text-right">Pago</Th>
                    <Th scope="col" className="text-right">Falta</Th>
                    <Th scope="col">Situação</Th>
                    <Th scope="col"><span className="sr-only">Ações</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {cobrancas.map((cobranca) => (
                    <Tr key={cobranca.pagamento.id}>
                      <Td className="whitespace-nowrap font-medium text-slate-900">
                        {formatarMesReferencia(cobranca.pagamento.mesReferencia)}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/inquilinos/${cobranca.inquilino.id}`}
                          className="block font-medium text-slate-900 hover:text-brand-700"
                        >
                          {cobranca.inquilino.nome}
                        </Link>
                        <span className="block max-w-[200px] truncate text-xs text-slate-500">
                          {cobranca.imovel.titulo}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-xs text-slate-500">
                        {formatarData(cobranca.pagamento.dataVencimento)}
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {formatarMoeda(cobranca.valorTotal)}
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums text-emerald-700">
                        {formatarMoeda(cobranca.valorPago)}
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {cobranca.saldoDevedor > 0 ? (
                          <span className="font-semibold text-red-600">
                            {formatarMoeda(cobranca.saldoDevedor)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td><StatusPagamentoBadge status={cobranca.status} /></Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          <Button
                            tamanho="sm"
                            variante="suave"
                            onClick={() => setEmDetalhe(cobranca)}
                          >
                            Extrato
                          </Button>
                          <Button
                            tamanho="icone"
                            variante="fantasma"
                            aria-label="Editar cobrança"
                            onClick={() => setEmEdicao(cobranca)}
                          >
                            <Pencil aria-hidden className="size-4" />
                          </Button>
                          {cobranca.pagamento.recebimentos.length === 0 ? (
                            <Button
                              tamanho="icone"
                              variante="fantasma"
                              aria-label="Excluir cobrança"
                              onClick={() => setAExcluir(cobranca)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 aria-hidden className="size-4" />
                            </Button>
                          ) : null}
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

      {nova ? (
        <FormularioCobranca
          aberto={nova}
          aoFechar={() => setNova(false)}
          ocupacoesAtivas={ocupacoesAtivas}
          ocupacaoPreSelecionada={ocupacaoPreSelecionada}
        />
      ) : null}

      {emEdicao ? (
        <FormularioCobranca
          aberto
          aoFechar={() => setEmEdicao(null)}
          ocupacoesAtivas={ocupacoesAtivas}
          cobranca={emEdicao.pagamento}
        />
      ) : null}

      {emDetalhe ? (
        <DetalheCobranca aberto aoFechar={() => setEmDetalhe(null)} cobranca={emDetalhe} />
      ) : null}

      <ConfirmDialog
        aberto={aExcluir !== null}
        aoFechar={() => setAExcluir(null)}
        aoConfirmar={confirmarExclusao}
        titulo="Excluir cobrança"
        textoConfirmar="Excluir"
        descricao={
          <p>
            A cobrança de{" "}
            <strong>
              {aExcluir ? formatarMesReferencia(aExcluir.pagamento.mesReferencia) : ""}
            </strong>{" "}
            será removida. Isso não afeta os outros meses.
          </p>
        }
      />
    </>
  );
}
