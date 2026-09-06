import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import type { ReadableOptions } from "node:stream";
import { NextResponse } from "next/server";
import { casosDeUso } from "@/casos-de-uso";

const RAIZ_UPLOADS = join(process.env.DIRETORIO_DADOS ?? join(process.cwd(), ".data"), "uploads");

const TIPOS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

/** Pastas cujo conteúdo é público — as fotos já aparecem na vitrine. */
const PASTAS_PUBLICAS = ["imoveis"];

/**
 * Serve os arquivos gravados pelo LocalStorageService.
 *
 * Existe porque o storage mock grava em runtime, fora de `public/`.
 * Quando o storage virar S3/Supabase, esta rota deixa de ser necessária —
 * o serviço passa a emitir a própria URL (assinada, quando privada).
 *
 * Fotos de imóvel são públicas; qualquer outra pasta (contratos, por exemplo)
 * exige uma sessão — obscuridade do nome do arquivo não é controle de acesso.
 */
export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ chave: string[] }> },
) {
  const { chave } = await params;
  const relativo = normalize(chave.join("/"));

  // Impede escapar do diretório de uploads via "../".
  if (relativo.startsWith("..") || relativo.includes("\0")) {
    return new NextResponse("Caminho inválido", { status: 400 });
  }

  const caminho = join(RAIZ_UPLOADS, relativo);
  if (!caminho.startsWith(RAIZ_UPLOADS)) {
    return new NextResponse("Caminho inválido", { status: 400 });
  }

  if (!PASTAS_PUBLICAS.includes(relativo.split("/")[0])) {
    const [sessaoAdmin, sessaoInquilino] = await Promise.all([
      casosDeUso.auth.sessaoAtual.executar(),
      casosDeUso.portal.sessaoAtual.executar(),
    ]);
    if (!sessaoAdmin && !sessaoInquilino) {
      return new NextResponse("Não autorizado", { status: 401 });
    }
  }

  try {
    const info = await stat(caminho);
    if (!info.isFile()) return new NextResponse("Não encontrado", { status: 404 });

    const stream = createReadStream(caminho) as NodeJS.ReadableStream & ReadableOptions;
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": TIPOS[extname(caminho).toLowerCase()] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Não encontrado", { status: 404 });
  }
}
