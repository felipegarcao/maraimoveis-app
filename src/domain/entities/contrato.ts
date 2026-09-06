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

export interface Contrato {
  readonly id: string;
  readonly ocupacaoId: string;
  readonly numero: string;
  readonly status: StatusContrato;
  readonly condicoes: CondicoesContrato;
  /** Referência do PDF no StorageService. `null` enquanto não foi gerado. */
  readonly arquivoPdfUrl: string | null;
  readonly dataGeracao: string | null;
  readonly criadoEm: string;
}

export const ROTULOS_STATUS_CONTRATO: Record<StatusContrato, string> = {
  rascunho: "Rascunho",
  vigente: "Vigente",
  encerrado: "Encerrado",
};

export const Contrato = {
  temPdf(contrato: Contrato): boolean {
    return contrato.arquivoPdfUrl !== null;
  },
};
