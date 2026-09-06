"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao } from "./_helpers";

export async function entrar(entrada: unknown) {
  return executarAcao(loginSchema, entrada, async (dados) => {
    const usuario = await casosDeUso.auth.autenticar.executar(dados.email, dados.senha);
    return { nome: usuario.nome };
  });
}

export async function sair() {
  await casosDeUso.auth.encerrarSessao.executar();
  redirect("/login");
}
