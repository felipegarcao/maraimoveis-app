import type { Dinheiro, Periodo } from "../value-objects";

export const STATUS_OCUPACAO = ["ativa", "encerrada"] as const;
export type StatusOcupacao = (typeof STATUS_OCUPACAO)[number];

export const MOTIVOS_SAIDA = [
  "fim_contrato",
  "rescisao_inquilino",
  "rescisao_proprietario",
  "inadimplencia",
  "outro",
] as const;
export type MotivoSaida = (typeof MOTIVOS_SAIDA)[number];

export interface Ocupacao {
  readonly id: string;
  readonly imovelId: string;
  readonly inquilinoId: string;
  readonly dataEntrada: string;
  readonly dataSaida: string | null;
  readonly status: StatusOcupacao;
  /** Valor efetivamente combinado — pode divergir do anúncio do imóvel. */
  readonly valorAluguel: Dinheiro;
  readonly diaVencimento: number;
  readonly valorCaucao: Dinheiro;
  readonly motivoSaida?: MotivoSaida;
  readonly condicoesEntrega?: string;
  readonly observacoes?: string;
  readonly criadoEm: string;
}

export const ROTULOS_MOTIVO_SAIDA: Record<MotivoSaida, string> = {
  fim_contrato: "Fim do contrato",
  rescisao_inquilino: "Rescisão pelo inquilino",
  rescisao_proprietario: "Rescisão pelo proprietário",
  inadimplencia: "Inadimplência",
  outro: "Outro",
};

export const Ocupacao = {
  periodo(ocupacao: Ocupacao): Periodo {
    return { inicio: ocupacao.dataEntrada, fim: ocupacao.dataSaida };
  },

  estaAtiva(ocupacao: Ocupacao): boolean {
    return ocupacao.status === "ativa";
  },
};
