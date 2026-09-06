import type { Contrato, CondicoesContrato } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import type {
  ContratoRepository,
  FiltroContratos,
  ImovelRepository,
  InquilinoRepository,
  OcupacaoRepository,
} from "@/domain/repositories";
import type { ContratoPdfService, StorageService } from "@/domain/services";
import type { ContratoDetalhado } from "@/application/dtos";
import { paraResumoImovel, paraResumoInquilino } from "@/application/mappers";
import { ROTULOS_TIPO_IMOVEL } from "@/domain/entities";
import { siteConfig } from "@/lib/config";
import { formatarCpfCnpj, formatarTelefone } from "@/lib/formatters";
import { addMonths, format } from "date-fns";

/** A URL pública emitida pelo storage carrega a chave no final do caminho. */
function chaveDeUrl(url: string): string {
  return url.replace(/^\/api\/arquivos\//, "");
}

/** Dados do locador exibidos no contrato. Viriam de uma tabela de configuração no futuro. */
const LOCADOR = {
  nome: "Mara Siqueira Administração de Imóveis ME",
  documento: "12.345.678/0001-90",
  endereco: siteConfig.endereco,
};

export class ListarContratos {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly inquilinos: InquilinoRepository,
  ) {}

  async executar(
    filtro: FiltroContratos & { imovelId?: string; inquilinoId?: string } = {},
  ): Promise<ContratoDetalhado[]> {
    const [contratos, ocupacoes, imoveis, inquilinos] = await Promise.all([
      this.contratos.listar({ ocupacaoId: filtro.ocupacaoId, status: filtro.status }),
      this.ocupacoes.listar(),
      this.imoveis.listar(),
      this.inquilinos.listar(),
    ]);

    const porOcupacao = new Map(ocupacoes.map((o) => [o.id, o]));
    const porImovel = new Map(imoveis.map((i) => [i.id, i]));
    const porInquilino = new Map(inquilinos.map((i) => [i.id, i]));

    return contratos.flatMap((contrato) => {
      const ocupacao = porOcupacao.get(contrato.ocupacaoId);
      if (!ocupacao) return [];
      if (filtro.imovelId && ocupacao.imovelId !== filtro.imovelId) return [];
      if (filtro.inquilinoId && ocupacao.inquilinoId !== filtro.inquilinoId) return [];

      const imovel = porImovel.get(ocupacao.imovelId);
      const inquilino = porInquilino.get(ocupacao.inquilinoId);
      if (!imovel || !inquilino) return [];

      return [
        {
          contrato,
          ocupacao,
          imovel: paraResumoImovel(imovel),
          inquilino: paraResumoInquilino(inquilino),
        },
      ];
    });
  }
}

export class ObterContrato {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly inquilinos: InquilinoRepository,
  ) {}

  async executar(id: string): Promise<ContratoDetalhado> {
    const contrato = await this.contratos.buscarPorId(id);
    if (!contrato) throw new RecursoNaoEncontrado("Contrato", id);

    const ocupacao = await this.ocupacoes.buscarPorId(contrato.ocupacaoId);
    if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", contrato.ocupacaoId);

    const [imovel, inquilino] = await Promise.all([
      this.imoveis.buscarPorId(ocupacao.imovelId),
      this.inquilinos.buscarPorId(ocupacao.inquilinoId),
    ]);
    if (!imovel) throw new RecursoNaoEncontrado("Imóvel", ocupacao.imovelId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", ocupacao.inquilinoId);

    return {
      contrato,
      ocupacao,
      imovel: paraResumoImovel(imovel),
      inquilino: paraResumoInquilino(inquilino),
    };
  }
}

export interface DadosNovoContrato {
  ocupacaoId: string;
  prazoMeses: number;
  indiceReajuste: string;
  clausulasAdicionais?: string;
  /** Quando omitidos, herdam os valores da ocupação. */
  valorAluguel?: number;
  valorCaucao?: number;
  diaVencimento?: number;
  dataInicio?: string;
}

export class CriarContrato {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly ocupacoes: OcupacaoRepository,
  ) {}

  async executar(dados: DadosNovoContrato): Promise<Contrato> {
    const ocupacao = await this.ocupacoes.buscarPorId(dados.ocupacaoId);
    if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", dados.ocupacaoId);

    const dataInicio = dados.dataInicio ?? ocupacao.dataEntrada;
    const condicoes: CondicoesContrato = {
      valorAluguel: dados.valorAluguel ?? ocupacao.valorAluguel,
      valorCaucao: dados.valorCaucao ?? ocupacao.valorCaucao,
      diaVencimento: dados.diaVencimento ?? ocupacao.diaVencimento,
      prazoMeses: dados.prazoMeses,
      indiceReajuste: dados.indiceReajuste,
      dataInicio,
      dataFim: format(addMonths(new Date(`${dataInicio}T12:00:00`), dados.prazoMeses), "yyyy-MM-dd"),
      clausulasAdicionais: dados.clausulasAdicionais,
    };

    return this.contratos.criar({
      ocupacaoId: dados.ocupacaoId,
      status: ocupacao.status === "ativa" ? "vigente" : "encerrado",
      condicoes,
      arquivoPdfUrl: null,
      dataGeracao: null,
    });
  }
}

export class EditarContrato {
  constructor(private readonly contratos: ContratoRepository) {}

  async executar(id: string, condicoes: Partial<CondicoesContrato>): Promise<Contrato> {
    const atual = await this.contratos.buscarPorId(id);
    if (!atual) throw new RecursoNaoEncontrado("Contrato", id);

    const mescladas = { ...atual.condicoes, ...condicoes };
    const dataFim = format(
      addMonths(new Date(`${mescladas.dataInicio}T12:00:00`), mescladas.prazoMeses),
      "yyyy-MM-dd",
    );

    // Alterar as condições invalida o PDF já emitido — ele precisa ser regerado.
    return this.contratos.atualizar(id, {
      condicoes: { ...mescladas, dataFim },
      arquivoPdfUrl: null,
      dataGeracao: null,
    });
  }
}

/**
 * Gera o PDF do contrato e o armazena.
 *
 * O caso de uso não sabe que o PDF é feito com @react-pdf/renderer nem que o
 * arquivo vai para o disco local — fala apenas com as portas ContratoPdfService
 * e StorageService.
 */
export class GerarContratoPdf {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly inquilinos: InquilinoRepository,
    private readonly pdf: ContratoPdfService,
    private readonly storage: StorageService,
  ) {}

  async executar(contratoId: string): Promise<Contrato> {
    const contrato = await this.contratos.buscarPorId(contratoId);
    if (!contrato) throw new RecursoNaoEncontrado("Contrato", contratoId);

    const ocupacao = await this.ocupacoes.buscarPorId(contrato.ocupacaoId);
    if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", contrato.ocupacaoId);

    const [imovel, inquilino] = await Promise.all([
      this.imoveis.buscarPorId(ocupacao.imovelId),
      this.inquilinos.buscarPorId(ocupacao.inquilinoId),
    ]);
    if (!imovel) throw new RecursoNaoEncontrado("Imóvel", ocupacao.imovelId);
    if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", ocupacao.inquilinoId);

    const bytes = await this.pdf.gerar({
      numero: contrato.numero,
      locador: LOCADOR,
      locatario: {
        nome: inquilino.nome,
        documento: formatarCpfCnpj(inquilino.documento),
        email: inquilino.email,
        telefone: formatarTelefone(inquilino.telefone),
      },
      imovel: {
        titulo: imovel.titulo,
        enderecoCompleto: Endereco.completo(imovel.endereco),
        tipo: ROTULOS_TIPO_IMOVEL[imovel.tipo],
        areaM2: imovel.caracteristicas.areaM2,
      },
      condicoes: contrato.condicoes,
      cidadeAssinatura: imovel.endereco.cidade,
      dataEmissao: new Date().toISOString(),
    });

    // Substitui o PDF anterior para não acumular arquivos órfãos.
    if (contrato.arquivoPdfUrl) {
      await this.storage.remover(chaveDeUrl(contrato.arquivoPdfUrl));
    }

    const arquivo = await this.storage.salvar("contratos", {
      nome: `contrato-${contrato.numero.replace("/", "-")}.pdf`,
      tipo: "application/pdf",
      conteudo: bytes,
    });

    return this.contratos.atualizar(contratoId, {
      arquivoPdfUrl: arquivo.url,
      dataGeracao: new Date().toISOString(),
    });
  }
}

export class ExcluirContrato {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly storage: StorageService,
  ) {}

  async executar(id: string): Promise<void> {
    const contrato = await this.contratos.buscarPorId(id);
    if (!contrato) throw new RecursoNaoEncontrado("Contrato", id);
    if (contrato.status === "vigente") {
      throw new RegraDeNegocioViolada(
        "Contratos vigentes não podem ser excluídos. Encerre a ocupação antes.",
      );
    }
    if (contrato.arquivoPdfUrl) {
      await this.storage.remover(chaveDeUrl(contrato.arquivoPdfUrl));
    }
    await this.contratos.excluir(id);
  }
}
