"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { imovelSchema } from "@/application/schemas";
import { STATUS_IMOVEL } from "@/domain/entities";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao, executarSimples, exigirSessao } from "./_helpers";

function revalidar(id?: string) {
  revalidatePath("/admin/imoveis");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  if (id) {
    revalidatePath(`/admin/imoveis/${id}`);
    revalidatePath(`/imoveis/${id}`);
  }
}

export async function criarImovel(entrada: unknown) {
  return executarAcao(imovelSchema, entrada, async (dados) => {
    await exigirSessao();
    const imovel = await casosDeUso.imoveis.criar.executar({
      ...dados,
      descricao: dados.descricao || undefined,
      endereco: { ...dados.endereco, complemento: dados.endereco.complemento || undefined },
    });
    revalidar(imovel.id);
    return { id: imovel.id, titulo: imovel.titulo };
  });
}

export async function editarImovel(id: string, entrada: unknown) {
  return executarAcao(imovelSchema, entrada, async (dados) => {
    await exigirSessao();
    const imovel = await casosDeUso.imoveis.editar.executar(id, {
      ...dados,
      descricao: dados.descricao || undefined,
      endereco: { ...dados.endereco, complemento: dados.endereco.complemento || undefined },
    });
    revalidar(imovel.id);
    return { id: imovel.id, titulo: imovel.titulo };
  });
}

export async function excluirImovel(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    const resultado = await casosDeUso.imoveis.excluir.executar(id);
    revalidar(id);
    return resultado;
  });
}

export async function alterarStatusImovel(id: string, status: unknown) {
  return executarAcao(z.enum(STATUS_IMOVEL), status, async (novoStatus) => {
    await exigirSessao();
    await casosDeUso.imoveis.alterarStatus.executar(id, novoStatus);
    revalidar(id);
    return { status: novoStatus };
  });
}

const fotoUploadSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  conteudo: z.string().startsWith("data:", "Arquivo inválido."),
});

/** Recebe a imagem em base64 e devolve a URL já servida pelo storage. */
export async function enviarFotoImovel(entrada: unknown) {
  return executarAcao(fotoUploadSchema, entrada, async (arquivo) => {
    await exigirSessao();
    return casosDeUso.imoveis.enviarFoto.executar(arquivo);
  });
}
