"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cobrancaSchema, recebimentoSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao, executarSimples, exigirSessao } from "./_helpers";

function revalidar() {
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/ocupacoes");
  revalidatePath("/admin/inquilinos");
  revalidatePath("/admin/relatorios");
}

export async function registrarCobranca(entrada: unknown) {
  return executarAcao(cobrancaSchema, entrada, async (dados) => {
    await exigirSessao();
    const pagamento = await casosDeUso.financeiro.registrarCobranca.executar({
      ...dados,
      outrosValores: dados.outrosValores ?? 0,
      descricaoOutros: dados.descricaoOutros || undefined,
      dataVencimento: dados.dataVencimento || undefined,
    });
    revalidar();
    return { id: pagamento.id, mesReferencia: pagamento.mesReferencia };
  });
}

export async function editarCobranca(id: string, entrada: unknown) {
  return executarAcao(cobrancaSchema, entrada, async (dados) => {
    await exigirSessao();
    await casosDeUso.financeiro.editarCobranca.executar(id, {
      valorAluguel: dados.valorAluguel,
      valorAgua: dados.valorAgua,
      valorLuz: dados.valorLuz,
      outrosValores: dados.outrosValores ?? 0,
      descricaoOutros: dados.descricaoOutros || undefined,
      dataVencimento: dados.dataVencimento || undefined,
    });
    revalidar();
    return { id };
  });
}

const mesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido.");

/** Abre as cobranças do mês para todas as ocupações ativas de uma vez. */
export async function gerarCobrancasDoMes(mes: unknown) {
  return executarAcao(mesSchema, mes, async (mesReferencia) => {
    await exigirSessao();
    const resultado = await casosDeUso.financeiro.gerarCobrancasDoMes.executar(mesReferencia);
    revalidar();
    return resultado;
  });
}

export async function registrarPagamento(entrada: unknown) {
  return executarAcao(recebimentoSchema, entrada, async (dados) => {
    await exigirSessao();
    const resultado = await casosDeUso.financeiro.registrarPagamento.executar({
      ...dados,
      observacao: dados.observacao || undefined,
    });
    revalidar();
    return { saldoDevedor: resultado.saldoDevedor };
  });
}

export async function removerRecebimento(pagamentoId: string, recebimentoId: string) {
  return executarSimples(async () => {
    await exigirSessao();
    await casosDeUso.financeiro.removerRecebimento.executar(pagamentoId, recebimentoId);
    revalidar();
    return { ok: true };
  });
}

export async function excluirCobranca(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    await casosDeUso.financeiro.excluirCobranca.executar(id);
    revalidar();
    return { ok: true };
  });
}
