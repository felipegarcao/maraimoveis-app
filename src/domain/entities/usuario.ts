export const PAPEIS_USUARIO = ["admin", "gestor"] as const;
export type PapelUsuario = (typeof PAPEIS_USUARIO)[number];

export interface Usuario {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly papel: PapelUsuario;
  readonly ativo: boolean;
  readonly criadoEm: string;
}

/** Usuário sem dados sensíveis — é o que trafega até a UI. */
export type UsuarioSessao = Pick<Usuario, "id" | "nome" | "email" | "papel">;

export const ROTULOS_PAPEL: Record<PapelUsuario, string> = {
  admin: "Administrador",
  gestor: "Gestor",
};

/** Permissões declaradas por papel — hoje só há dois, mas o ponto de extensão existe. */
const PERMISSOES: Record<PapelUsuario, readonly string[]> = {
  admin: ["*"],
  gestor: ["imoveis:ler", "imoveis:escrever", "inquilinos:ler", "inquilinos:escrever", "financeiro:ler"],
};

export const Usuario = {
  podeExcluir(usuario: UsuarioSessao): boolean {
    return usuario.papel === "admin";
  },

  temPermissao(usuario: UsuarioSessao, permissao: string): boolean {
    const permissoes = PERMISSOES[usuario.papel];
    return permissoes.includes("*") || permissoes.includes(permissao);
  },
};
