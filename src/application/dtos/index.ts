import type {
  Contrato,
  Imovel,
  Inquilino,
  Ocupacao,
  Pagamento,
  StatusPagamento,
} from "@/domain/entities";
import type { Dinheiro } from "@/domain/value-objects";

/**
 * DTOs existem apenas onde a UI precisa de dados de mais de um agregado.
 * Quando uma tela consome uma entidade isolada, ela recebe a própria entidade —
 * que já é um objeto serializável e atravessa a fronteira Server → Client sem mapeamento.
 */

export interface ResumoImovel {
  readonly id: string;
  readonly titulo: string;
  readonly enderecoResumo: string;
  readonly fotoCapaUrl: string | null;
}

export interface ResumoInquilino {
  readonly id: string;
  readonly nome: string;
  readonly telefone: string;
  readonly email?: string;
  readonly documento: string;
}

/** Uma cobrança mensal com todos os valores derivados já calculados. */
export interface CobrancaMensal {
  readonly pagamento: Pagamento;
  readonly valorTotal: Dinheiro;
  readonly valorPago: Dinheiro;
  readonly saldoDevedor: Dinheiro;
  readonly status: StatusPagamento;
  readonly dataUltimoPagamento: string | null;
  readonly imovel: ResumoImovel;
  readonly inquilino: ResumoInquilino;
}

export interface ResumoFinanceiroOcupacao {
  readonly totalCobrado: Dinheiro;
  readonly totalRecebido: Dinheiro;
  readonly saldoDevedor: Dinheiro;
  readonly mesesCobrados: number;
  readonly mesesEmAberto: number;
  /** Percentual de 0 a 100. */
  readonly taxaAdimplencia: number;
}

export interface OcupacaoDetalhada {
  readonly ocupacao: Ocupacao;
  readonly imovel: ResumoImovel;
  readonly inquilino: ResumoInquilino;
  readonly contrato: Contrato | null;
  readonly duracaoMeses: number;
  readonly financeiro: ResumoFinanceiroOcupacao;
}

export interface HistoricoInquilino {
  readonly inquilino: Inquilino;
  readonly ocupacoes: readonly OcupacaoDetalhada[];
  readonly ocupacaoAtual: OcupacaoDetalhada | null;
  readonly totalPago: Dinheiro;
  readonly saldoDevedorTotal: Dinheiro;
  readonly mesesComoInquilino: number;
}

/** Uma ocupação vista sob a ótica do relatório do imóvel. */
export interface PeriodoDoImovel {
  readonly ocupacao: Ocupacao;
  readonly inquilino: ResumoInquilino;
  readonly duracaoMeses: number;
  readonly receitaTotal: Dinheiro;
  readonly receitaMediaMensal: Dinheiro;
  readonly inadimplencia: Dinheiro;
  readonly taxaInadimplencia: number;
  /** Dias vagos entre a ocupação anterior e esta. `null` na primeira. */
  readonly vacanciaAnteriorDias: number | null;
}

export interface ComparativoImovel {
  readonly imovel: Imovel;
  readonly periodos: readonly PeriodoDoImovel[];
  readonly receitaTotal: Dinheiro;
  readonly diasVagos: number;
  readonly diasOcupados: number;
  readonly taxaOcupacao: number;
  readonly melhorPeriodoId: string | null;
}

export interface PontoReceitaMensal {
  readonly mes: string;
  readonly cobrado: number;
  readonly recebido: number;
  readonly emAberto: number;
}

export interface IndicadoresDashboard {
  readonly totalImoveis: number;
  readonly imoveisAlugados: number;
  readonly imoveisDisponiveis: number;
  readonly taxaOcupacao: number;
  readonly receitaMesAtual: Dinheiro;
  readonly recebidoMesAtual: Dinheiro;
  readonly inadimplenciaTotal: Dinheiro;
  readonly cobrancasEmAtraso: number;
  readonly contratosVencendo: number;
  readonly leadsNovos: number;
  readonly receitaPorMes: readonly PontoReceitaMensal[];
  readonly cobrancasCriticas: readonly CobrancaMensal[];
}

/** Resultado padronizado das Server Actions consumidas por formulários. */
export type ResultadoAcao<T = void> =
  | { readonly sucesso: true; readonly dados: T }
  | { readonly sucesso: false; readonly erro: string; readonly camposInvalidos?: Record<string, string> };

export interface ContratoDetalhado {
  readonly contrato: Contrato;
  readonly ocupacao: Ocupacao;
  readonly imovel: ResumoImovel;
  readonly inquilino: ResumoInquilino;
}

/** Tudo que o portal do inquilino mostra, resolvido em uma única consulta. */
export interface PainelInquilino {
  readonly inquilino: Inquilino;
  /** `true` enquanto ele não trocou a senha padrão (o próprio documento). */
  readonly usandoSenhaPadrao: boolean;
  readonly ocupacaoAtual: OcupacaoDetalhada | null;
  readonly imovelAtual: Imovel | null;
  readonly contratoAtual: Contrato | null;
  readonly ocupacoesAnteriores: readonly OcupacaoDetalhada[];
  readonly cobrancasPendentes: readonly CobrancaMensal[];
  readonly cobrancasPagas: readonly CobrancaMensal[];
  readonly totalPago: Dinheiro;
  readonly totalEmAberto: Dinheiro;
  readonly proximaCobranca: CobrancaMensal | null;
}
