import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Cliente Prisma único do processo.
 *
 * O singleton em `globalThis` existe por causa do hot reload do Next: sem ele,
 * cada recompilação abriria um novo pool de conexões até esgotar o Postgres.
 */
const globalParaPrisma = globalThis as unknown as { __maraPrisma?: PrismaClient };

function criarCliente(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Defina a variável ou remova-a para usar a persistência em arquivos JSON.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"],
  });
}

/**
 * Criado sob demanda, e não na carga do módulo: quando a aplicação roda em modo
 * arquivo JSON (sem DATABASE_URL), este módulo é importado mas nunca conecta.
 */
export function obterPrisma(): PrismaClient {
  const existente = globalParaPrisma.__maraPrisma;
  if (existente) return existente;

  const cliente = criarCliente();
  globalParaPrisma.__maraPrisma = cliente;
  return cliente;
}

/** `true` quando a aplicação deve usar PostgreSQL em vez dos arquivos JSON. */
export function usarPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
