import { criarCasosDeUso, type CasosDeUso } from "@/application/use-cases";
import { container } from "@/infrastructure/container";

/**
 * Fachada da composição: é o único módulo que as rotas importam para chegar
 * às regras de negócio. As telas nunca conhecem `infrastructure` diretamente.
 */
const global = globalThis as unknown as { __maraCasosDeUso?: CasosDeUso };

export const casosDeUso: CasosDeUso = global.__maraCasosDeUso ?? criarCasosDeUso(container);

if (process.env.NODE_ENV !== "production") {
  global.__maraCasosDeUso = casosDeUso;
}
