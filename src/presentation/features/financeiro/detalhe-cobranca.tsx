"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import type { CobrancaMensal } from "@/application/dtos";
import { FORMAS_PAGAMENTO, Pagamento, ROTULOS_FORMA_PAGAMENTO } from "@/domain/entities";
import { recebimentoSchema, type DadosRecebimentoForm } from "@/application/schemas";
import { registrarPagamento, removerRecebimento } from "@/app/_actions/financeiro";
import { formatarData, formatarMesReferencia, formatarMoeda } from "@/lib/formatters";
import {
  Button,
  Field,
  Input,
  InputMoeda,
  Modal,
  Select,
} from "@/presentation/components/ui";
import { StatusPagamentoBadge } from "./status-pagamento-badge";

/**
 * Extrato de uma cobrança: composição do valor, recebimentos lançados e
 * o formulário para registrar um novo pagamento (total ou parcial).
 */
export function DetalheCobranca({
  aberto,
  aoFechar,
  cobranca,
}: {
  aberto: boolean;
  aoFechar: () => void;
  cobranca: CobrancaMensal;
}) {
  const router = useRouter();
  const [removendo, setRemovendo] = useState<string | null>(null);
  const { pagamento } = cobranca;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosRecebimentoForm>({
    resolver: zodResolver(recebimentoSchema),
    defaultValues: {
      pagamentoId: pagamento.id,
      valor: cobranca.saldoDevedor,
      data: format(new Date(), "yyyy-MM-dd"),
      forma: "pix",
      observacao: "",
    },
  });

  async function aoEnviar(dados: DadosRecebimentoForm) {
    const resultado = await registrarPagamento(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosRecebimentoForm, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(
      resultado.dados.saldoDevedor > 0
        ? `Pagamento registrado. Ainda faltam ${formatarMoeda(resultado.dados.saldoDevedor)}.`
        : "Pagamento registrado. Cobrança quitada!",
    );
    reset({ ...dados, valor: resultado.dados.saldoDevedor, observacao: "" });
    router.refresh();
    if (resultado.dados.saldoDevedor === 0) aoFechar();
  }

  async function remover(recebimentoId: string) {
    setRemovendo(recebimentoId);
    const resultado = await removerRecebimento(pagamento.id, recebimentoId);
    setRemovendo(null);
    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Recebimento removido.");
    router.refresh();
  }

  const linhas = [
    { rotulo: "Aluguel", valor: pagamento.valorAluguel },
    { rotulo: "Água", valor: pagamento.valorAgua },
    { rotulo: "Luz", valor: pagamento.valorLuz },
    {
      rotulo: pagamento.descricaoOutros || "Outros valores",
      valor: pagamento.outrosValores,
    },
  ].filter((linha) => linha.valor > 0);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={formatarMesReferencia(pagamento.mesReferencia)}
      descricao={`${cobranca.inquilino.nome} · ${cobranca.imovel.titulo}`}
      largura="lg"
    >
      <div className="space-y-5">
        <section aria-label="Composição da cobrança">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Composição</h3>
            <StatusPagamentoBadge status={cobranca.status} />
          </div>
          <dl className="mt-2 divide-y divide-line rounded-lg border border-line">
            {linhas.map((linha) => (
              <div key={linha.rotulo} className="flex justify-between gap-3 px-3 py-2 text-sm">
                <dt className="text-slate-600">{linha.rotulo}</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {formatarMoeda(linha.valor)}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 bg-slate-50 px-3 py-2 text-sm">
              <dt className="font-medium text-slate-900">Total cobrado</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatarMoeda(cobranca.valorTotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 px-3 py-2 text-sm">
              <dt className="text-slate-600">Já recebido</dt>
              <dd className="font-medium tabular-nums text-emerald-700">
                {formatarMoeda(cobranca.valorPago)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 px-3 py-2 text-sm">
              <dt className="font-medium text-slate-900">Saldo devedor</dt>
              <dd
                className={
                  cobranca.saldoDevedor > 0
                    ? "font-semibold tabular-nums text-red-600"
                    : "font-semibold tabular-nums text-emerald-700"
                }
              >
                {formatarMoeda(cobranca.saldoDevedor)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            Vencimento em {formatarData(pagamento.dataVencimento)}
          </p>
        </section>

        <section aria-label="Recebimentos">
          <h3 className="text-sm font-semibold text-slate-900">
            Recebimentos ({pagamento.recebimentos.length})
          </h3>
          {pagamento.recebimentos.length === 0 ? (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
              Nenhum pagamento registrado nesta cobrança.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {[...pagamento.recebimentos]
                .sort((a, b) => (a.data > b.data ? -1 : 1))
                .map((recebimento) => (
                  <li key={recebimento.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium tabular-nums text-slate-900">
                        {formatarMoeda(recebimento.valor)}
                        <span className="ml-2 font-normal text-slate-500">
                          {ROTULOS_FORMA_PAGAMENTO[recebimento.forma]}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatarData(recebimento.data)}
                        {recebimento.observacao ? ` · ${recebimento.observacao}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remover(recebimento.id)}
                      disabled={removendo === recebimento.id}
                      aria-label={`Remover recebimento de ${formatarMoeda(recebimento.valor)}`}
                      className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>

        {!Pagamento.estaQuitado(pagamento) ? (
          <section aria-label="Registrar pagamento">
            <h3 className="text-sm font-semibold text-slate-900">Registrar pagamento</h3>
            <form onSubmit={handleSubmit(aoEnviar)} noValidate className="mt-2 space-y-3">
              <input type="hidden" {...register("pagamentoId")} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Valor" htmlFor="recebimento-valor" obrigatorio erro={errors.valor?.message}>
                  <InputMoeda
                    id="recebimento-valor"
                    invalido={!!errors.valor}
                    {...register("valor")}
                  />
                </Field>
                <Field label="Data" htmlFor="recebimento-data" obrigatorio erro={errors.data?.message}>
                  <Input id="recebimento-data" type="date" invalido={!!errors.data} {...register("data")} />
                </Field>
                <Field label="Forma" htmlFor="recebimento-forma" obrigatorio erro={errors.forma?.message}>
                  <Select id="recebimento-forma" {...register("forma")}>
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <option key={forma} value={forma}>
                        {ROTULOS_FORMA_PAGAMENTO[forma]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Observação" htmlFor="recebimento-obs" erro={errors.observacao?.message}>
                <Input
                  id="recebimento-obs"
                  placeholder="Ex: pagamento parcial acordado por telefone"
                  {...register("observacao")}
                />
              </Field>
              <Button type="submit" carregando={isSubmitting} larguraTotal>
                <Plus aria-hidden className="size-4" />
                Registrar pagamento
              </Button>
            </form>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
