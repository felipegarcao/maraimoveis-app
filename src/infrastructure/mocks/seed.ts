import type { Contrato, Imovel, Inquilino, Lead, Ocupacao, Pagamento } from "@/domain/entities";
import { imoveisMock } from "./imoveis.mock";
import { inquilinosMock } from "./inquilinos.mock";
import { ocupacoesMock } from "./ocupacoes.mock";
import { contratosMock } from "./contratos.mock";
import { pagamentosMock } from "./pagamentos.mock";
import { leadsMock } from "./leads.mock";

/**
 * Decide com o que o sistema nasce.
 *
 * Em produção ele sobe VAZIO — sem imóveis, inquilinos, ocupações, contratos,
 * pagamentos ou leads — para você cadastrar os dados reais. Os mocks continuam
 * no código e alimentam o desenvolvimento.
 *
 * `DADOS_DEMONSTRACAO=true` força os dados de exemplo (útil para um ambiente de
 * demonstração); `=false` força vazio também em desenvolvimento.
 */
export const usarDadosDemonstracao =
  process.env.DADOS_DEMONSTRACAO === "true" ||
  (process.env.DADOS_DEMONSTRACAO !== "false" && process.env.NODE_ENV !== "production");

const demo = <T>(dados: T[]): (() => T[]) => () => (usarDadosDemonstracao ? dados : []);

export const seedImoveis: () => Imovel[] = demo(imoveisMock);
export const seedInquilinos: () => Inquilino[] = demo(inquilinosMock);
export const seedOcupacoes: () => Ocupacao[] = demo(ocupacoesMock);
export const seedContratos: () => Contrato[] = demo(contratosMock);
export const seedPagamentos: () => Pagamento[] = demo(pagamentosMock);
export const seedLeads: () => Lead[] = demo(leadsMock);
