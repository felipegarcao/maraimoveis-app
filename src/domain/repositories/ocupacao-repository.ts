import type { Ocupacao, StatusOcupacao } from "../entities";

export interface FiltroOcupacoes {
  readonly imovelId?: string;
  readonly inquilinoId?: string;
  readonly status?: StatusOcupacao;
}

export type NovaOcupacao = Omit<Ocupacao, "id" | "criadoEm" | "status" | "dataSaida"> & {
  readonly dataSaida?: string | null;
  readonly status?: StatusOcupacao;
};
export type AtualizacaoOcupacao = Partial<Omit<Ocupacao, "id" | "criadoEm">>;

export interface OcupacaoRepository {
  listar(filtro?: FiltroOcupacoes): Promise<Ocupacao[]>;
  buscarPorId(id: string): Promise<Ocupacao | null>;
  /** Ocupação ativa de um imóvel — no máximo uma por vez. */
  buscarAtivaPorImovel(imovelId: string): Promise<Ocupacao | null>;
  criar(dados: NovaOcupacao): Promise<Ocupacao>;
  atualizar(id: string, dados: AtualizacaoOcupacao): Promise<Ocupacao>;
  excluir(id: string): Promise<void>;
}
