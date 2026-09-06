"use server";

import { revalidatePath } from "next/cache";
import { statusLeadSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao, exigirSessao } from "./_helpers";

export async function atualizarStatusLead(entrada: unknown) {
  return executarAcao(statusLeadSchema, entrada, async ({ id, status }) => {
    await exigirSessao();
    await casosDeUso.leads.atualizarStatus.executar(id, status);
    revalidatePath("/admin/leads");
    revalidatePath("/admin/dashboard");
    return { status };
  });
}
