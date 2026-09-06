import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const DIRETORIO_DADOS = process.env.DIRETORIO_DADOS ?? join(process.cwd(), ".data");

/**
 * Coleção persistida em arquivo JSON.
 *
 * Existe só para que o CRUD do admin sobreviva a reloads durante o desenvolvimento.
 * É um detalhe de infraestrutura: os repositórios expõem as interfaces do domínio,
 * então substituir isto por Prisma/Supabase não toca em nenhum caso de uso.
 */
export class JsonStore<T extends { id: string }> {
  private readonly caminho: string;
  private cache: T[] | null = null;
  /**
   * Carregamento em andamento. Sem isto, duas leituras concorrentes (um
   * `Promise.all` de dois métodos do mesmo repositório, por exemplo) semeariam
   * o arquivo duas vezes e disputariam a mesma escrita.
   */
  private carregando: Promise<T[]> | null = null;
  /** Serializa escritas concorrentes no mesmo arquivo (Server Actions em paralelo). */
  private fila: Promise<unknown> = Promise.resolve();
  /** Torna único o nome do arquivo temporário dentro do processo. */
  private sequencia = 0;

  constructor(
    nomeArquivo: string,
    private readonly seed: () => T[],
  ) {
    this.caminho = join(DIRETORIO_DADOS, `${nomeArquivo}.json`);
  }

  async ler(): Promise<T[]> {
    if (this.cache) return this.cache;
    // Leituras concorrentes compartilham um único carregamento. A referência
    // fica em variável local para não depender do estado do campo depois do await.
    const carregamento = (this.carregando ??= this.carregar());
    try {
      return await carregamento;
    } finally {
      if (this.carregando === carregamento) this.carregando = null;
    }
  }

  private async carregar(): Promise<T[]> {
    try {
      const conteudo = await readFile(this.caminho, "utf-8");
      this.cache = JSON.parse(conteudo) as T[];
    } catch {
      // Primeiro acesso (ou arquivo corrompido): recria a partir dos mocks.
      this.cache = this.seed();
      await this.persistir(this.cache);
    }
    return this.cache;
  }

  /**
   * Aplica uma mutação atômica sobre a coleção.
   * O callback recebe uma cópia e devolve a nova lista + um resultado.
   */
  async mutar<R>(operacao: (itens: T[]) => { itens: T[]; resultado: R }): Promise<R> {
    const execucao = this.fila.then(async () => {
      const atuais = await this.ler();
      const { itens, resultado } = operacao([...atuais]);
      this.cache = itens;
      await this.persistir(itens);
      return resultado;
    });
    // A fila não pode quebrar se uma operação falhar.
    this.fila = execucao.catch(() => undefined);
    return execucao;
  }

  /** Descarta o arquivo e volta aos dados de seed. */
  async resetar(): Promise<void> {
    this.cache = this.seed();
    await this.persistir(this.cache);
  }

  private async persistir(itens: T[]): Promise<void> {
    await mkdir(dirname(this.caminho), { recursive: true });

    // Escrita atômica: grava em temporário e renomeia, evitando arquivo pela metade.
    // O nome precisa ser único por escrita — só o PID faria duas gravações
    // simultâneas disputarem o mesmo temporário.
    this.sequencia += 1;
    const temporario = `${this.caminho}.${process.pid}.${this.sequencia}.tmp`;

    await writeFile(temporario, JSON.stringify(itens, null, 2), "utf-8");
    try {
      await rename(temporario, this.caminho);
    } catch (erro) {
      await unlink(temporario).catch(() => undefined);
      throw erro;
    }
  }
}
