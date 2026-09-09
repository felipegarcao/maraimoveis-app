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
  /** Conteúdo do arquivo, ou `null` se ele não existir mais. */
  ler(chave: string): Promise<Uint8Array | null>;
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

/**
 * Qualificação de uma das partes no contrato, na ordem em que aparece no papel.
 * Tudo além do nome é opcional: linha sem valor simplesmente não é impressa.
 */
export interface ParteContrato {
  readonly nome: string;
  /**
   * Como a parte é chamada no contrato ("LOCADORA", "LOCADOR"). Muda a
   * concordância do texto das cláusulas, por isso é dado e não constante.
   */
  readonly rotulo?: string;
  readonly profissao?: string;
  readonly rg?: string;
  readonly documento?: string;
  readonly endereco?: string;
  readonly telefone?: string;
}

/** Dados já resolvidos que o gerador de PDF precisa — sem acesso a repositórios. */
export interface DadosContratoPdf {
  readonly numero: string;
  readonly locador: ParteContrato;
  readonly locatario: ParteContrato;
  /** Muda o título do contrato e a destinação declarada na cláusula do objeto. */
  readonly natureza: "residencial" | "comercial";
  readonly imovel: {
    readonly titulo: string;
    readonly enderecoCompleto: string;
    readonly tipo: string;
    readonly areaM2?: number;
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

/**
 * Envio do contrato para um fluxo externo (n8n), que decide o que fazer com o
 * PDF — encaminhar por WhatsApp, arquivar, notificar alguém.
 *
 * A aplicação não conhece WhatsApp nem n8n: entrega o PDF e os dados da locação
 * para um endpoint HTTP configurado por variável de ambiente.
 */
export interface EnvioContratoWebhook {
  readonly evento: "contrato.gerado";
  readonly contrato: {
    readonly id: string;
    readonly numero: string;
    readonly status: string;
    readonly dataInicio: string;
    readonly dataFim: string;
    readonly valorAluguel: number;
  };
  readonly locatario: {
    readonly nome: string;
    readonly documento: string;
    readonly rg?: string;
    /** Só dígitos, com DDI 55 — pronto para uso como destinatário no fluxo. */
    readonly telefone: string;
    readonly email?: string;
  };
  readonly imovel: { readonly titulo: string; readonly endereco: string };
  readonly pdf: {
    readonly nomeArquivo: string;
    readonly tipo: "application/pdf";
    /** Conteúdo do PDF em base64, sem o prefixo `data:`. */
    readonly base64: string;
  };
}

export interface WebhookContratoService {
  /** `false` quando não há URL configurada — a tela esconde o botão. */
  configurado(): boolean;
  enviar(payload: EnvioContratoWebhook): Promise<void>;
}
