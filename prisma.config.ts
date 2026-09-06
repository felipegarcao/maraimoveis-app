import { config as carregarEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// A CLI do Prisma não lê arquivos .env sozinha desde a v7. No container as
// variáveis já vêm do ambiente; localmente elas vêm daqui.
carregarEnv({ path: [".env.local", ".env"], quiet: true });

/**
 * Configuração dos comandos do Prisma (migrate, db push, studio).
 * A aplicação em si conecta pelo driver adapter em `prisma-client.ts` —
 * este arquivo serve à CLI.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
