import type { Contrato, StatusContrato } from "../entities";

export interface FiltroContratos {
  readonly ocupacaoId?: string;
  readonly status?: StatusContrato;
}

export type NovoContrato = Omit<Contrato, "id" | "criadoEm" | "numero"> & { readonly numero?: string };
export type AtualizacaoContrato = Partial<Omit<Contrato, "id" | "criadoEm">>;

export interface ContratoRepository {
  listar(filtro?: FiltroContratos): Promise<Contrato[]>;
  buscarPorId(id: string): Promise<Contrato | null>;
  buscarPorOcupacao(ocupacaoId: string): Promise<Contrato[]>;
  criar(dados: NovoContrato): Promise<Contrato>;
  atualizar(id: string, dados: AtualizacaoContrato): Promise<Contrato>;
  excluir(id: string): Promise<void>;
}
