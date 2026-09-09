import { NextResponse } from "next/server";
import { z } from "zod";
import { casosDeUso } from "@/casos-de-uso";
import { ehErroDominio } from "@/domain/errors";

/**
 * Callback do fluxo digital de assinatura: quando o inquilino assina o
 * contrato pelo WhatsApp, o n8n devolve o PDF assinado aqui, fechando o
 * mesmo caminho usado para a importação manual — só muda a origem registrada.
 *
 * Autenticado por token compartilhado (não por sessão: quem chama é o n8n,
 * não um usuário logado). Sem `N8N_WEBHOOK_CALLBACK_TOKEN` configurado, a
 * rota fica desativada — não há como validar o chamador.
 */
const corpoSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  conteudo: z.string().startsWith("data:", "Arquivo inválido."),
});

export async function POST(requisicao: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = process.env.N8N_WEBHOOK_CALLBACK_TOKEN;
  if (!token) {
    return new NextResponse("Callback de assinatura não configurado.", { status: 404 });
  }

  const autorizacao = requisicao.headers.get("authorization");
  if (autorizacao !== `Bearer ${token}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await params;

  const corpo = await requisicao.json().catch(() => null);
  const validacao = corpoSchema.safeParse(corpo);
  if (!validacao.success) {
    return NextResponse.json({ erro: "Corpo inválido. Esperado { nome, tipo, conteudo }." }, { status: 400 });
  }

  try {
    const contrato = await casosDeUso.contratos.registrarAssinatura.executar(
      id,
      validacao.data,
      "digital",
    );
    return NextResponse.json({ ok: true, contratoId: contrato.id });
  } catch (erro) {
    if (ehErroDominio(erro)) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    console.error("[assinatura-webhook]", erro);
    return NextResponse.json({ erro: "Falha ao registrar a assinatura." }, { status: 500 });
  }
}
