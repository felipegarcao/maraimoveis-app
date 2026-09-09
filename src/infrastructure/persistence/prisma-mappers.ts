import type {
  Contrato as ContratoRow,
  FotoImovel as FotoRow,
  Imovel as ImovelRow,
  Inquilino as InquilinoRow,
  Lead as LeadRow,
  Ocupacao as OcupacaoRow,
  Pagamento as PagamentoRow,
  Recebimento as RecebimentoRow,
  Usuario as UsuarioRow,
} from "@prisma/client";
import type {
  Contrato,
  Imovel,
  Inquilino,
  Lead,
  Ocupacao,
  Pagamento,
  RegistroPagamento,
  Usuario,
} from "@/domain/entities";

/**
 * Tradução entre as linhas do Postgres e as entidades do domínio.
 *
 * Duas conversões concentram todo o cuidado:
 * - `Decimal` do Prisma vira `number`, porque o domínio trabalha em reais.
 * - Colunas `date` voltam como Date à meia-noite **UTC**; a fatia do ISO
 *   preserva exatamente o dia gravado, sem escorregar de fuso.
 */
interface ComToNumber {
  toNumber(): number;
}

const dinheiro = (valor: ComToNumber): number => valor.toNumber();

/** Coluna `date` → "yyyy-MM-dd". */
const dia = (valor: Date): string => valor.toISOString().slice(0, 10);

/** "yyyy-MM-dd" → Date à meia-noite UTC, para gravar numa coluna `date`. */
export const paraColunaData = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

/** Coluna `timestamptz` → ISO completo. */
const instante = (valor: Date): string => valor.toISOString();

export function paraImovel(row: ImovelRow & { fotos: FotoRow[] }): Imovel {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    tipo: row.tipo,
    status: row.status,
    endereco: {
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento ?? undefined,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
    },
    valorAluguel: dinheiro(row.valorAluguel),
    valorCondominio: dinheiro(row.valorCondominio),
    valorIptu: dinheiro(row.valorIptu),
    caracteristicas: {
      quartos: row.quartos,
      suites: row.suites,
      banheiros: row.banheiros,
      vagas: row.vagas,
      areaM2: row.areaM2 ? dinheiro(row.areaM2) : undefined,
      mobiliado: row.mobiliado,
      aceitaPet: row.aceitaPet,
      condominio: row.condominio,
    },
    fotos: [...row.fotos]
      .sort((a, b) => a.ordem - b.ordem)
      .map((foto) => ({
        id: foto.id,
        url: foto.url,
        descricao: foto.descricao,
        ordem: foto.ordem,
      })),
    criadoEm: instante(row.criadoEm),
    atualizadoEm: instante(row.atualizadoEm),
  };
}

export function paraInquilino(row: InquilinoRow): Inquilino {
  return {
    id: row.id,
    nome: row.nome,
    tipoDocumento: row.tipoDocumento,
    documento: row.documento,
    rg: row.rg ?? undefined,
    email: row.email ?? undefined,
    telefone: row.telefone,
    profissao: row.profissao ?? undefined,
    observacoes: row.observacoes ?? undefined,
    ativo: row.ativo,
    dataCadastro: instante(row.dataCadastro),
    atualizadoEm: instante(row.atualizadoEm),
  };
}

export function paraOcupacao(row: OcupacaoRow): Ocupacao {
  return {
    id: row.id,
    imovelId: row.imovelId,
    inquilinoId: row.inquilinoId,
    dataEntrada: dia(row.dataEntrada),
    dataSaida: row.dataSaida ? dia(row.dataSaida) : null,
    status: row.status,
    valorAluguel: dinheiro(row.valorAluguel),
    diaVencimento: row.diaVencimento,
    valorCaucao: dinheiro(row.valorCaucao),
    motivoSaida: row.motivoSaida ?? undefined,
    condicoesEntrega: row.condicoesEntrega ?? undefined,
    observacoes: row.observacoes ?? undefined,
    criadoEm: instante(row.criadoEm),
  };
}

export function paraContrato(row: ContratoRow): Contrato {
  return {
    id: row.id,
    ocupacaoId: row.ocupacaoId,
    numero: row.numero,
    status: row.status,
    condicoes: {
      valorAluguel: dinheiro(row.valorAluguel),
      valorCaucao: dinheiro(row.valorCaucao),
      diaVencimento: row.diaVencimento,
      prazoMeses: row.prazoMeses,
      indiceReajuste: row.indiceReajuste,
      dataInicio: dia(row.dataInicio),
      dataFim: dia(row.dataFim),
      clausulasAdicionais: row.clausulasAdicionais ?? undefined,
    },
    arquivoPdfUrl: row.arquivoPdfUrl,
    dataGeracao: row.dataGeracao ? instante(row.dataGeracao) : null,
    statusAssinatura: row.statusAssinatura,
    assinaturaTelefone: row.assinaturaTelefone,
    assinaturaEnviadaEm: row.assinaturaEnviadaEm ? instante(row.assinaturaEnviadaEm) : null,
    assinaturaOrigem: row.assinaturaOrigem,
    arquivoAssinadoUrl: row.arquivoAssinadoUrl,
    assinadoEm: row.assinadoEm ? instante(row.assinadoEm) : null,
    criadoEm: instante(row.criadoEm),
  };
}

export function paraRecebimento(row: RecebimentoRow): RegistroPagamento {
  return {
    id: row.id,
    valor: dinheiro(row.valor),
    data: dia(row.data),
    forma: row.forma,
    observacao: row.observacao ?? undefined,
  };
}

export function paraPagamento(row: PagamentoRow & { recebimentos: RecebimentoRow[] }): Pagamento {
  return {
    id: row.id,
    ocupacaoId: row.ocupacaoId,
    mesReferencia: row.mesReferencia,
    valorAluguel: dinheiro(row.valorAluguel),
    valorAgua: dinheiro(row.valorAgua),
    valorLuz: dinheiro(row.valorLuz),
    outrosValores: dinheiro(row.outrosValores),
    descricaoOutros: row.descricaoOutros ?? undefined,
    dataVencimento: dia(row.dataVencimento),
    recebimentos: row.recebimentos.map(paraRecebimento),
    criadoEm: instante(row.criadoEm),
  };
}

export function paraUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel,
    ativo: row.ativo,
    criadoEm: instante(row.criadoEm),
  };
}

export function paraLead(row: LeadRow): Lead {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    mensagem: row.mensagem,
    origem: row.origem,
    imovelId: row.imovelId,
    status: row.status,
    criadoEm: instante(row.criadoEm),
  };
}
