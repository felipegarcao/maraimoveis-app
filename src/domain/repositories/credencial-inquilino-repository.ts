import type { CredencialInquilino } from "../entities";

export interface CredencialInquilinoRepository {
  /** `null` significa que o inquilino ainda usa a senha padrão (o documento). */
  buscarPorInquilino(inquilinoId: string): Promise<CredencialInquilino | null>;
  salvar(inquilinoId: string, senhaHash: string): Promise<CredencialInquilino>;
  /** Volta o acesso para a senha padrão — usado quando o inquilino esquece a senha. */
  remover(inquilinoId: string): Promise<void>;
}
