"use server";

import { headers } from "next/headers";
import { contatoSchema } from "@/application/schemas";
import { casosDeUso } from "@/casos-de-uso";
import { executarAcao } from "./_helpers";

/** Formulário público de contato: registra o lead e dispara o e-mail via Resend. */
export async function enviarContato(entrada: unknown) {
  return executarAcao(contatoSchema, entrada, async (dados) => {
    const cabecalhos = await headers();
    // Atrás de um proxy reverso, o host e o protocolo reais chegam nos
    // cabeçalhos X-Forwarded-*; `host` sozinho apontaria para o container.
    const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "";
    const protocolo =
      cabecalhos.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    const { emailEnviado } = await casosDeUso.leads.registrar.executar({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone.replace(/\D/g, ""),
      mensagem: dados.mensagem,
      origem: dados.imovelId ? "site_imovel" : "site_contato",
      imovelId: dados.imovelId ?? null,
      urlBase: `${protocolo}://${host}`,
    });

    return { emailEnviado };
  });
}
