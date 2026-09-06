import type { Inquilino } from "../entities";

export interface FiltroInquilinos {
  readonly termo?: string;
  readonly ativo?: boolean;
}

export type NovoInquilino = Omit<Inquilino, "id" | "dataCadastro" | "atualizadoEm">;
export type AtualizacaoInquilino = Partial<NovoInquilino>;

export interface InquilinoRepository {
  listar(filtro?: FiltroInquilinos): Promise<Inquilino[]>;
  buscarPorId(id: string): Promise<Inquilino | null>;
  buscarPorDocumento(documento: string): Promise<Inquilino | null>;
  criar(dados: NovoInquilino): Promise<Inquilino>;
  atualizar(id: string, dados: AtualizacaoInquilino): Promise<Inquilino>;
  excluir(id: string): Promise<void>;
}
