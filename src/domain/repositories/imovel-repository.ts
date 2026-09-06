import type { Imovel, StatusImovel, TipoImovel } from "../entities";

export interface FiltroImoveis {
  readonly termo?: string;
  readonly cidade?: string;
  readonly bairro?: string;
  readonly tipo?: TipoImovel;
  readonly status?: StatusImovel;
  readonly precoMin?: number;
  readonly precoMax?: number;
  readonly quartosMin?: number;
  readonly aceitaPet?: boolean;
  readonly mobiliado?: boolean;
}

/** Dados de criação: id e timestamps são responsabilidade do repositório. */
export type NovoImovel = Omit<Imovel, "id" | "criadoEm" | "atualizadoEm">;
export type AtualizacaoImovel = Partial<NovoImovel>;

export interface ImovelRepository {
  listar(filtro?: FiltroImoveis): Promise<Imovel[]>;
  buscarPorId(id: string): Promise<Imovel | null>;
  criar(dados: NovoImovel): Promise<Imovel>;
  atualizar(id: string, dados: AtualizacaoImovel): Promise<Imovel>;
  excluir(id: string): Promise<void>;
  /** Valores distintos para popular os selects de filtro da vitrine. */
  listarLocalidades(): Promise<{ cidades: string[]; bairros: string[] }>;
}
