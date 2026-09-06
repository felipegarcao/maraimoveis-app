import type { Usuario } from "@/domain/entities";
import { gerarHashSenhaSync } from "../auth/senha";
import { mesesAtras } from "./helpers";

/** Registro interno do repositório: a senha só existe como hash. */
export interface UsuarioComSenha extends Usuario {
  readonly senhaHash: string;
}

const EMAIL_ADMIN_PADRAO = "admin@maraimoveis.com.br";

/**
 * Usuários iniciais do painel.
 *
 * Em produção sobe apenas UM administrador, com e-mail e senha definidos em
 * `ADMIN_EMAIL` e `ADMIN_SENHA`. Sem essas variáveis o sistema não sobe: um
 * painel de gestão com credencial padrão publicada seria um convite.
 *
 * Em desenvolvimento entram os dois usuários de demonstração documentados
 * no README, para o projeto rodar sem configuração nenhuma.
 */
export function usuariosSeed(): UsuarioComSenha[] {
  const criadoEm = new Date().toISOString();

  if (process.env.NODE_ENV === "production") {
    const email = process.env.ADMIN_EMAIL?.trim();
    const senha = process.env.ADMIN_SENHA;

    if (!email || !senha) {
      throw new Error(
        "Defina ADMIN_EMAIL e ADMIN_SENHA no ambiente para criar o administrador do painel.",
      );
    }
    if (senha.length < 8) {
      throw new Error("ADMIN_SENHA deve ter pelo menos 8 caracteres.");
    }

    return [
      {
        id: "usr_admin",
        nome: process.env.ADMIN_NOME?.trim() || "Administrador",
        email,
        papel: "admin",
        ativo: true,
        criadoEm,
        senhaHash: gerarHashSenhaSync(senha),
      },
    ];
  }

  return [
    {
      id: "usr_01",
      nome: "Mara Siqueira",
      email: EMAIL_ADMIN_PADRAO,
      papel: "admin",
      ativo: true,
      criadoEm: mesesAtras(60),
      senhaHash: gerarHashSenhaSync("admin123"),
    },
    {
      id: "usr_02",
      nome: "Rafael Duarte",
      email: "gestor@maraimoveis.com.br",
      papel: "gestor",
      ativo: true,
      criadoEm: mesesAtras(14),
      senhaHash: gerarHashSenhaSync("gestor123"),
    },
  ];
}
