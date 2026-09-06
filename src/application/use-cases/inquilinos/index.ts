import { Ocupacao } from "@/domain/entities";
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import { Dinheiro, Periodo } from "@/domain/value-objects";
import type {
  AtualizacaoInquilino,
  ContratoRepository,
  FiltroInquilinos,
  ImovelRepository,
  InquilinoRepository,
  NovoInquilino,
  OcupacaoRepository,
  PagamentoRepository,
} from "@/domain/repositories";
import type { HistoricoInquilino, OcupacaoDetalhada } from "@/application/dtos";
import { paraResumoImovel, paraResumoInquilino, resumirFinanceiro } from "@/application/mappers";
import { apenasDigitos } from "@/lib/utils";

export class ListarInquilinos {
  constructor(private readonly inquilinos: InquilinoRepository) {}

  async executar(filtro: FiltroInquilinos = {}) {
    return this.inquilinos.listar(filtro);
  }
}

export class ObterInquilino {
  constructor(private readonly inquilinos: InquilinoRepository) {}

  async executar(id: string) {
    const inquilino = await this.inquilinos.buscarPorId(id);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", id);
    return inquilino;
  }
}

export class CriarInquilino {
  constructor(private readonly inquilinos: InquilinoRepository) {}

  async executar(dados: NovoInquilino) {
    const existente = await this.inquilinos.buscarPorDocumento(dados.documento);
    if (existente) {
      throw new RegraDeNegocioViolada(
        `Já existe um inquilino cadastrado com este documento (${existente.nome}).`,
      );
    }
    return this.inquilinos.criar({ ...dados, documento: apenasDigitos(dados.documento) });
  }
}

export class EditarInquilino {
  constructor(private readonly inquilinos: InquilinoRepository) {}

  async executar(id: string, dados: AtualizacaoInquilino) {
    const atual = await this.inquilinos.buscarPorId(id);
    if (!atual) throw new RecursoNaoEncontrado("Inquilino", id);

    if (dados.documento) {
      const documento = apenasDigitos(dados.documento);
      const outro = await this.inquilinos.buscarPorDocumento(documento);
      if (outro && outro.id !== id) {
        throw new RegraDeNegocioViolada("Este documento já pertence a outro inquilino.");
      }
      return this.inquilinos.atualizar(id, { ...dados, documento });
    }

    return this.inquilinos.atualizar(id, dados);
  }
}

/**
 * Inquilino com histórico nunca é apagado — o requisito é manter o histórico
 * acessível mesmo depois da saída. Nesse caso apenas inativamos o cadastro.
 */
export class ExcluirInquilino {
  constructor(
    private readonly inquilinos: InquilinoRepository,
    private readonly ocupacoes: OcupacaoRepository,
  ) {}

  async executar(id: string): Promise<{ excluido: boolean }> {
    const inquilino = await this.inquilinos.buscarPorId(id);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", id);

    const ocupacoes = await this.ocupacoes.listar({ inquilinoId: id });
    if (ocupacoes.some((o) => o.status === "ativa")) {
      throw new RegraDeNegocioViolada(
        "Este inquilino possui uma ocupação ativa. Registre a saída antes de excluir o cadastro.",
      );
    }

    if (ocupacoes.length > 0) {
      await this.inquilinos.atualizar(id, { ativo: false });
      return { excluido: false };
    }

    await this.inquilinos.excluir(id);
    return { excluido: true };
  }
}

/**
 * Histórico completo: todos os imóveis onde o inquilino já morou, com período,
 * contrato e situação financeira de cada um — inclusive das ocupações encerradas.
 */
export class ObterHistoricoInquilino {
  constructor(
    private readonly inquilinos: InquilinoRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly contratos: ContratoRepository,
    private readonly pagamentos: PagamentoRepository,
  ) {}

  async executar(inquilinoId: string): Promise<HistoricoInquilino> {
    const inquilino = await this.inquilinos.buscarPorId(inquilinoId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", inquilinoId);

    const ocupacoes = await this.ocupacoes.listar({ inquilinoId });
    const resumoInquilino = paraResumoInquilino(inquilino);

    const detalhadas: OcupacaoDetalhada[] = [];
    for (const ocupacao of ocupacoes) {
      const [imovel, contratosDaOcupacao, pagamentos] = await Promise.all([
        this.imoveis.buscarPorId(ocupacao.imovelId),
        this.contratos.buscarPorOcupacao(ocupacao.id),
        this.pagamentos.listar({ ocupacaoId: ocupacao.id }),
      ]);

      detalhadas.push({
        ocupacao,
        imovel: imovel
          ? paraResumoImovel(imovel)
          : { id: ocupacao.imovelId, titulo: "Imóvel removido", enderecoResumo: "—", fotoCapaUrl: null },
        inquilino: resumoInquilino,
        contrato: contratosDaOcupacao[0] ?? null,
        duracaoMeses: Periodo.duracaoEmMeses(Ocupacao.periodo(ocupacao)),
        financeiro: resumirFinanceiro(pagamentos),
      });
    }

    const ocupacaoAtual = detalhadas.find((d) => d.ocupacao.status === "ativa") ?? null;

    return {
      inquilino,
      ocupacoes: detalhadas,
      ocupacaoAtual,
      totalPago: Dinheiro.somar(...detalhadas.map((d) => d.financeiro.totalRecebido)),
      saldoDevedorTotal: Dinheiro.somar(...detalhadas.map((d) => d.financeiro.saldoDevedor)),
      mesesComoInquilino: detalhadas.reduce((total, d) => total + d.duracaoMeses, 0),
    };
  }
}
