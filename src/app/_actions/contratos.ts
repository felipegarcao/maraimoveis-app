"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contratoSchema } from "@/application/schemas";
import { ehTelefoneValido } from "@/application/schemas/validadores";
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

const telefoneAssinaturaSchema = z
  .string()
  .min(1, "Informe um telefone.")
  .refine(ehTelefoneValido, "Telefone inválido. Use DDD + número.");

/**
 * Encaminha o contrato para o número escolhido no modal de assinatura — pode
 * ser diferente do telefone cadastrado do inquilino.
 */
export async function enviarContratoParaAssinatura(id: string, telefone: unknown) {
  return executarAcao(telefoneAssinaturaSchema, telefone, async (telefoneValidado) => {
    await exigirSessao();
    const resultado = await casosDeUso.contratos.enviarParaAssinatura.executar(id, telefoneValidado);
    revalidar();
    return resultado;
  });
}

const documentoAssinadoSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  conteudo: z.string().startsWith("data:", "Arquivo inválido."),
});

/** Registra manualmente um documento já assinado (fora do fluxo digital). */
export async function registrarAssinaturaManual(id: string, arquivo: unknown) {
  return executarAcao(documentoAssinadoSchema, arquivo, async (arquivoValidado) => {
    await exigirSessao();
    const contrato = await casosDeUso.contratos.registrarAssinatura.executar(
      id,
      arquivoValidado,
      "sistema",
    );
    revalidar();
    return { id: contrato.id };
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
