export const ORIGENS_LEAD = ["site_imovel", "site_contato"] as const;
export type OrigemLead = (typeof ORIGENS_LEAD)[number];

export const STATUS_LEAD = ["novo", "em_atendimento", "convertido", "descartado"] as const;
export type StatusLead = (typeof STATUS_LEAD)[number];

/** Contato recebido pelo site público. */
export interface Lead {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly telefone: string;
  readonly mensagem: string;
  readonly origem: OrigemLead;
  readonly imovelId: string | null;
  readonly status: StatusLead;
  readonly criadoEm: string;
}

export const ROTULOS_STATUS_LEAD: Record<StatusLead, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  convertido: "Convertido",
  descartado: "Descartado",
};
