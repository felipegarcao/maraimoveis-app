import { Ocupacao, type MotivoSaida, type StatusImovel } from "@/domain/entities";
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import { Periodo } from "@/domain/value-objects";
import type {
  ContratoRepository,
  FiltroOcupacoes,
  ImovelRepository,
  InquilinoRepository,
  OcupacaoRepository,
  PagamentoRepository,
} from "@/domain/repositories";
import type { OcupacaoDetalhada } from "@/application/dtos";
import { paraResumoImovel, paraResumoInquilino, resumirFinanceiro } from "@/application/mappers";

export interface DadosEntrada {
  imovelId: string;
  inquilinoId: string;
  dataEntrada: string;
  valorAluguel: number;
  diaVencimento: number;
  valorCaucao: number;
  observacoes?: string;
}

export interface DadosSaida {
  dataSaida: string;
  motivoSaida: MotivoSaida;
  condicoesEntrega?: string;
  /** Para onde o imóvel vai depois da saída: volta a anunciar ou entra em reforma. */
  novoStatusImovel?: Extract<StatusImovel, "disponivel" | "manutencao">;
}

/**
 * Registrar entrada toca dois agregados: cria a ocupação e move o imóvel para
 * "alugado". Isso é regra de aplicação — por isso vive aqui, e não na entidade.
 */
export class RegistrarEntrada {
  constructor(
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly inquilinos: InquilinoRepository,
  ) {}

  async executar(dados: DadosEntrada): Promise<Ocupacao> {
    const [imovel, inquilino] = await Promise.all([
      this.imoveis.buscarPorId(dados.imovelId),
      this.inquilinos.buscarPorId(dados.inquilinoId),
    ]);
    if (!imovel) throw new RecursoNaoEncontrado("Imóvel", dados.imovelId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", dados.inquilinoId);

    const ativa = await this.ocupacoes.buscarAtivaPorImovel(dados.imovelId);
    if (ativa) {
      throw new RegraDeNegocioViolada(
        "Este imóvel já possui uma ocupação ativa. Registre a saída do inquilino atual primeiro.",
      );
    }

    // Impede sobreposição com o histórico já registrado.
    const anteriores = await this.ocupacoes.listar({ imovelId: dados.imovelId });
    const conflito = anteriores.find((o) => o.dataSaida !== null && dados.dataEntrada <= o.dataSaida);
    if (conflito) {
      throw new RegraDeNegocioViolada(
        `A data de entrada se sobrepõe a uma ocupação anterior, encerrada em ${conflito.dataSaida}.`,
      );
    }

    const ocupacao = await this.ocupacoes.criar({
      imovelId: dados.imovelId,
      inquilinoId: dados.inquilinoId,
      dataEntrada: dados.dataEntrada,
      valorAluguel: dados.valorAluguel,
      diaVencimento: dados.diaVencimento,
      valorCaucao: dados.valorCaucao,
      observacoes: dados.observacoes,
      status: "ativa",
    });

    await this.imoveis.atualizar(dados.imovelId, { status: "alugado" });
    if (!inquilino.ativo) {
      await this.inquilinos.atualizar(inquilino.id, { ativo: true });
    }

    return ocupacao;
  }
}

/**
 * Encerra o vínculo sem apagar nada: a ocupação e todo o financeiro dela
 * continuam no histórico do inquilino e do imóvel.
 */
export class RegistrarSaida {
  constructor(
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly contratos: ContratoRepository,
  ) {}

  async executar(ocupacaoId: string, dados: DadosSaida): Promise<Ocupacao> {
    const ocupacao = await this.ocupacoes.buscarPorId(ocupacaoId);
    if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", ocupacaoId);
    if (ocupacao.status === "encerrada") {
      throw new RegraDeNegocioViolada("Esta ocupação já foi encerrada.");
    }
    if (dados.dataSaida < ocupacao.dataEntrada) {
      throw new RegraDeNegocioViolada("A data de saída não pode ser anterior à data de entrada.");
    }

    const encerrada = await this.ocupacoes.atualizar(ocupacaoId, {
      dataSaida: dados.dataSaida,
      status: "encerrada",
      motivoSaida: dados.motivoSaida,
      condicoesEntrega: dados.condicoesEntrega,
    });

    await this.imoveis.atualizar(ocupacao.imovelId, {
      status: dados.novoStatusImovel ?? "disponivel",
    });

    for (const contrato of await this.contratos.buscarPorOcupacao(ocupacaoId)) {
      if (contrato.status !== "encerrado") {
        await this.contratos.atualizar(contrato.id, { status: "encerrado" });
      }
    }

    return encerrada;
  }
}

/** Repositórios necessários para montar o DTO enriquecido de ocupação. */
export interface FontesDeDetalhe {
  readonly imoveis: ImovelRepository;
  readonly inquilinos: InquilinoRepository;
  readonly contratos: ContratoRepository;
  readonly pagamentos: PagamentoRepository;
}

export class ListarOcupacoes {
  constructor(
    private readonly ocupacoes: OcupacaoRepository,
    private readonly fontes: FontesDeDetalhe,
  ) {}

  async executar(filtro: FiltroOcupacoes = {}): Promise<OcupacaoDetalhada[]> {
    const ocupacoes = await this.ocupacoes.listar(filtro);
    return Promise.all(ocupacoes.map((ocupacao) => detalharOcupacao(ocupacao, this.fontes)));
  }
}

export class ObterOcupacao {
  constructor(
    private readonly ocupacoes: OcupacaoRepository,
    private readonly fontes: FontesDeDetalhe,
  ) {}

  async executar(id: string): Promise<OcupacaoDetalhada> {
    const ocupacao = await this.ocupacoes.buscarPorId(id);
    if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", id);
    return detalharOcupacao(ocupacao, this.fontes);
  }
}

export async function detalharOcupacao(
  ocupacao: Ocupacao,
  fontes: FontesDeDetalhe,
): Promise<OcupacaoDetalhada> {
  const [imovel, inquilino, contratosDaOcupacao, cobrancas] = await Promise.all([
    fontes.imoveis.buscarPorId(ocupacao.imovelId),
    fontes.inquilinos.buscarPorId(ocupacao.inquilinoId),
    fontes.contratos.buscarPorOcupacao(ocupacao.id),
    fontes.pagamentos.listar({ ocupacaoId: ocupacao.id }),
  ]);

  return {
    ocupacao,
    imovel: imovel
      ? paraResumoImovel(imovel)
      : { id: ocupacao.imovelId, titulo: "Imóvel removido", enderecoResumo: "—", fotoCapaUrl: null },
    inquilino: inquilino
      ? paraResumoInquilino(inquilino)
      : {
          id: ocupacao.inquilinoId,
          nome: "Inquilino removido",
          telefone: "",
          documento: "",
        },
    contrato: contratosDaOcupacao[0] ?? null,
    duracaoMeses: Periodo.duracaoEmMeses(Ocupacao.periodo(ocupacao)),
    financeiro: resumirFinanceiro(cobrancas),
  };
}
