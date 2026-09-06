import { Ocupacao, Pagamento } from "@/domain/entities";
import { RecursoNaoEncontrado } from "@/domain/errors";
import { Dinheiro, paraDataLocal, Periodo } from "@/domain/value-objects";
import type {
  ContratoRepository,
  ImovelRepository,
  InquilinoRepository,
  LeadRepository,
  OcupacaoRepository,
  PagamentoRepository,
} from "@/domain/repositories";
import type {
  ComparativoImovel,
  IndicadoresDashboard,
  PeriodoDoImovel,
  PontoReceitaMensal,
} from "@/application/dtos";
import { paraCobranca, paraResumoImovel, paraResumoInquilino } from "@/application/mappers";
import { addMonths, differenceInCalendarDays, format, subMonths } from "date-fns";

/**
 * Compara todas as ocupações de um mesmo imóvel: receita, inadimplência,
 * duração e vacância entre uma ocupação e a seguinte.
 */
export class CompararPeriodosImovel {
  constructor(
    private readonly imoveis: ImovelRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly inquilinos: InquilinoRepository,
    private readonly pagamentos: PagamentoRepository,
  ) {}

  async executar(imovelId: string): Promise<ComparativoImovel> {
    const imovel = await this.imoveis.buscarPorId(imovelId);
    if (!imovel) throw new RecursoNaoEncontrado("Imóvel", imovelId);

    const todas = await this.ocupacoes.listar({ imovelId });
    // Ordem cronológica: a vacância só faz sentido comparando com a ocupação anterior.
    const ocupacoes = [...todas].sort((a, b) => (a.dataEntrada > b.dataEntrada ? 1 : -1));

    if (ocupacoes.length === 0) {
      return {
        imovel,
        periodos: [],
        receitaTotal: 0,
        diasVagos: 0,
        diasOcupados: 0,
        taxaOcupacao: 0,
        melhorPeriodoId: null,
      };
    }

    const inquilinos = await this.inquilinos.listar();
    const porInquilino = new Map(inquilinos.map((i) => [i.id, i]));
    const cobrancas = await this.pagamentos.listar({ ocupacaoIds: ocupacoes.map((o) => o.id) });
    const hoje = new Date();

    const periodos: PeriodoDoImovel[] = ocupacoes.map((ocupacao, indice) => {
      const doPeriodo = cobrancas.filter((c) => c.ocupacaoId === ocupacao.id);
      const cobrado = Dinheiro.somar(...doPeriodo.map(Pagamento.valorTotal));
      const recebido = Dinheiro.somar(...doPeriodo.map(Pagamento.valorPago));
      const inadimplencia = Dinheiro.naoNegativo(Dinheiro.subtrair(cobrado, recebido));
      const duracaoMeses = Math.max(1, Periodo.duracaoEmMeses(Ocupacao.periodo(ocupacao), hoje));
      const anterior = ocupacoes[indice - 1];
      const inquilino = porInquilino.get(ocupacao.inquilinoId);

      return {
        ocupacao,
        inquilino: inquilino
          ? paraResumoInquilino(inquilino)
          : { id: ocupacao.inquilinoId, nome: "Inquilino removido", telefone: "", documento: "" },
        duracaoMeses,
        receitaTotal: recebido,
        receitaMediaMensal: Dinheiro.criar(recebido / duracaoMeses),
        inadimplencia,
        taxaInadimplencia: cobrado > 0 ? Math.round((inadimplencia / cobrado) * 1000) / 10 : 0,
        vacanciaAnteriorDias: anterior
          ? Periodo.intervaloEntre(Ocupacao.periodo(anterior), Ocupacao.periodo(ocupacao))
          : null,
      };
    });

    const diasOcupados = ocupacoes.reduce(
      (total, ocupacao) => total + Periodo.duracaoEmDias(Ocupacao.periodo(ocupacao), hoje),
      0,
    );
    const vacanciaEntre = periodos.reduce((total, p) => total + (p.vacanciaAnteriorDias ?? 0), 0);
    // Vacância em aberto: desde a saída do último inquilino até hoje.
    const ultima = ocupacoes[ocupacoes.length - 1];
    const vacanciaAtual =
      ultima.dataSaida !== null
        ? Math.max(0, differenceInCalendarDays(hoje, paraDataLocal(ultima.dataSaida)))
        : 0;
    const diasVagos = vacanciaEntre + vacanciaAtual;

    const melhor = [...periodos].sort((a, b) => b.receitaMediaMensal - a.receitaMediaMensal)[0];

    return {
      imovel,
      periodos,
      receitaTotal: Dinheiro.somar(...periodos.map((p) => p.receitaTotal)),
      diasVagos,
      diasOcupados,
      taxaOcupacao:
        diasOcupados + diasVagos > 0
          ? Math.round((diasOcupados / (diasOcupados + diasVagos)) * 1000) / 10
          : 0,
      melhorPeriodoId: melhor?.ocupacao.id ?? null,
    };
  }
}

/** Série de receita cobrada x recebida por mês — base dos gráficos. */
export class ObterReceitaMensal {
  constructor(private readonly pagamentos: PagamentoRepository) {}

  async executar(meses = 12, filtro: { ocupacaoIds?: readonly string[] } = {}): Promise<PontoReceitaMensal[]> {
    const hoje = new Date();
    const mesDe = format(subMonths(hoje, meses - 1), "yyyy-MM");
    const mesAte = format(hoje, "yyyy-MM");

    const cobrancas = await this.pagamentos.listar({
      mesDe,
      mesAte,
      ocupacaoIds: filtro.ocupacaoIds,
    });

    const acumulado = new Map<string, { cobrado: number; recebido: number }>();
    for (let i = meses - 1; i >= 0; i -= 1) {
      acumulado.set(format(subMonths(hoje, i), "yyyy-MM"), { cobrado: 0, recebido: 0 });
    }

    for (const cobranca of cobrancas) {
      const ponto = acumulado.get(cobranca.mesReferencia);
      if (!ponto) continue;
      ponto.cobrado = Dinheiro.somar(ponto.cobrado, Pagamento.valorTotal(cobranca));
      ponto.recebido = Dinheiro.somar(ponto.recebido, Pagamento.valorPago(cobranca));
    }

    return [...acumulado.entries()].map(([mes, valores]) => ({
      mes,
      cobrado: valores.cobrado,
      recebido: valores.recebido,
      emAberto: Dinheiro.naoNegativo(Dinheiro.subtrair(valores.cobrado, valores.recebido)),
    }));
  }
}

export class ObterIndicadoresDashboard {
  constructor(
    private readonly imoveis: ImovelRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly inquilinos: InquilinoRepository,
    private readonly pagamentos: PagamentoRepository,
    private readonly contratos: ContratoRepository,
    private readonly leads: LeadRepository,
  ) {}

  async executar(): Promise<IndicadoresDashboard> {
    const hoje = new Date();
    const mesAtual = format(hoje, "yyyy-MM");

    const [listaImoveis, listaOcupacoes, listaInquilinos, listaContratos, listaLeads] =
      await Promise.all([
        this.imoveis.listar(),
        this.ocupacoes.listar(),
        this.inquilinos.listar(),
        this.contratos.listar({ status: "vigente" }),
        this.leads.listar({ status: "novo" }),
      ]);

    const cobrancas = await this.pagamentos.listar();

    const porOcupacao = new Map(listaOcupacoes.map((o) => [o.id, o]));
    const porImovel = new Map(listaImoveis.map((i) => [i.id, i]));
    const porInquilino = new Map(listaInquilinos.map((i) => [i.id, i]));

    const doMes = cobrancas.filter((c) => c.mesReferencia === mesAtual);
    const inadimplenciaTotal = Dinheiro.somar(...cobrancas.map(Pagamento.saldoDevedor));

    const enriquecidas = cobrancas.flatMap((pagamento) => {
      const ocupacao = porOcupacao.get(pagamento.ocupacaoId);
      if (!ocupacao) return [];
      const imovel = porImovel.get(ocupacao.imovelId);
      const inquilino = porInquilino.get(ocupacao.inquilinoId);
      if (!imovel || !inquilino) return [];
      return [paraCobranca(pagamento, paraResumoImovel(imovel), paraResumoInquilino(inquilino), hoje)];
    });

    const emAtraso = enriquecidas.filter((c) => c.status === "atrasado");
    const limiteVencimento = addMonths(hoje, 2);
    const alugados = listaImoveis.filter((i) => i.status === "alugado").length;
    const disponiveis = listaImoveis.filter((i) => i.status === "disponivel").length;
    const consideradosParaTaxa = listaImoveis.filter((i) => i.status !== "inativo").length;

    const receitaPorMes = await new ObterReceitaMensal(this.pagamentos).executar(12);

    return {
      totalImoveis: listaImoveis.length,
      imoveisAlugados: alugados,
      imoveisDisponiveis: disponiveis,
      taxaOcupacao:
        consideradosParaTaxa > 0 ? Math.round((alugados / consideradosParaTaxa) * 1000) / 10 : 0,
      receitaMesAtual: Dinheiro.somar(...doMes.map(Pagamento.valorTotal)),
      recebidoMesAtual: Dinheiro.somar(...doMes.map(Pagamento.valorPago)),
      inadimplenciaTotal,
      cobrancasEmAtraso: emAtraso.length,
      contratosVencendo: listaContratos.filter(
        (c) => paraDataLocal(c.condicoes.dataFim) <= limiteVencimento,
      ).length,
      leadsNovos: listaLeads.length,
      receitaPorMes,
      cobrancasCriticas: [...emAtraso]
        .sort((a, b) => b.saldoDevedor - a.saldoDevedor)
        .slice(0, 5),
    };
  }
}
