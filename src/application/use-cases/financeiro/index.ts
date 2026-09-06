import { Pagamento, type FormaPagamento, type StatusPagamento } from "@/domain/entities";
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import { Dinheiro } from "@/domain/value-objects";
import type {
  ImovelRepository,
  InquilinoRepository,
  OcupacaoRepository,
  PagamentoRepository,
} from "@/domain/repositories";
import type { CobrancaMensal, ResumoFinanceiroOcupacao } from "@/application/dtos";
import { paraCobranca, paraResumoImovel, paraResumoInquilino, resumirFinanceiro } from "@/application/mappers";
import { gerarId } from "@/lib/utils";
import { format, lastDayOfMonth } from "date-fns";

export interface FiltroCobrancas {
  readonly ocupacaoId?: string;
  readonly imovelId?: string;
  readonly inquilinoId?: string;
  readonly mesDe?: string;
  readonly mesAte?: string;
  readonly status?: StatusPagamento;
}

/** Repositórios necessários para montar cobranças enriquecidas. */
export interface FontesFinanceiro {
  readonly pagamentos: PagamentoRepository;
  readonly ocupacoes: OcupacaoRepository;
  readonly imoveis: ImovelRepository;
  readonly inquilinos: InquilinoRepository;
}

export class ListarCobrancas {
  constructor(private readonly fontes: FontesFinanceiro) {}

  async executar(filtro: FiltroCobrancas = {}): Promise<CobrancaMensal[]> {
    const { pagamentos, ocupacoes, imoveis, inquilinos } = this.fontes;

    const todasOcupacoes = await ocupacoes.listar({
      imovelId: filtro.imovelId,
      inquilinoId: filtro.inquilinoId,
    });
    const relevantes = filtro.ocupacaoId
      ? todasOcupacoes.filter((o) => o.id === filtro.ocupacaoId)
      : todasOcupacoes;

    if (relevantes.length === 0) return [];

    const [listaPagamentos, listaImoveis, listaInquilinos] = await Promise.all([
      pagamentos.listar({
        ocupacaoIds: relevantes.map((o) => o.id),
        mesDe: filtro.mesDe,
        mesAte: filtro.mesAte,
      }),
      imoveis.listar(),
      inquilinos.listar(),
    ]);

    const porOcupacao = new Map(relevantes.map((o) => [o.id, o]));
    const porImovel = new Map(listaImoveis.map((i) => [i.id, i]));
    const porInquilino = new Map(listaInquilinos.map((i) => [i.id, i]));
    const agora = new Date();

    const cobrancas = listaPagamentos.flatMap((pagamento) => {
      const ocupacao = porOcupacao.get(pagamento.ocupacaoId);
      if (!ocupacao) return [];
      const imovel = porImovel.get(ocupacao.imovelId);
      const inquilino = porInquilino.get(ocupacao.inquilinoId);
      if (!imovel || !inquilino) return [];
      return [paraCobranca(pagamento, paraResumoImovel(imovel), paraResumoInquilino(inquilino), agora)];
    });

    return filtro.status ? cobrancas.filter((c) => c.status === filtro.status) : cobrancas;
  }
}

export interface DadosCobranca {
  ocupacaoId: string;
  mesReferencia: string;
  valorAluguel: number;
  valorAgua: number;
  valorLuz: number;
  outrosValores?: number;
  descricaoOutros?: string;
  dataVencimento?: string;
}

/**
 * Cria a cobrança de um mês. É aqui que entram os consumos de água e luz,
 * que variam mês a mês e por isso não ficam na entidade Imovel.
 */
export class RegistrarCobrancaMensal {
  constructor(
    private readonly pagamentos: PagamentoRepository,
    private readonly ocupacoes: OcupacaoRepository,
  ) {}

  async executar(dados: DadosCobranca): Promise<Pagamento> {
    const ocupacao = await this.ocupacoes.buscarPorId(dados.ocupacaoId);
    if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", dados.ocupacaoId);

    const existente = await this.pagamentos.buscarPorMes(dados.ocupacaoId, dados.mesReferencia);
    if (existente) {
      throw new RegraDeNegocioViolada(
        `Já existe uma cobrança registrada para ${dados.mesReferencia} nesta ocupação.`,
      );
    }

    return this.pagamentos.criar({
      ocupacaoId: dados.ocupacaoId,
      mesReferencia: dados.mesReferencia,
      valorAluguel: Dinheiro.criar(dados.valorAluguel),
      valorAgua: Dinheiro.criar(dados.valorAgua),
      valorLuz: Dinheiro.criar(dados.valorLuz),
      outrosValores: Dinheiro.criar(dados.outrosValores ?? 0),
      descricaoOutros: dados.descricaoOutros,
      dataVencimento: dados.dataVencimento ?? vencimentoDoMes(dados.mesReferencia, ocupacao.diaVencimento),
    });
  }
}

export class EditarCobranca {
  constructor(private readonly pagamentos: PagamentoRepository) {}

  async executar(
    id: string,
    dados: Partial<Omit<DadosCobranca, "ocupacaoId" | "mesReferencia">>,
  ): Promise<Pagamento> {
    const atual = await this.pagamentos.buscarPorId(id);
    if (!atual) throw new RecursoNaoEncontrado("Cobrança", id);

    return this.pagamentos.atualizar(id, {
      ...(dados.valorAluguel !== undefined && { valorAluguel: Dinheiro.criar(dados.valorAluguel) }),
      ...(dados.valorAgua !== undefined && { valorAgua: Dinheiro.criar(dados.valorAgua) }),
      ...(dados.valorLuz !== undefined && { valorLuz: Dinheiro.criar(dados.valorLuz) }),
      ...(dados.outrosValores !== undefined && {
        outrosValores: Dinheiro.criar(dados.outrosValores),
      }),
      ...(dados.descricaoOutros !== undefined && { descricaoOutros: dados.descricaoOutros }),
      ...(dados.dataVencimento !== undefined && { dataVencimento: dados.dataVencimento }),
    });
  }
}

/** Abre as cobranças do mês para todas as ocupações ativas de uma vez. */
export class GerarCobrancasDoMes {
  constructor(
    private readonly pagamentos: PagamentoRepository,
    private readonly ocupacoes: OcupacaoRepository,
  ) {}

  async executar(mesReferencia: string): Promise<{ criadas: number; jaExistiam: number }> {
    const ativas = await this.ocupacoes.listar({ status: "ativa" });
    let criadas = 0;
    let jaExistiam = 0;

    for (const ocupacao of ativas) {
      const existente = await this.pagamentos.buscarPorMes(ocupacao.id, mesReferencia);
      if (existente) {
        jaExistiam += 1;
        continue;
      }
      // Água e luz entram zerados: o valor real é lançado quando a conta chega.
      await this.pagamentos.criar({
        ocupacaoId: ocupacao.id,
        mesReferencia,
        valorAluguel: ocupacao.valorAluguel,
        valorAgua: 0,
        valorLuz: 0,
        outrosValores: 0,
        dataVencimento: vencimentoDoMes(mesReferencia, ocupacao.diaVencimento),
      });
      criadas += 1;
    }

    return { criadas, jaExistiam };
  }
}

export interface DadosRecebimento {
  pagamentoId: string;
  valor: number;
  data: string;
  forma: FormaPagamento;
  observacao?: string;
}

/**
 * Registra um recebimento. O saldo devedor não é armazenado — é sempre
 * derivado dos recebimentos, então nunca fica dessincronizado.
 */
export class RegistrarPagamento {
  constructor(private readonly pagamentos: PagamentoRepository) {}

  async executar(dados: DadosRecebimento): Promise<{ pagamento: Pagamento; saldoDevedor: number }> {
    const pagamento = await this.pagamentos.buscarPorId(dados.pagamentoId);
    if (!pagamento) throw new RecursoNaoEncontrado("Cobrança", dados.pagamentoId);

    const valor = Dinheiro.criar(dados.valor);
    if (valor <= 0) {
      throw new RegraDeNegocioViolada("O valor do pagamento deve ser maior que zero.");
    }

    const saldoAtual = Pagamento.saldoDevedor(pagamento);
    if (Dinheiro.maiorQue(valor, saldoAtual)) {
      throw new RegraDeNegocioViolada(
        `O valor informado excede o saldo devedor de ${saldoAtual.toFixed(2)}. Ajuste a cobrança se houver acréscimos.`,
      );
    }

    const atualizado = await this.pagamentos.atualizar(pagamento.id, {
      recebimentos: [
        ...pagamento.recebimentos,
        {
          id: gerarId("rcb"),
          valor,
          data: dados.data,
          forma: dados.forma,
          observacao: dados.observacao,
        },
      ],
    });

    return { pagamento: atualizado, saldoDevedor: Pagamento.saldoDevedor(atualizado) };
  }
}

export class RemoverRecebimento {
  constructor(private readonly pagamentos: PagamentoRepository) {}

  async executar(pagamentoId: string, recebimentoId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentos.buscarPorId(pagamentoId);
    if (!pagamento) throw new RecursoNaoEncontrado("Cobrança", pagamentoId);

    const restantes = pagamento.recebimentos.filter((r) => r.id !== recebimentoId);
    if (restantes.length === pagamento.recebimentos.length) {
      throw new RecursoNaoEncontrado("Recebimento", recebimentoId);
    }
    return this.pagamentos.atualizar(pagamentoId, { recebimentos: restantes });
  }
}

export class ExcluirCobranca {
  constructor(private readonly pagamentos: PagamentoRepository) {}

  async executar(id: string): Promise<void> {
    const pagamento = await this.pagamentos.buscarPorId(id);
    if (!pagamento) throw new RecursoNaoEncontrado("Cobrança", id);
    if (pagamento.recebimentos.length > 0) {
      throw new RegraDeNegocioViolada(
        "Esta cobrança já possui recebimentos lançados. Remova os recebimentos antes de excluí-la.",
      );
    }
    await this.pagamentos.excluir(id);
  }
}

export class CalcularSaldoDevedor {
  constructor(private readonly pagamentos: PagamentoRepository) {}

  /** Saldo consolidado de uma ocupação. */
  async porOcupacao(ocupacaoId: string): Promise<ResumoFinanceiroOcupacao> {
    return resumirFinanceiro(await this.pagamentos.listar({ ocupacaoId }));
  }

  /** Saldo consolidado de várias ocupações (usado no histórico do inquilino). */
  async porOcupacoes(ocupacaoIds: readonly string[]): Promise<ResumoFinanceiroOcupacao> {
    if (ocupacaoIds.length === 0) return resumirFinanceiro([]);
    return resumirFinanceiro(await this.pagamentos.listar({ ocupacaoIds }));
  }
}

function vencimentoDoMes(mesReferencia: string, dia: number): string {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimo = lastDayOfMonth(new Date(ano, mes - 1, 1)).getDate();
  return format(new Date(ano, mes - 1, Math.min(dia, ultimo)), "yyyy-MM-dd");
}
