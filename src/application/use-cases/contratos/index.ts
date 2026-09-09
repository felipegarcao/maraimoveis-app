import type { Contrato, CondicoesContrato, Imovel, Inquilino } from "@/domain/entities";
import { Endereco } from "@/domain/value-objects";
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from "@/domain/errors";
import type {
  ContratoRepository,
  FiltroContratos,
  ImovelRepository,
  InquilinoRepository,
  OcupacaoRepository,
} from "@/domain/repositories";
import type {
  ContratoPdfService,
  DadosContratoPdf,
  StorageService,
  WebhookContratoService,
} from "@/domain/services";
import type { ContratoDetalhado } from "@/application/dtos";
import { paraResumoImovel, paraResumoInquilino } from "@/application/mappers";
import { ROTULOS_TIPO_IMOVEL } from "@/domain/entities";
import { locadorConfig } from "@/lib/config";
import { formatarCpfCnpj, formatarTelefone } from "@/lib/formatters";
import { apenasDigitos } from "@/lib/utils";
import { addMonths, format } from "date-fns";

/** A URL pública emitida pelo storage carrega a chave no final do caminho. */
function chaveDeUrl(url: string): string {
  return url.replace(/^\/api\/arquivos\//, "");
}

/** Imóvel comercial muda o título do contrato e a destinação declarada. */
const TIPOS_COMERCIAIS = ["comercial", "galpao"];

/** Nome do arquivo do PDF — o mesmo no storage e no anexo enviado ao n8n. */
function nomeArquivoPdf(numero: string): string {
  return `contrato-${numero.replace(/\//g, "-")}.pdf`;
}

/** Telefone pronto para o fluxo externo: só dígitos, sempre com o DDI 55. */
function comDdi(telefone: string): string {
  const digitos = apenasDigitos(telefone);
  return digitos.startsWith("55") ? digitos : `55${digitos}`;
}

/** Contrato com a ocupação já resolvida em imóvel e inquilino. */
async function carregarContrato(
  contratoId: string,
  fontes: {
    contratos: ContratoRepository;
    ocupacoes: OcupacaoRepository;
    imoveis: ImovelRepository;
    inquilinos: InquilinoRepository;
  },
): Promise<{ contrato: Contrato; imovel: Imovel; inquilino: Inquilino }> {
  const contrato = await fontes.contratos.buscarPorId(contratoId);
  if (!contrato) throw new RecursoNaoEncontrado("Contrato", contratoId);

  const ocupacao = await fontes.ocupacoes.buscarPorId(contrato.ocupacaoId);
  if (!ocupacao) throw new RecursoNaoEncontrado("Ocupação", contrato.ocupacaoId);

  const [imovel, inquilino] = await Promise.all([
    fontes.imoveis.buscarPorId(ocupacao.imovelId),
    fontes.inquilinos.buscarPorId(ocupacao.inquilinoId),
  ]);
  if (!imovel) throw new RecursoNaoEncontrado("Imóvel", ocupacao.imovelId);
  if (!inquilino) throw new RecursoNaoEncontrado("Inquilino", ocupacao.inquilinoId);

  return { contrato, imovel, inquilino };
}

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
 * Reúne, num único lugar, tudo que o contrato precisa exibir: as duas partes
 * qualificadas, o imóvel e as condições. Compartilhado por quem gera o PDF e
 * por quem o reenvia, para os dois nunca divergirem.
 */
function montarDadosPdf(
  contrato: Contrato,
  imovel: Imovel,
  inquilino: Inquilino,
): DadosContratoPdf {
  return {
    numero: contrato.numero,
    locador: {
      nome: locadorConfig.nome,
      rotulo: locadorConfig.rotulo,
      profissao: locadorConfig.profissao || undefined,
      rg: locadorConfig.rg || undefined,
      documento: locadorConfig.documento ? formatarCpfCnpj(locadorConfig.documento) : undefined,
      endereco: locadorConfig.endereco || undefined,
    },
    locatario: {
      nome: inquilino.nome,
      profissao: inquilino.profissao,
      rg: inquilino.rg,
      documento: formatarCpfCnpj(inquilino.documento),
      telefone: formatarTelefone(inquilino.telefone),
    },
    natureza: TIPOS_COMERCIAIS.includes(imovel.tipo) ? "comercial" : "residencial",
    imovel: {
      titulo: imovel.titulo,
      enderecoCompleto: Endereco.completo(imovel.endereco),
      tipo: ROTULOS_TIPO_IMOVEL[imovel.tipo],
      areaM2: imovel.caracteristicas.areaM2,
    },
    condicoes: contrato.condicoes,
    cidadeAssinatura: imovel.endereco.cidade,
    dataEmissao: new Date().toISOString(),
  };
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
    const { contrato, imovel, inquilino } = await carregarContrato(contratoId, {
      contratos: this.contratos,
      ocupacoes: this.ocupacoes,
      imoveis: this.imoveis,
      inquilinos: this.inquilinos,
    });

    const bytes = await this.pdf.gerar(montarDadosPdf(contrato, imovel, inquilino));

    // Substitui o PDF anterior para não acumular arquivos órfãos.
    if (contrato.arquivoPdfUrl) {
      await this.storage.remover(chaveDeUrl(contrato.arquivoPdfUrl));
    }

    const arquivo = await this.storage.salvar("contratos", {
      nome: nomeArquivoPdf(contrato.numero),
      tipo: "application/pdf",
      conteudo: bytes,
    });

    return this.contratos.atualizar(contratoId, {
      arquivoPdfUrl: arquivo.url,
      dataGeracao: new Date().toISOString(),
    });
  }
}

/**
 * Entrega o PDF do contrato ao fluxo do n8n, que decide o destino — no uso
 * previsto, encaminhar por WhatsApp para o número definido no próprio fluxo.
 *
 * O PDF enviado é exatamente o que está guardado: se ainda não existe, ele é
 * gerado antes, para que o arquivo do painel e o que chega ao destinatário
 * sejam o mesmo documento.
 */
export class EnviarContratoPorWebhook {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly ocupacoes: OcupacaoRepository,
    private readonly imoveis: ImovelRepository,
    private readonly inquilinos: InquilinoRepository,
    private readonly storage: StorageService,
    private readonly webhook: WebhookContratoService,
    private readonly gerarPdf: GerarContratoPdf,
  ) {}

  async executar(contratoId: string): Promise<{ numero: string }> {
    if (!this.webhook.configurado()) {
      throw new RegraDeNegocioViolada(
        "Envio automático não configurado. Defina N8N_WEBHOOK_CONTRATO_URL no .env do servidor.",
      );
    }

    const fontes = {
      contratos: this.contratos,
      ocupacoes: this.ocupacoes,
      imoveis: this.imoveis,
      inquilinos: this.inquilinos,
    };

    const { imovel, inquilino, ...carregado } = await carregarContrato(contratoId, fontes);

    // Sem PDF ainda: gera agora, para o arquivo enviado ser o mesmo do painel.
    const contrato = carregado.contrato.arquivoPdfUrl
      ? carregado.contrato
      : await this.gerarPdf.executar(contratoId);

    const bytes = await this.storage.ler(chaveDeUrl(contrato.arquivoPdfUrl!));
    if (!bytes) {
      throw new RegraDeNegocioViolada(
        "O PDF deste contrato não está mais disponível. Gere o PDF novamente e repita o envio.",
      );
    }

    const payload = {
      evento: "contrato.gerado" as const,
      contrato: {
        id: contrato.id,
        numero: contrato.numero,
        status: contrato.status,
        dataInicio: contrato.condicoes.dataInicio,
        dataFim: contrato.condicoes.dataFim,
        valorAluguel: contrato.condicoes.valorAluguel,
      },
      locatario: {
        nome: inquilino.nome,
        documento: formatarCpfCnpj(inquilino.documento),
        rg: inquilino.rg,
        telefone: comDdi(inquilino.telefone),
        email: inquilino.email,
      },
      imovel: { titulo: imovel.titulo, endereco: Endereco.completo(imovel.endereco) },
      pdf: {
        nomeArquivo: nomeArquivoPdf(contrato.numero),
        tipo: "application/pdf" as const,
        base64: Buffer.from(bytes).toString("base64"),
      },
    };

    // A falha é do fluxo externo, não um bug: vira erro de domínio para que a
    // tela mostre o motivo ("o n8n respondeu 502") em vez de "algo deu errado".
    try {
      await this.webhook.enviar(payload);
    } catch (erro) {
      throw new RegraDeNegocioViolada(
        `Não foi possível entregar o contrato ao fluxo do n8n. ${
          erro instanceof Error ? erro.message : ""
        }`.trim(),
      );
    }

    return { numero: contrato.numero };
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
