import { Dinheiro, paraDataLocal } from "../value-objects";

export const STATUS_PAGAMENTO = ["pago", "parcial", "aberto", "atrasado"] as const;
export type StatusPagamento = (typeof STATUS_PAGAMENTO)[number];

export const FORMAS_PAGAMENTO = ["pix", "transferencia", "dinheiro", "boleto", "cartao"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export interface RegistroPagamento {
  readonly id: string;
  readonly valor: Dinheiro;
  readonly data: string;
  readonly forma: FormaPagamento;
  readonly observacao?: string;
}

/**
 * Uma cobrança mensal de uma ocupação.
 * `valorPago` e `saldoDevedor` são derivados de `recebimentos` — nunca editados à mão.
 */
export interface Pagamento {
  readonly id: string;
  readonly ocupacaoId: string;
  /** Formato yyyy-MM. */
  readonly mesReferencia: string;
  readonly valorAluguel: Dinheiro;
  readonly valorAgua: Dinheiro;
  readonly valorLuz: Dinheiro;
  readonly outrosValores: Dinheiro;
  readonly descricaoOutros?: string;
  readonly dataVencimento: string;
  readonly recebimentos: readonly RegistroPagamento[];
  readonly criadoEm: string;
}

export const ROTULOS_STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
  pago: "Pago",
  parcial: "Parcial",
  aberto: "Em aberto",
  atrasado: "Atrasado",
};

export const ROTULOS_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: "PIX",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
  cartao: "Cartão",
};

export const Pagamento = {
  /** Total cobrado no mês: aluguel + água + luz + extras. */
  valorTotal(pagamento: Pagamento): Dinheiro {
    return Dinheiro.somar(
      pagamento.valorAluguel,
      pagamento.valorAgua,
      pagamento.valorLuz,
      pagamento.outrosValores,
    );
  },

  valorPago(pagamento: Pagamento): Dinheiro {
    return Dinheiro.somar(...pagamento.recebimentos.map((r) => r.valor));
  },

  saldoDevedor(pagamento: Pagamento): Dinheiro {
    return Dinheiro.naoNegativo(
      Dinheiro.subtrair(Pagamento.valorTotal(pagamento), Pagamento.valorPago(pagamento)),
    );
  },

  /** Data do último recebimento — o que o usuário entende por "data do pagamento". */
  dataPagamento(pagamento: Pagamento): string | null {
    if (pagamento.recebimentos.length === 0) return null;
    return [...pagamento.recebimentos].sort((a, b) => (a.data > b.data ? -1 : 1))[0].data;
  },

  status(pagamento: Pagamento, referencia: Date = new Date()): StatusPagamento {
    const saldo = Pagamento.saldoDevedor(pagamento);
    if (Dinheiro.ehZero(saldo)) return "pago";
    const vencido = paraDataLocal(pagamento.dataVencimento) < referencia;
    if (Dinheiro.maiorQue(Pagamento.valorPago(pagamento), 0)) {
      return vencido ? "atrasado" : "parcial";
    }
    return vencido ? "atrasado" : "aberto";
  },

  estaQuitado(pagamento: Pagamento): boolean {
    return Dinheiro.ehZero(Pagamento.saldoDevedor(pagamento));
  },
};
