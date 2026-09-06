/**
 * Senha própria do inquilino para o portal.
 *
 * A credencial só passa a existir quando ele define uma senha. Enquanto não
 * existir, o acesso é liberado com a senha padrão (o próprio documento) — é
 * assim que "primeiro acesso com CPF" funciona sem precisar pré-cadastrar nada.
 */
export interface CredencialInquilino {
  /** Igual ao id do inquilino: um inquilino tem no máximo uma credencial. */
  readonly id: string;
  readonly senhaHash: string;
  readonly atualizadoEm: string;
}
