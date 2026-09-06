import { container } from "./container";
import { usarPostgres } from "./persistence/prisma-client";

/**
 * Garante que exista um administrador quando a persistência é PostgreSQL.
 *
 * No modo arquivo JSON isso já é resolvido pelo seed do `JsonStore`; no banco
 * não há seed automático, então a criação acontece aqui, uma única vez, na
 * subida do servidor. É idempotente: havendo qualquer usuário, não faz nada —
 * trocar ADMIN_SENHA depois não sobrescreve a senha de quem já existe.
 */
export async function garantirAdministrador(): Promise<void> {
  if (!usarPostgres()) return;

  const existentes = await container.usuarios.listar();
  if (existentes.length > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim();
  const senha = process.env.ADMIN_SENHA;

  if (!email || !senha) {
    throw new Error(
      "O banco não tem nenhum usuário e ADMIN_EMAIL/ADMIN_SENHA não foram definidos. " +
        "Sem eles não há como entrar no painel — preencha as duas variáveis e reinicie.",
    );
  }
  if (senha.length < 8) {
    throw new Error("ADMIN_SENHA deve ter pelo menos 8 caracteres.");
  }

  const usuario = await container.usuarios.criar(
    {
      nome: process.env.ADMIN_NOME?.trim() || "Administrador",
      email,
      papel: "admin",
      ativo: true,
    },
    senha,
  );
  console.info(`[bootstrap] Administrador criado: ${usuario.email}`);
}
