"use server";

import { revalidatePath } from "next/cache";
import { entradaSchema, saidaSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao, exigirSessao } from "./_helpers";

function revalidar() {
  revalidatePath("/admin/ocupacoes");
  revalidatePath("/admin/imoveis");
  revalidatePath("/admin/inquilinos");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

export async function registrarEntrada(entrada: unknown) {
  return executarAcao(entradaSchema, entrada, async (dados) => {
    await exigirSessao();
    const ocupacao = await casosDeUso.ocupacoes.registrarEntrada.executar({
      ...dados,
      observacoes: dados.observacoes || undefined,
    });
    revalidar();
    return { id: ocupacao.id };
  });
}

export async function registrarSaida(ocupacaoId: string, entrada: unknown) {
  return executarAcao(saidaSchema, entrada, async (dados) => {
    await exigirSessao();
    const ocupacao = await casosDeUso.ocupacoes.registrarSaida.executar(ocupacaoId, {
      ...dados,
      condicoesEntrega: dados.condicoesEntrega || undefined,
    });
    revalidar();
    revalidatePath(`/admin/ocupacoes/${ocupacaoId}`);
    return { id: ocupacao.id };
  });
}
