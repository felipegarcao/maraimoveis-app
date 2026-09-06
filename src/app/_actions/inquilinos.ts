"use server";

import { revalidatePath } from "next/cache";
import { inquilinoSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao, executarSimples, exigirSessao } from "./_helpers";

function revalidar(id?: string) {
  revalidatePath("/admin/inquilinos");
  revalidatePath("/admin/dashboard");
  if (id) revalidatePath(`/admin/inquilinos/${id}`);
}

export async function criarInquilino(entrada: unknown) {
  return executarAcao(inquilinoSchema, entrada, async (dados) => {
    await exigirSessao();
    const inquilino = await casosDeUso.inquilinos.criar.executar({
      ...dados,
      telefone: dados.telefone.replace(/\D/g, ""),
      email: dados.email || undefined,
      profissao: dados.profissao || undefined,
      observacoes: dados.observacoes || undefined,
    });
    revalidar(inquilino.id);
    return { id: inquilino.id, nome: inquilino.nome };
  });
}

export async function editarInquilino(id: string, entrada: unknown) {
  return executarAcao(inquilinoSchema, entrada, async (dados) => {
    await exigirSessao();
    const inquilino = await casosDeUso.inquilinos.editar.executar(id, {
      ...dados,
      telefone: dados.telefone.replace(/\D/g, ""),
      email: dados.email || undefined,
      profissao: dados.profissao || undefined,
      observacoes: dados.observacoes || undefined,
    });
    revalidar(inquilino.id);
    return { id: inquilino.id, nome: inquilino.nome };
  });
}

export async function excluirInquilino(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    const resultado = await casosDeUso.inquilinos.excluir.executar(id);
    revalidar(id);
    return resultado;
  });
}

/** Devolve o acesso do inquilino ao portal para a senha padrão (o documento). */
export async function redefinirSenhaPortal(id: string) {
  return executarSimples(async () => {
    await exigirSessao();
    await casosDeUso.portal.redefinirSenha.executar(id);
    revalidar(id);
    return { ok: true };
  });
}
