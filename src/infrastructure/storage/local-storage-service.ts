import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ArquivoArmazenado, ArquivoUpload, StorageService } from "@/domain/services";
import { gerarId, slugify } from "@/lib/utils";

export const PREFIXO_URL = "/api/arquivos";
const RAIZ_UPLOADS = join(process.env.DIRETORIO_DADOS ?? join(process.cwd(), ".data"), "uploads");

/**
 * Adapter de storage que grava em `.data/uploads` e serve os arquivos pela rota
 * `/api/arquivos/[...chave]`.
 *
 * Gravar fora de `public/` é proposital: arquivos criados em runtime dentro de
 * `public/` não são servidos pelo Next em produção. Servir por rota também
 * aproxima o comportamento de um storage real (S3/Supabase), onde a URL é
 * emitida pelo serviço — trocar o adapter não muda nenhuma tela.
 */
export class LocalStorageService implements StorageService {
  /** Converte a URL pública de volta na chave usada por `remover`. */
  static chaveDeUrl(url: string): string {
    return url.replace(new RegExp(`^${PREFIXO_URL}/`), "");
  }

  async salvar(pasta: string, arquivo: ArquivoUpload): Promise<ArquivoArmazenado> {
    const conteudo =
      typeof arquivo.conteudo === "string"
        ? Buffer.from(extrairBase64(arquivo.conteudo), "base64")
        : Buffer.from(arquivo.conteudo);

    const extensao = extensaoDe(arquivo.nome, arquivo.tipo);
    const nomeBase = slugify(arquivo.nome.replace(/\.[^.]+$/, "")) || "arquivo";
    const nomeFinal = `${nomeBase}-${gerarId("f").split("_")[1]}${extensao}`;
    const chave = `${pasta}/${nomeFinal}`;
    const destino = join(RAIZ_UPLOADS, pasta);

    await mkdir(destino, { recursive: true });
    await writeFile(join(destino, nomeFinal), conteudo);

    return { chave, url: this.urlPublica(chave), tamanhoBytes: conteudo.byteLength };
  }

  async ler(chave: string): Promise<Uint8Array | null> {
    try {
      return await readFile(join(RAIZ_UPLOADS, chave));
    } catch {
      // Arquivo apagado do volume por fora: quem chamou decide o que fazer.
      return null;
    }
  }

  async remover(chave: string): Promise<void> {
    try {
      await unlink(join(RAIZ_UPLOADS, chave));
    } catch {
      // Remoção é idempotente: arquivo já ausente não é erro.
    }
  }

  urlPublica(chave: string): string {
    return `${PREFIXO_URL}/${chave}`;
  }
}

function extrairBase64(valor: string): string {
  const separador = valor.indexOf("base64,");
  return separador === -1 ? valor : valor.slice(separador + 7);
}

function extensaoDe(nome: string, tipo: string): string {
  const doNome = nome.match(/(\.[a-z0-9]+)$/i)?.[1];
  if (doNome) return doNome.toLowerCase();
  const mapa: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  return mapa[tipo] ?? ".bin";
}
