"use server";

import { revalidatePath } from "next/cache";
import { contratoSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao, executarSimples, exigirSessao } from "./_helpers";

function revalidar() {
  revalidatePath("/admin/contratos");
  revalidatePath("/admin/ocupacoes");
  revalidatePath("/admin/dashboard");
}

export async function criarContrato(entrada: unknown) {
  return executarAcao(contratoSchema, entrada, async (dados) => {
    await exigirSessao();
    const contrato = await casosDeUso.contratos.criar.executar({
      ...dados,
      clausulasAdicionais: dados.clausulasAdicionais || undefined,
    });
    revalidar();
    return { id: contrato.id, numero: contrato.numero };
  });
}

export async function editarContrato(id: string, entrada: unknown) {
  return executarAcao(contratoSchema, entrada, async (dados) => {
    await exigirSessao();
    const contrato = await casosDeUso.contratos.editar.executar(id, {
      valorAluguel: dados.valorAluguel,
      valorCaucao: dados.valorCaucao,
      diaVencimento: dados.diaVencimento,
      prazoMeses: dados.prazoMeses,
      indiceReajuste: dados.indiceReajuste,
      dataInicio: dados.dataInicio,
      clausulasAdicionais: dados.clausulasAdicionais || undefined,
    });
    revalidar();
    return { id: contrato.id, numero: contrato.numero };
  });
}

/** Gera o PDF e devolve a URL já pronta para abrir em nova aba. */
export async function gerarContratoPdf(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    const contrato = await casosDeUso.contratos.gerarPdf.executar(id);
    revalidar();
    return { url: contrato.arquivoPdfUrl!, numero: contrato.numero };
  });
}

/**
 * Dispara o contrato para o fluxo do n8n, que encaminha o PDF por WhatsApp.
 * Gera o PDF antes, se ainda não existir — o arquivo enviado é sempre o mesmo
 * que fica no painel.
 */
export async function enviarContratoWebhook(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    const resultado = await casosDeUso.contratos.enviarPorWebhook.executar(id);
    revalidar();
    return resultado;
  });
}

export async function excluirContrato(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    await casosDeUso.contratos.excluir.executar(id);
    revalidar();
    return { ok: true };
  });
}
