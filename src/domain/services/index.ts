import type { UsuarioSessao } from "../entities";

/** Arquivo a ser persistido pelo StorageService. */
export interface ArquivoUpload {
  readonly nome: string;
  readonly tipo: string;
  readonly conteudo: Uint8Array | string;
}

export interface ArquivoArmazenado {
  readonly url: string;
  readonly chave: string;
  readonly tamanhoBytes: number;
}

/**
 * Porta de armazenamento de arquivos (fotos, PDFs de contrato).
 * Implementação atual grava local; trocar por S3/Supabase é só um novo adapter.
 */
export interface StorageService {
  salvar(pasta: string, arquivo: ArquivoUpload): Promise<ArquivoArmazenado>;
  remover(chave: string): Promise<void>;
  urlPublica(chave: string): string;
}

export interface MensagemEmail {
  readonly para: string;
  readonly assunto: string;
  readonly html: string;
  readonly responderPara?: string;
}

/** Porta de envio de e-mail. Adapter atual: Resend. */
export interface EmailService {
  enviar(mensagem: MensagemEmail): Promise<{ id: string }>;
}

/**
 * Porta de sessão — hoje cookie assinado com mock; depois NextAuth/Clerk/Supabase.
 * É genérica porque o painel e o portal do inquilino têm sessões independentes:
 * cada um com seu cookie, seu payload e seu ciclo de vida.
 */
export interface SessionService<T = UsuarioSessao> {
  obterSessao(): Promise<T | null>;
  criarSessao(dados: T): Promise<void>;
  encerrarSessao(): Promise<void>;
}

/** Dados já resolvidos que o gerador de PDF precisa — sem acesso a repositórios. */
export interface DadosContratoPdf {
  readonly numero: string;
  readonly locador: { readonly nome: string; readonly documento: string; readonly endereco: string };
  readonly locatario: {
    readonly nome: string;
    readonly documento: string;
    readonly email?: string;
    readonly telefone: string;
  };
  readonly imovel: {
    readonly titulo: string;
    readonly enderecoCompleto: string;
    readonly tipo: string;
    readonly areaM2: number;
  };
  readonly condicoes: {
    readonly valorAluguel: number;
    readonly valorCaucao: number;
    readonly diaVencimento: number;
    readonly prazoMeses: number;
    readonly indiceReajuste: string;
    readonly dataInicio: string;
    readonly dataFim: string;
    readonly clausulasAdicionais?: string;
  };
  readonly cidadeAssinatura: string;
  readonly dataEmissao: string;
}

/** Porta de geração de PDF. Adapter atual: @react-pdf/renderer. */
export interface ContratoPdfService {
  gerar(dados: DadosContratoPdf): Promise<Uint8Array>;
}

/**
 * Porta de hash de senha. Mantém `bcrypt`/`argon2`/`scrypt` fora das regras:
 * o caso de uso só sabe gerar e conferir.
 */
export interface HashSenhaService {
  gerar(senha: string): Promise<string>;
  conferir(senha: string, armazenado: string): Promise<boolean>;
}
