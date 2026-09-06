"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { alterarSenhaSchema, loginInquilinoSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao } from "./_helpers";

export async function entrarPortal(entrada: unknown) {
  return executarAcao(loginInquilinoSchema, entrada, async (dados) => {
    const { sessao, usandoSenhaPadrao } = await casosDeUso.portal.autenticar.executar(
      dados.documento,
      dados.senha,
    );
    return { nome: sessao.nome, usandoSenhaPadrao };
  });
}

export async function sairPortal() {
  await casosDeUso.portal.encerrarSessao.executar();
  redirect("/portal/login");
}

export async function alterarSenhaPortal(entrada: unknown) {
  return executarAcao(alterarSenhaSchema, entrada, async (dados) => {
    const sessao = await casosDeUso.portal.sessaoAtual.exigir();
    await casosDeUso.portal.alterarSenha.executar(sessao.id, dados.senhaAtual, dados.novaSenha);
    revalidatePath("/portal");
    return { ok: true };
  });
}
