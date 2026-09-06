import { NextResponse } from "next/server";

/**
 * Verificação de saúde para o healthcheck do container e para o proxy reverso.
 * Pública e sem acesso a dados: responde se o processo está de pé.
 */
export function GET() {
  return NextResponse.json(
    { ok: true, servico: "mara-imoveis", em: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
