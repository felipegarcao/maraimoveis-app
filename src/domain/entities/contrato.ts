import type { Dinheiro } from "../value-objects";

export const STATUS_CONTRATO = ["rascunho", "vigente", "encerrado"] as const;
export type StatusContrato = (typeof STATUS_CONTRATO)[number];

export interface CondicoesContrato {
  readonly valorAluguel: Dinheiro;
  readonly valorCaucao: Dinheiro;
  readonly diaVencimento: number;
  readonly prazoMeses: number;
  readonly indiceReajuste: string;
  readonly dataInicio: string;
  readonly dataFim: string;
  readonly clausulasAdicionais?: string;
}

export const STATUS_ASSINATURA = ["pendente", "enviada", "assinada"] as const;
export type StatusAssinatura = (typeof STATUS_ASSINATURA)[number];

/**
 * Como o documento assinado chegou até o sistema: `digital` quando o próprio
 * fluxo de assinatura (WhatsApp/n8n) devolveu o PDF assinado, `sistema`
 * quando o gestor importou manualmente um documento já assinado em papel.
 */
export const ORIGENS_ASSINATURA = ["digital", "sistema"] as const;
export type OrigemAssinatura = (typeof ORIGENS_ASSINATURA)[number];

export interface Contrato {
  readonly id: string;
  readonly ocupacaoId: string;
  readonly numero: string;
  readonly status: StatusContrato;
  readonly condicoes: CondicoesContrato;
  /** Referência do PDF no StorageService. `null` enquanto não foi gerado. */
  readonly arquivoPdfUrl: string | null;
  readonly dataGeracao: string | null;

  /** Situação da assinatura — controla o botão "Assinatura" no painel. */
  readonly statusAssinatura: StatusAssinatura;
  /** Telefone (com DDI) para onde a mensagem de assinatura foi enviada. */
  readonly assinaturaTelefone: string | null;
  readonly assinaturaEnviadaEm: string | null;
  readonly assinaturaOrigem: OrigemAssinatura | null;
  /** Referência do documento assinado no StorageService (digital ou importado). */
  readonly arquivoAssinadoUrl: string | null;
  readonly assinadoEm: string | null;

  readonly criadoEm: string;
}

export const ROTULOS_STATUS_CONTRATO: Record<StatusContrato, string> = {
  rascunho: "Rascunho",
  vigente: "Vigente",
  encerrado: "Encerrado",
};

export const ROTULOS_STATUS_ASSINATURA: Record<StatusAssinatura, string> = {
  pendente: "Assinatura pendente",
  enviada: "Enviada para assinatura",
  assinada: "Assinado",
};

export const Contrato = {
  temPdf(contrato: Contrato): boolean {
    return contrato.arquivoPdfUrl !== null;
  },
  assinado(contrato: Contrato): boolean {
    return contrato.statusAssinatura === "assinada";
  },
};
