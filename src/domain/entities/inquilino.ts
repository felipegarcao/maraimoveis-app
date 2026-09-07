export const TIPOS_DOCUMENTO = ["cpf", "cnpj"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export interface Inquilino {
  readonly id: string;
  readonly nome: string;
  readonly tipoDocumento: TipoDocumento;
  /** Apenas dígitos. */
  readonly documento: string;
  /**
   * RG, opcional e livre de formato — o contrato de locação pede RG **e** CPF
   * da mesma pessoa, então ele não substitui `documento`.
   */
  readonly rg?: string;
  /** Opcional: nem todo inquilino tem ou quer informar e-mail. */
  readonly email?: string;
  /** Apenas dígitos, com DDD. */
  readonly telefone: string;
  readonly profissao?: string;
  readonly observacoes?: string;
  readonly ativo: boolean;
  readonly dataCadastro: string;
  readonly atualizadoEm: string;
}

/** Inquilino sem dados sensíveis — é o que vai no cookie do portal. */
export type InquilinoSessao = Pick<Inquilino, "id" | "nome" | "documento">;

export const Inquilino = {
  primeiroNome(inquilino: Inquilino): string {
    return inquilino.nome.split(" ")[0];
  },

  iniciais(inquilino: Inquilino): string {
    const partes = inquilino.nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (primeira + ultima).toUpperCase();
  },
};
