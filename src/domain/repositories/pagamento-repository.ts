import type { Pagamento } from "../entities";

export interface FiltroPagamentos {
  readonly ocupacaoId?: string;
  readonly ocupacaoIds?: readonly string[];
  readonly mesReferencia?: string;
  /** Intervalo inclusivo em yyyy-MM. */
  readonly mesDe?: string;
  readonly mesAte?: string;
}

export type NovoPagamento = Omit<Pagamento, "id" | "criadoEm" | "recebimentos"> & {
  readonly recebimentos?: Pagamento["recebimentos"];
};
export type AtualizacaoPagamento = Partial<Omit<Pagamento, "id" | "criadoEm" | "ocupacaoId">>;

export interface PagamentoRepository {
  listar(filtro?: FiltroPagamentos): Promise<Pagamento[]>;
  buscarPorId(id: string): Promise<Pagamento | null>;
  buscarPorMes(ocupacaoId: string, mesReferencia: string): Promise<Pagamento | null>;
  criar(dados: NovoPagamento): Promise<Pagamento>;
  atualizar(id: string, dados: AtualizacaoPagamento): Promise<Pagamento>;
  excluir(id: string): Promise<void>;
}
