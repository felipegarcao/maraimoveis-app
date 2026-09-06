import type { Usuario } from "../entities";

export interface UsuarioRepository {
  listar(): Promise<Usuario[]>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  /** Valida credenciais. Mock hoje; troca por hash real depois sem afetar o caso de uso. */
  validarCredenciais(email: string, senha: string): Promise<Usuario | null>;
  criar(dados: Omit<Usuario, "id" | "criadoEm">, senha: string): Promise<Usuario>;
}
