import { NextResponse } from "next/server";
import { casosDeUso } from "@/casos-de-uso";
import { ehErroDominio } from "@/domain/errors";

/**
 * Download direto do contrato em PDF.
 *
 * Gera o arquivo sob demanda quando ainda não existe, para que o link possa
 * ser compartilhado sem depender de o admin ter clicado em "Gerar PDF" antes.
 */
export async function GET(_requisicao: Request, { params }: { params: Promise<{ id: string }> }) {
  const [sessaoAdmin, sessaoInquilino] = await Promise.all([
    casosDeUso.auth.sessaoAtual.executar(),
    casosDeUso.portal.sessaoAtual.executar(),
  ]);
  if (!sessaoAdmin && !sessaoInquilino) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await params;

  try {
    const { contrato, ocupacao } = await casosDeUso.contratos.obter.executar(id);

    // O inquilino só alcança o contrato da própria ocupação.
    if (!sessaoAdmin && ocupacao.inquilinoId !== sessaoInquilino?.id) {
      return new NextResponse("Não autorizado", { status: 403 });
    }
    const atualizado = contrato.arquivoPdfUrl
      ? contrato
      : await casosDeUso.contratos.gerarPdf.executar(id);

    // Redirecionamento RELATIVO de propósito: montar uma URL absoluta a partir
    // de `request.url` devolveria o host interno do container (127.0.0.1:3000),
    // que o navegador não alcança quando há um proxy reverso na frente.
    return new NextResponse(null, {
      status: 307,
      headers: { Location: atualizado.arquivoPdfUrl!, "Cache-Control": "no-store" },
    });
  } catch (erro) {
    if (ehErroDominio(erro)) {
      return new NextResponse(erro.message, { status: 404 });
    }
    console.error("[contrato-pdf]", erro);
    return new NextResponse("Falha ao gerar o contrato.", { status: 500 });
  }
}
